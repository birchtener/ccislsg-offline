"use server";

import { db } from "@/lib/prisma";
import { checkPermission } from "@/features/auth/lib/permissions";
import { logAudit } from "@/features/audit-logs/actions/audit";
import { revalidatePath } from "next/cache";
import { FeeType, StockActionType } from "@/lib/generated/prisma/client";
import { checkGeofence } from "@/hooks/use-geofence";

function verifyServerGeofence(coordinates?: { latitude: number; longitude: number }) {
  if (!coordinates) return { ok: true };
  const check = checkGeofence(coordinates);
  if (!check.isWithinFence) {
    return {
      ok: false,
      error: `Geofence Violation: You are ${check.formattedDistance} away from campus. Payment operations require physical presence within campus boundaries.`,
    };
  }
  return { ok: true };
}

function serializeFeeItem(item: any) {
  if (!item) return item;
  return {
    ...item,
    price: Number(item.price),
    stock_logs: item.stock_logs ? item.stock_logs.map(serializeStockLog) : undefined,
  };
}

function serializeTransaction(tx: any) {
  if (!tx) return tx;
  return {
    ...tx,
    total_amount: Number(tx.total_amount),
    items: tx.items
      ? tx.items.map((it: any) => ({
          ...it,
          unit_price: Number(it.unit_price),
          subtotal: Number(it.subtotal),
          item: serializeFeeItem(it.item),
        }))
      : undefined,
  };
}

function serializeStockLog(log: any) {
  if (!log) return log;
  return {
    ...log,
    item: log.item ? serializeFeeItem(log.item) : undefined,
  };
}

export async function GetPaymentsDashboardData() {
  const permRead = await checkPermission("payment:read");
  const permItem = await checkPermission("item:read");
  if (!permRead.authorized && !permItem.authorized) {
    return { ok: false, error: permRead.error || "Forbidden: Insufficient permissions" };
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalAgg, todayAgg, feeItems, transactions, stockLogs, auditLogs] = await Promise.all([
      db.transaction.aggregate({
        _sum: { total_amount: true },
        where: { status: { not: "VOIDED" } },
      }),
      db.transaction.aggregate({
        _sum: { total_amount: true },
        _count: { id: true },
        where: {
          status: { not: "VOIDED" },
          created_at: { gte: today },
        },
      }),
      db.feeItem.findMany({
        include: {
          created_user: {
            select: { id: true, name: true, first_name: true, last_name: true },
          },
          variants: {
            orderBy: { name: "asc" },
          },
          stock_logs: {
            include: {
              actor: {
                select: { id: true, name: true, first_name: true, last_name: true },
              },
              variant: true,
            },
            orderBy: { created_at: "desc" },
            take: 10,
          },
        },
        orderBy: { name: "asc" },
      }),
      db.transaction.findMany({
        take: 200,
        include: {
          student: true,
          staff: {
            select: { id: true, name: true, first_name: true, last_name: true },
          },
          items: {
            include: {
              item: true,
              variant: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
      }),
      db.feeItemStockLog.findMany({
        include: {
          item: true,
          variant: true,
          actor: {
            select: { id: true, name: true, first_name: true, last_name: true },
          },
        },
        orderBy: { created_at: "desc" },
        take: 50,
      }),
      db.auditLog.findMany({
        where: { category: "payments" },
        include: {
          user: {
            select: { id: true, name: true, first_name: true, last_name: true },
          },
        },
        orderBy: { created_at: "desc" },
        take: 50,
      }),
    ]);

    const totalRevenue = Number(totalAgg._sum.total_amount || 0);
    const todayRevenue = Number(todayAgg._sum.total_amount || 0);
    const todayTransactionsCount = todayAgg._count.id || 0;

    let cfRevenue = 0;
    let mfRevenue = 0;
    let mfUnitsSold = 0;

    transactions.forEach((tx) => {
      if (tx.status === "VOIDED") return;
      tx.items.forEach((item) => {
        const itemSubtotal = Number(item.subtotal);
        if (item.item.type === "cf") {
          cfRevenue += itemSubtotal;
        } else if (item.item.type === "mf") {
          mfRevenue += itemSubtotal;
          mfUnitsSold += item.quantity;
        }
      });
    });

    const serializedFeeItems = feeItems.map(serializeFeeItem);
    const serializedTransactions = transactions.map(serializeTransaction);
    const serializedStockLogs = stockLogs.map(serializeStockLog);

    return {
      ok: true,
      data: {
        feeItems: serializedFeeItems,
        transactions: serializedTransactions,
        stockLogs: serializedStockLogs,
        auditLogs,
        stats: {
          todayTransactionsCount,
          todayRevenue,
          totalRevenue,
          cfRevenue,
          mfRevenue,
          mfUnitsSold,
          totalFeeItems: feeItems.length,
        },
      },
    };
  } catch (err: any) {
    console.error("GetPaymentsDashboardData error:", err);
    return { ok: false, error: "Failed to fetch payments data." };
  }
}

export async function CreateFeeItem(data: {
  name: string;
  description?: string;
  price: number;
  type: "cf" | "mf";
  has_variants?: boolean;
  initialQuantity?: number;
  variants?: Array<{ name: string; quantity: number }>;
  coordinates?: { latitude: number; longitude: number };
}) {
  const { authorized, user, error } = await checkPermission("item:create");
  if (!authorized || !user) {
    return { ok: false, error: error || "Forbidden: Insufficient permissions" };
  }

  const geoCheck = verifyServerGeofence(data.coordinates);
  if (!geoCheck.ok) return geoCheck;

  if (!data.name || typeof data.name !== "string" || !data.name.trim()) {
    return { ok: false, error: "Item name is required." };
  }

  if (typeof data.price !== "number" || isNaN(data.price) || data.price < 0) {
    return { ok: false, error: "Price must be a positive number." };
  }

  try {
    const createdItem = await db.$transaction(async (tx) => {
      let totalQty = 0;
      if (data.type === "mf") {
        if (data.has_variants && data.variants && data.variants.length > 0) {
          totalQty = data.variants.reduce((sum, v) => sum + (v.quantity || 0), 0);
        } else {
          totalQty = data.initialQuantity || 0;
        }
      }

      const item = await tx.feeItem.create({
        data: {
          name: data.name.trim(),
          description: data.description?.trim() || null,
          price: data.price,
          type: data.type as FeeType,
          has_variants: Boolean(data.has_variants && data.type === "mf"),
          quantity: totalQty,
          created_by: user.id,
        },
      });

      if (data.type === "mf") {
        if (data.has_variants && data.variants && data.variants.length > 0) {
          for (const v of data.variants) {
            if (!v.name.trim()) continue;
            const variantQty = Math.max(0, v.quantity || 0);
            const variant = await tx.feeItemVariant.create({
              data: {
                item_id: item.id,
                name: v.name.trim(),
                quantity: variantQty,
              },
            });

            if (variantQty > 0) {
              await tx.feeItemStockLog.create({
                data: {
                  item_id: item.id,
                  variant_id: variant.id,
                  actor_id: user.id,
                  action_type: "ADD" as StockActionType,
                  quantity_change: variantQty,
                  previous_quantity: 0,
                  new_quantity: variantQty,
                  reason: `Initial variant creation (${variant.name})`,
                },
              });
            }
          }
        } else if (totalQty > 0) {
          await tx.feeItemStockLog.create({
            data: {
              item_id: item.id,
              actor_id: user.id,
              action_type: "ADD" as StockActionType,
              quantity_change: totalQty,
              previous_quantity: 0,
              new_quantity: totalQty,
              reason: "Initial stock creation",
            },
          });
        }
      }

      return item;
    });

    await logAudit({
      log: `Created fee item "${createdItem.name}" (${data.type === "cf" ? "College Fee" : "Merchandise"}, Price: ₱${data.price.toFixed(2)})`,
      type: "info",
      category: "payments",
    });

    revalidatePath("/dashboard/payments");
    revalidatePath("/dashboard/payments/items");
    return { ok: true, item: serializeFeeItem(createdItem) };
  } catch (err: any) {
    console.error("CreateFeeItem error:", err);
    return { ok: false, error: "Failed to create fee item." };
  }
}

export async function UpdateFeeItem(data: {
  itemId: string;
  name: string;
  description?: string;
  price: number;
  coordinates?: { latitude: number; longitude: number };
}) {
  const { authorized, user, error } = await checkPermission("item:update");
  if (!authorized || !user) {
    return { ok: false, error: error || "Forbidden: Insufficient permissions" };
  }

  const geoCheck = verifyServerGeofence(data.coordinates);
  if (!geoCheck.ok) return geoCheck;

  try {
    const updated = await db.feeItem.update({
      where: { id: data.itemId },
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        price: data.price,
      },
    });

    await logAudit({
      log: `Updated fee item "${updated.name}" details (Price: ₱${updated.price})`,
      type: "info",
      category: "payments",
    });

    revalidatePath("/dashboard/payments");
    revalidatePath("/dashboard/payments/items");
    return { ok: true, item: serializeFeeItem(updated) };
  } catch (err: any) {
    console.error("UpdateFeeItem error:", err);
    return { ok: false, error: "Failed to update fee item." };
  }
}

export async function DeleteFeeItem(
  itemId: string,
  coordinates?: { latitude: number; longitude: number }
) {
  const { authorized, user, error } = await checkPermission("item:delete");
  if (!authorized || !user) {
    return { ok: false, error: error || "Forbidden: Insufficient permissions" };
  }

  const geoCheck = verifyServerGeofence(coordinates);
  if (!geoCheck.ok) return geoCheck;

  try {
    const existingTransactions = await db.transactionItem.count({
      where: { item_id: itemId },
    });

    if (existingTransactions > 0) {
      return {
        ok: false,
        error: "Cannot delete item with existing payment transactions.",
      };
    }

    const item = await db.feeItem.findUnique({ where: { id: itemId } });
    if (!item) {
      return { ok: false, error: "Item not found." };
    }

    await db.feeItem.delete({ where: { id: itemId } });

    await logAudit({
      log: `Deleted fee item "${item.name}"`,
      type: "warn",
      category: "payments",
    });

    revalidatePath("/dashboard/payments");
    revalidatePath("/dashboard/payments/items");
    return { ok: true };
  } catch (err: any) {
    console.error("DeleteFeeItem error:", err);
    return { ok: false, error: "Failed to delete fee item." };
  }
}

export async function AdjustFeeItemStock(data: {
  itemId: string;
  variantId?: string;
  quantityChange: number;
  actionType: "ADD" | "REDUCE" | "ADJUSTMENT";
  reason?: string;
  coordinates?: { latitude: number; longitude: number };
}) {
  const { authorized, user, error } = await checkPermission("item:update");
  if (!authorized || !user) {
    return { ok: false, error: error || "Forbidden: Insufficient permissions" };
  }

  const geoCheck = verifyServerGeofence(data.coordinates);
  if (!geoCheck.ok) return geoCheck;

  if (typeof data.quantityChange !== "number" || isNaN(data.quantityChange) || data.quantityChange === 0) {
    return { ok: false, error: "Quantity change must be a non-zero number." };
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const item = await tx.feeItem.findUnique({
        where: { id: data.itemId },
        include: { variants: true },
      });

      if (!item) {
        throw new Error("Item not found.");
      }

      let effectiveChange = data.quantityChange;
      if (data.actionType === "REDUCE") {
        effectiveChange = -Math.abs(data.quantityChange);
      } else if (data.actionType === "ADD") {
        effectiveChange = Math.abs(data.quantityChange);
      }

      if (data.variantId) {
        const variant = await tx.feeItemVariant.findUnique({
          where: { id: data.variantId },
        });
        if (!variant) {
          throw new Error("Variant not found.");
        }

        const prevVarQty = variant.quantity;
        const newVarQty = prevVarQty + effectiveChange;
        if (newVarQty < 0) {
          throw new Error(`Cannot reduce variant stock below 0. Available: ${prevVarQty}`);
        }

        const updatedVariant = await tx.feeItemVariant.update({
          where: { id: data.variantId },
          data: { quantity: newVarQty },
        });

        const allVariants = await tx.feeItemVariant.findMany({
          where: { item_id: data.itemId },
        });
        const totalQty = allVariants.reduce((sum, v) => sum + v.quantity, 0);
        await tx.feeItem.update({
          where: { id: data.itemId },
          data: { quantity: totalQty },
        });

        const log = await tx.feeItemStockLog.create({
          data: {
            item_id: data.itemId,
            variant_id: data.variantId,
            actor_id: user.id,
            action_type: data.actionType as StockActionType,
            quantity_change: effectiveChange,
            previous_quantity: prevVarQty,
            new_quantity: newVarQty,
            reason: data.reason || null,
          },
          include: { actor: true, variant: true },
        });

        return { item, variant: updatedVariant, log };
      } else {
        const prevQty = item.quantity;
        const newQty = prevQty + effectiveChange;
        if (newQty < 0) {
          throw new Error(`Cannot reduce item stock below 0. Available: ${prevQty}`);
        }

        const updatedItem = await tx.feeItem.update({
          where: { id: data.itemId },
          data: { quantity: newQty },
        });

        const log = await tx.feeItemStockLog.create({
          data: {
            item_id: data.itemId,
            actor_id: user.id,
            action_type: data.actionType as StockActionType,
            quantity_change: effectiveChange,
            previous_quantity: prevQty,
            new_quantity: newQty,
            reason: data.reason || null,
          },
          include: { actor: true },
        });

        return { item: updatedItem, log };
      }
    });

    const targetName = result.variant
      ? `"${result.item.name}" (Variant: ${result.variant.name})`
      : `"${result.item.name}"`;

    await logAudit({
      log: `Adjusted stock for ${targetName} (${data.actionType}: ${result.log.quantity_change > 0 ? "+" : ""}${result.log.quantity_change}). New stock: ${result.log.new_quantity}. Reason: ${data.reason || "None"}`,
      type: "info",
      category: "payments",
    });

    revalidatePath("/dashboard/payments");
    revalidatePath("/dashboard/payments/items");
    return { ok: true };
  } catch (err: any) {
    console.error("AdjustFeeItemStock error:", err);
    return { ok: false, error: err.message || "Failed to adjust stock." };
  }
}

export async function CreateTransaction(data: {
  af_number: string;
  student_identifier: string;
  items: Array<{
    item_id: string;
    variant_id?: string;
    quantity: number;
  }>;
  payment_method?: string;
  remarks?: string;
  coordinates?: { latitude: number; longitude: number };
}) {
  const { authorized, user, error } = await checkPermission("payment:collect");
  if (!authorized || !user) {
    return { ok: false, error: error || "Forbidden: Insufficient permissions" };
  }

  const geoCheck = verifyServerGeofence(data.coordinates);
  if (!geoCheck.ok) return geoCheck;

  const rawAf = data.af_number.trim();
  const afRegex = /^\d{4}-\d{4}$/;
  if (!afRegex.test(rawAf)) {
    return {
      ok: false,
      error: "Invalid AF Number format. Must be 8 digits formatted as XXXX-XXXX (e.g. 2526-0001).",
    };
  }

  if (!data.student_identifier || !data.student_identifier.trim()) {
    return { ok: false, error: "Student ID is required." };
  }

  if (!data.items || data.items.length === 0) {
    return { ok: false, error: "At least one fee item must be selected." };
  }

  try {
    const cleanStudentId = data.student_identifier.trim();
    const student = await db.student.findFirst({
      where: {
        OR: [
          { student_id: cleanStudentId },
          { id: cleanStudentId },
        ],
      },
    });

    if (!student) {
      return {
        ok: false,
        error: `Student not found with ID "${cleanStudentId}". Please verify the student ID.`,
      };
    }

    const transaction = await db.$transaction(async (tx) => {
      const existingAf = await tx.transaction.findFirst({
        where: { af_number: rawAf },
      });
      if (existingAf) {
        throw new Error(`AF Number "${rawAf}" already exists in records.`);
      }

      let totalAmount = 0;
      const preparedItems: Array<{
        item_id: string;
        variant_id?: string | null;
        quantity: number;
        unit_price: number;
        subtotal: number;
      }> = [];

      for (const reqItem of data.items) {
        if (reqItem.quantity <= 0) continue;

        const feeItem = await tx.feeItem.findUnique({
          where: { id: reqItem.item_id },
          include: { variants: true },
        });

        if (!feeItem) {
          throw new Error("Selected fee item not found.");
        }

        let unitPrice = Number(feeItem.price);
        let variantObj: any = null;

        if (feeItem.type === "mf") {
          if (feeItem.has_variants && reqItem.variant_id) {
            variantObj = await tx.feeItemVariant.findUnique({
              where: { id: reqItem.variant_id },
            });
            if (!variantObj) {
              throw new Error(`Variant not found for item "${feeItem.name}".`);
            }

            if (variantObj.quantity < reqItem.quantity) {
              throw new Error(
                `Insufficient stock for "${feeItem.name} (${variantObj.name})". In stock: ${variantObj.quantity}, requested: ${reqItem.quantity}.`
              );
            }

            const newVarQty = variantObj.quantity - reqItem.quantity;
            await tx.feeItemVariant.update({
              where: { id: variantObj.id },
              data: { quantity: newVarQty },
            });

            const allVariants = await tx.feeItemVariant.findMany({
              where: { item_id: feeItem.id },
            });
            const totalQty = allVariants.reduce((sum, v) => sum + v.quantity, 0);
            await tx.feeItem.update({
              where: { id: feeItem.id },
              data: { quantity: totalQty },
            });

            await tx.feeItemStockLog.create({
              data: {
                item_id: feeItem.id,
                variant_id: variantObj.id,
                actor_id: user.id,
                action_type: "REDUCE" as StockActionType,
                quantity_change: -reqItem.quantity,
                previous_quantity: variantObj.quantity,
                new_quantity: newVarQty,
                reason: `Sold via AF# ${rawAf}`,
              },
            });
          } else {
            if (feeItem.quantity < reqItem.quantity) {
              throw new Error(
                `Insufficient stock for "${feeItem.name}". In stock: ${feeItem.quantity}, requested: ${reqItem.quantity}.`
              );
            }

            const newQty = feeItem.quantity - reqItem.quantity;
            await tx.feeItem.update({
              where: { id: feeItem.id },
              data: { quantity: newQty },
            });

            await tx.feeItemStockLog.create({
              data: {
                item_id: feeItem.id,
                actor_id: user.id,
                action_type: "REDUCE" as StockActionType,
                quantity_change: -reqItem.quantity,
                previous_quantity: feeItem.quantity,
                new_quantity: newQty,
                reason: `Sold via AF# ${rawAf}`,
              },
            });
          }
        }

        const subtotal = unitPrice * reqItem.quantity;
        totalAmount += subtotal;

        preparedItems.push({
          item_id: feeItem.id,
          variant_id: reqItem.variant_id || null,
          quantity: reqItem.quantity,
          unit_price: unitPrice,
          subtotal,
        });
      }

      const txRecord = await tx.transaction.create({
        data: {
          af_number: rawAf,
          student_id: student.id,
          staff_id: user.id,
          total_amount: totalAmount,
          payment_method: data.payment_method || "CASH",
          remarks: data.remarks?.trim() || null,
          items: {
            create: preparedItems,
          },
        },
        include: {
          student: true,
          staff: true,
          items: {
            include: { item: true, variant: true },
          },
        },
      });

      return txRecord;
    });

    await logAudit({
      log: `Recorded payment transaction AF# ${transaction.af_number} for Student ${student.first_name} ${student.last_name} (${student.student_id}). Total: ₱${Number(transaction.total_amount).toFixed(2)}`,
      type: "info",
      category: "payments",
    });

    revalidatePath("/dashboard/payments");
    revalidatePath("/dashboard/payments/transactions");
    return { ok: true, transaction: serializeTransaction(transaction) };
  } catch (err: any) {
    console.error("CreateTransaction error:", err);
    return { ok: false, error: err.message || "Failed to record transaction." };
  }
}

export async function VoidTransaction(data: {
  transactionId: string;
  reason?: string;
  coordinates?: { latitude: number; longitude: number };
}) {
  const { authorized, user, error } = await checkPermission("payment:void");
  if (!authorized || !user) {
    return { ok: false, error: error || "Forbidden: Insufficient permissions" };
  }

  const geoCheck = verifyServerGeofence(data.coordinates);
  if (!geoCheck.ok) return geoCheck;

  try {
    const txRecord = await db.transaction.findUnique({
      where: { id: data.transactionId },
      include: {
        items: { include: { item: true, variant: true } },
        student: true,
      },
    });

    if (!txRecord) {
      return { ok: false, error: "Transaction record not found." };
    }

    if (txRecord.status === "VOIDED") {
      return { ok: false, error: "Transaction is already voided." };
    }

    await db.$transaction(async (tx) => {
      await tx.transaction.update({
        where: { id: data.transactionId },
        data: { status: "VOIDED" },
      });

      for (const item of txRecord.items) {
        if (item.item.type === "mf") {
          if (item.variant_id && item.variant) {
            const currentVar = await tx.feeItemVariant.findUnique({
              where: { id: item.variant_id },
            });
            const prevQty = currentVar?.quantity ?? item.variant.quantity;
            const newQty = prevQty + item.quantity;

            await tx.feeItemVariant.update({
              where: { id: item.variant_id },
              data: { quantity: newQty },
            });

            const allVariants = await tx.feeItemVariant.findMany({
              where: { item_id: item.item_id },
            });
            const totalQty = allVariants.reduce((sum, v) => sum + v.quantity, 0);
            await tx.feeItem.update({
              where: { id: item.item_id },
              data: { quantity: totalQty },
            });

            await tx.feeItemStockLog.create({
              data: {
                item_id: item.item_id,
                variant_id: item.variant_id,
                actor_id: user.id,
                action_type: "ADD" as StockActionType,
                quantity_change: item.quantity,
                previous_quantity: prevQty,
                new_quantity: newQty,
                reason: `Restored stock from voided AF# ${txRecord.af_number}. Reason: ${data.reason || "Void transaction"}`,
              },
            });
          } else {
            const currentItem = await tx.feeItem.findUnique({
              where: { id: item.item_id },
            });
            const prevQty = currentItem?.quantity ?? item.item.quantity;
            const newQty = prevQty + item.quantity;

            await tx.feeItem.update({
              where: { id: item.item_id },
              data: { quantity: newQty },
            });

            await tx.feeItemStockLog.create({
              data: {
                item_id: item.item_id,
                actor_id: user.id,
                action_type: "ADD" as StockActionType,
                quantity_change: item.quantity,
                previous_quantity: prevQty,
                new_quantity: newQty,
                reason: `Restored stock from voided AF# ${txRecord.af_number}. Reason: ${data.reason || "Void transaction"}`,
              },
            });
          }
        }
      }
    });

    await logAudit({
      log: `Voided payment transaction AF# ${txRecord.af_number} for Student ${txRecord.student.first_name} ${txRecord.student.last_name} (${txRecord.student.student_id}). Reason: ${data.reason || "None"}`,
      type: "warn",
      category: "payments",
    });

    revalidatePath("/dashboard/payments");
    revalidatePath("/dashboard/payments/transactions");
    return { ok: true };
  } catch (err: any) {
    console.error("VoidTransaction error:", err);
    return { ok: false, error: "Failed to void transaction." };
  }
}

export async function GetStudentByStudentId(studentId: string) {
  const permRead = await checkPermission("payment:collect");
  const permStudents = await checkPermission("students:read");
  if (!permRead.authorized && !permStudents.authorized) {
    return { ok: false, error: "Forbidden: Insufficient permissions" };
  }

  const clean = studentId.trim();
  if (!clean) return { ok: false, error: "Student ID required." };

  try {
    const student = await db.student.findFirst({
      where: {
        OR: [
          { student_id: clean },
          { id: clean },
        ],
      },
    });

    if (!student) {
      return { ok: false, error: "Student not found." };
    }

    return { ok: true, student };
  } catch (err: any) {
    return { ok: false, error: "Error looking up student." };
  }
}
