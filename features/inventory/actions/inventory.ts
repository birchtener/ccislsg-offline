"use server";

import { db } from "@/lib/prisma";
import { checkPermission } from "@/features/auth/lib/permissions";
import { logAudit } from "@/features/audit-logs/actions/audit";
import { CategoryType, AssetItemStatus, StockActionType } from "@/lib/generated/prisma/client";
import { revalidatePath } from "next/cache";

let categoriesEnsured = false;

async function ensureDefaultCategories() {
  if (categoriesEnsured) return;
  const count = await db.inventoryCategory.count();
  if (count === 0) {
    await db.inventoryCategory.createMany({
      data: [
        { name: "Default", description: "Default category for unassigned or reallocated inventory items" },
        { name: "Office", description: "Office tools, stationery, paper, desks, and supplies" },
        { name: "Medicine & Health", description: "First aid kits, emergency medication, and clinic supplies" },
        { name: "Cleaning & Sanitation", description: "Janitorial supplies, disinfectants, and hygiene products" },
        { name: "IT & Computing", description: "Computers, network switches, cables, and hardware components" },
        { name: "Audio & Visual", description: "Microphones, speakers, projectors, and multimedia gear" },
        { name: "Sports & Recreation", description: "Balls, nets, sports kits, and recreational gear" },
        { name: "Laboratory", description: "Lab testing tools, experimental kits, and measuring devices" },
        { name: "Furniture & Fixtures", description: "Chairs, tables, cabinets, and boards" },
        { name: "Appliances", description: "Air conditioners, fans, and electrical appliances" },
        { name: "Events & Logistics", description: "Banners, event equipment, decorations, and props" },
      ],
    });
  } else {
    // Ensure Default category exists even if other categories were already seeded
    const hasDefault = await db.inventoryCategory.findFirst({
      where: { name: "Default" },
    });
    if (!hasDefault) {
      await db.inventoryCategory.create({
        data: {
          name: "Default",
          description: "Default category for unassigned or reallocated inventory items",
        },
      });
    }
  }
  categoriesEnsured = true;
}

export async function GetInventoryCategories() {
  await ensureDefaultCategories();
  try {
    const categories = await db.inventoryCategory.findMany({
      orderBy: { name: "asc" },
    });
    return { ok: true, categories };
  } catch (error) {
    console.error("GetInventoryCategories error:", error);
    return { ok: false, error: "Failed to fetch categories." };
  }
}

export async function GetNextItemCode(type: CategoryType) {
  try {
    let prefix = "P";
    if (type === "PROPERTY") prefix = "P";
    else if (type === "EQUIPMENT") prefix = "E";
    else if (type === "SUPPLIES") prefix = "S";

    const [existingAssets, existingItems] = await Promise.all([
      db.inventoryAsset.findMany({
        where: {
          asset_tag: {
            startsWith: `CCISLSG-${prefix}-`,
          },
        },
        select: { asset_tag: true },
      }),
      db.inventoryItem.findMany({
        where: {
          item_code: {
            startsWith: `CCISLSG-${prefix}-`,
          },
        },
        select: { item_code: true },
      }),
    ]);

    const tags = new Set<string>();
    existingAssets.forEach((a) => tags.add(a.asset_tag));
    existingItems.forEach((i) => {
      if (i.item_code) tags.add(i.item_code);
    });

    let maxSeq = 0;
    for (const tag of tags) {
      const parts = tag.split("-");
      const seqStr = parts[parts.length - 1];
      const seqNum = parseInt(seqStr, 10);
      if (!isNaN(seqNum) && seqNum > maxSeq) {
        maxSeq = seqNum;
      }
    }

    const nextSeq = String(maxSeq + 1).padStart(3, "0");
    return { ok: true, prefix: `CCISLSG-${prefix}-`, nextSeq, fullCode: `CCISLSG-${prefix}-${nextSeq}` };
  } catch (error) {
    console.error("GetNextItemCode error:", error);
    return { ok: false, error: "Failed to calculate next code sequence." };
  }
}

export async function CreateInventoryItem(data: {
  name: string;
  description?: string;
  type?: CategoryType;
  category_id: string;
  quantity: number;
  unit?: string;
  date_purchased?: string | Date | null;
  item_code?: string;
  serial_number?: string;
  source_of_fund?: string;
  condition?: string;
}) {
  const { authorized, user, error } = await checkPermission("inventory:create");
  if (!authorized || !user) {
    return { ok: false, error: error || "Forbidden: Insufficient permissions" };
  }

  try {
    const category = await db.inventoryCategory.findUnique({
      where: { id: data.category_id },
    });

    if (!category) {
      return { ok: false, error: "Category not found." };
    }

    const itemType = data.type || "SUPPLIES";
    const itemUnit = data.unit?.trim() || "pcs";
    let finalItemCode = itemType === "SUPPLIES" ? null : (data.item_code?.trim() || null);
    const finalSerialNumber = itemType === "SUPPLIES" ? null : (data.serial_number?.trim() || null);

    if (finalItemCode) {
      const existingItemWithCode = await db.inventoryItem.findFirst({
        where: { item_code: finalItemCode },
      });
      const existingAssetWithCode = await db.inventoryAsset.findFirst({
        where: { asset_tag: finalItemCode },
      });

      if (existingItemWithCode || existingAssetWithCode) {
        return { ok: false, error: `Item Code "${finalItemCode}" is already in use. Please choose another.` };
      }
    }

    const generatedTags: string[] = [];

    const item = await db.$transaction(async (tx) => {
      const createdItem = await tx.inventoryItem.create({
        data: {
          name: data.name,
          description: data.description,
          type: itemType,
          category_id: data.category_id,
          quantity: data.quantity,
          unit: itemUnit,
          item_code: finalItemCode,
          serial_number: finalSerialNumber,
          source_of_fund: data.source_of_fund?.trim() || null,
          created_by: user.id,
          date_purchased: data.date_purchased ? new Date(data.date_purchased) : null,
        },
      });

      if (itemType === "SUPPLIES" && data.quantity > 0) {
        await tx.inventoryStockLog.create({
          data: {
            item_id: createdItem.id,
            actor_id: user.id,
            action_type: "ADD" as StockActionType,
            quantity_change: data.quantity,
            previous_quantity: 0,
            new_quantity: data.quantity,
            reason: "Initial stock creation",
          },
        });
      }

      // Only generate physical QR InventoryAsset records for Property & Equipment
      if (itemType === "PROPERTY" || itemType === "EQUIPMENT") {
        let prefix = itemType === "PROPERTY" ? "P" : "E";

        const existingAssets = await tx.inventoryAsset.findMany({
          where: {
            asset_tag: {
              startsWith: `CCISLSG-${prefix}-`,
            },
          },
          select: {
            asset_tag: true,
          },
        });

        const existingTagsSet = new Set(existingAssets.map((a) => a.asset_tag));

        let maxSeq = 0;
        for (const tag of existingTagsSet) {
          const parts = tag.split("-");
          const seqStr = parts[parts.length - 1];
          const seqNum = parseInt(seqStr, 10);
          if (!isNaN(seqNum) && seqNum > maxSeq) {
            maxSeq = seqNum;
          }
        }

        let currentSeq = maxSeq + 1;

        for (let i = 0; i < data.quantity; i++) {
          let assetTag = "";
          if (i === 0 && finalItemCode) {
            assetTag = finalItemCode;
          } else {
            let sequenceNum = String(currentSeq).padStart(3, "0");
            assetTag = `CCISLSG-${prefix}-${sequenceNum}`;

            while (existingTagsSet.has(assetTag)) {
              currentSeq++;
              sequenceNum = String(currentSeq).padStart(3, "0");
              assetTag = `CCISLSG-${prefix}-${sequenceNum}`;
            }
            currentSeq++;
          }

          const qrCode = assetTag;
          existingTagsSet.add(assetTag);
          generatedTags.push(assetTag);

          await tx.inventoryAsset.create({
            data: {
              item_id: createdItem.id,
              asset_tag: assetTag,
              qr_code: qrCode,
              serial_number: i === 0 ? finalSerialNumber : null,
              status: "AVAILABLE" as AssetItemStatus,
              condition: data.condition?.trim() || "Used - Good",
            },
          });
        }
      }

      return createdItem;
    });

    await logAudit({
      log: `Created inventory item "${data.name}" (Code: ${finalItemCode || "N/A"}, Type: ${itemType}) in category "${category.name}" (Quantity: ${data.quantity})`,
      type: "success",
      category: "inventory",
    });

    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/inventory/items");
    return { ok: true, item, generatedTags };
  } catch (err) {
    console.error("CreateInventoryItem error:", err);
    return { ok: false, error: "Failed to create inventory item." };
  }
}

export async function UpdateInventoryItem(data: {
  id: string;
  name: string;
  description?: string;
  type?: CategoryType;
  category_id: string;
  unit?: string;
  item_code?: string;
  serial_number?: string;
  source_of_fund?: string;
  date_purchased?: string | Date | null;
}) {
  const { authorized, user, error } = await checkPermission("inventory:update");
  if (!authorized || !user) {
    return { ok: false, error: error || "Forbidden: Insufficient permissions" };
  }

  try {
    const existing = await db.inventoryItem.findUnique({
      where: { id: data.id },
      include: { category: true, assets: true },
    });

    if (!existing) {
      return { ok: false, error: "Item not found." };
    }

    const newCategory = await db.inventoryCategory.findUnique({
      where: { id: data.category_id },
    });

    if (!newCategory) {
      return { ok: false, error: "Selected category not found." };
    }

    const finalType = data.type || existing.type;
    const finalItemCode = finalType === "SUPPLIES" ? null : (data.item_code?.trim() || null);
    const finalSerialNumber = finalType === "SUPPLIES" ? null : (data.serial_number?.trim() || null);
    const finalUnit = data.unit !== undefined ? (data.unit.trim() || "pcs") : (existing.unit || "pcs");

    if (finalItemCode && finalItemCode !== existing.item_code) {
      const existingItemWithCode = await db.inventoryItem.findFirst({
        where: { item_code: finalItemCode, id: { not: data.id } },
      });
      const existingAssetWithCode = await db.inventoryAsset.findFirst({
        where: { asset_tag: finalItemCode, item_id: { not: data.id } },
      });

      if (existingItemWithCode || existingAssetWithCode) {
        return { ok: false, error: `Item Code "${finalItemCode}" is already in use by another item.` };
      }
    }

    const updated = await db.$transaction(async (tx) => {
      const updatedItem = await tx.inventoryItem.update({
        where: { id: data.id },
        data: {
          name: data.name,
          description: data.description,
          type: finalType,
          category_id: data.category_id,
          unit: finalUnit,
          item_code: finalItemCode,
          serial_number: finalSerialNumber,
          source_of_fund: data.source_of_fund?.trim() || null,
          date_purchased: data.date_purchased ? new Date(data.date_purchased) : null,
        },
      });

      // If single asset and item code changed, sync the asset tag & serial number
      if (existing.assets.length === 1 && finalItemCode && finalItemCode !== existing.assets[0].asset_tag) {
        await tx.inventoryAsset.update({
          where: { id: existing.assets[0].id },
          data: {
            asset_tag: finalItemCode,
            qr_code: finalItemCode,
            serial_number: finalSerialNumber,
          },
        });
      }

      return updatedItem;
    });

    await logAudit({
      log: `Updated inventory item "${updated.name}" (ID: ${data.id})`,
      type: "info",
      category: "inventory",
    });

    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/inventory/items");
    return { ok: true, item: updated };
  } catch (err: any) {
    console.error("UpdateInventoryItem error:", err);
    return { ok: false, error: "Failed to update inventory item." };
  }
}

export async function DisposeInventoryItem(data: {
  itemId: string;
  reason?: string;
}) {
  const { authorized, user, error } = await checkPermission("inventory:delete");
  if (!authorized || !user) {
    return { ok: false, error: error || "Forbidden: Insufficient permissions" };
  }

  try {
    const item = await db.inventoryItem.findUnique({
      where: { id: data.itemId },
      include: {
        assets: { include: { borrows: { where: { returned_at: null } } } },
        borrows: { where: { returned_at: null } },
      },
    });

    if (!item) {
      return { ok: false, error: "Item not found." };
    }

    const hasActiveBorrows =
      item.borrows.length > 0 ||
      item.assets.some((a) => a.borrows.length > 0);

    if (hasActiveBorrows) {
      return { ok: false, error: "Cannot dispose item with active borrows." };
    }

    await db.$transaction(async (tx) => {
      await tx.inventoryItem.update({
        where: { id: data.itemId },
        data: {
          is_disposed: true,
          disposed_at: new Date(),
          disposal_reason: data.reason?.trim() || "Item written off / disposed",
          disposed_by: user.id,
        },
      });

      await tx.inventoryAsset.updateMany({
        where: { item_id: data.itemId },
        data: {
          status: "DISPOSED" as AssetItemStatus,
        },
      });
    });

    await logAudit({
      log: `Disposed inventory item "${item.name}" (Reason: ${data.reason || "None specified"})`,
      type: "warn",
      category: "inventory",
    });

    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/inventory/items");
    return { ok: true };
  } catch (err: any) {
    console.error("DisposeInventoryItem error:", err);
    return { ok: false, error: "Failed to dispose inventory item." };
  }
}

export async function RestoreInventoryItem(itemId: string) {
  const { authorized, user, error } = await checkPermission("inventory:update");
  if (!authorized || !user) {
    return { ok: false, error: error || "Forbidden: Insufficient permissions" };
  }

  try {
    const item = await db.inventoryItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return { ok: false, error: "Item not found." };
    }

    await db.$transaction(async (tx) => {
      await tx.inventoryItem.update({
        where: { id: itemId },
        data: {
          is_disposed: false,
          disposed_at: null,
          disposal_reason: null,
          disposed_by: null,
        },
      });

      await tx.inventoryAsset.updateMany({
        where: { item_id: itemId, status: "DISPOSED" as AssetItemStatus },
        data: {
          status: "AVAILABLE" as AssetItemStatus,
        },
      });
    });

    await logAudit({
      log: `Restored inventory item "${item.name}" from disposed state`,
      type: "success",
      category: "inventory",
    });

    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/inventory/items");
    return { ok: true };
  } catch (err: any) {
    console.error("RestoreInventoryItem error:", err);
    return { ok: false, error: "Failed to restore inventory item." };
  }
}

export async function CreateInventoryCategory(data: {
  name: string;
  description?: string;
}) {
  const { authorized, user, error } = await checkPermission("inventory:create");
  if (!authorized || !user) {
    return { ok: false, error: error || "Forbidden: Insufficient permissions" };
  }

  try {
    if (data.name.trim().toLowerCase() === "default") {
      return { ok: false, error: "The name 'Default' is reserved for the system fallback category." };
    }

    const existing = await db.inventoryCategory.findUnique({
      where: { name: data.name.trim() },
    });

    if (existing) {
      return { ok: false, error: `Category "${data.name}" already exists.` };
    }

    const category = await db.inventoryCategory.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
      },
    });

    await logAudit({
      log: `Created inventory category "${category.name}"`,
      type: "success",
      category: "inventory",
    });

    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/inventory/categories");
    revalidatePath("/dashboard/inventory/items");
    return { ok: true, category };
  } catch (err: any) {
    console.error("CreateInventoryCategory error:", err);
    return { ok: false, error: "Failed to create category." };
  }
}

export async function UpdateInventoryCategory(data: {
  id: string;
  name: string;
  description?: string;
}) {
  const { authorized, user, error } = await checkPermission("inventory:update");
  if (!authorized || !user) {
    return { ok: false, error: error || "Forbidden: Insufficient permissions" };
  }

  try {
    const existing = await db.inventoryCategory.findUnique({
      where: { id: data.id },
    });

    if (!existing) {
      return { ok: false, error: "Category not found." };
    }

    if (existing.name.trim().toLowerCase() === "default") {
      return { ok: false, error: "The Default category is protected and cannot be modified." };
    }

    if (data.name.trim().toLowerCase() === "default") {
      return { ok: false, error: "Cannot rename a category to 'Default'." };
    }

    const existingWithName = await db.inventoryCategory.findFirst({
      where: { name: data.name.trim(), id: { not: data.id } },
    });

    if (existingWithName) {
      return { ok: false, error: `Another category named "${data.name}" already exists.` };
    }

    const category = await db.inventoryCategory.update({
      where: { id: data.id },
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
      },
    });

    await logAudit({
      log: `Updated inventory category "${category.name}"`,
      type: "info",
      category: "inventory",
    });

    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/inventory/categories");
    revalidatePath("/dashboard/inventory/items");
    return { ok: true, category };
  } catch (err: any) {
    console.error("UpdateInventoryCategory error:", err);
    return { ok: false, error: "Failed to update category." };
  }
}

export async function DeleteInventoryCategory(categoryId: string) {
  const { authorized, user, error } = await checkPermission("inventory:delete");
  if (!authorized || !user) {
    return { ok: false, error: error || "Forbidden: Insufficient permissions" };
  }

  try {
    const targetCategory = await db.inventoryCategory.findUnique({
      where: { id: categoryId },
    });

    if (!targetCategory) {
      return { ok: false, error: "Category not found." };
    }

    if (targetCategory.name.trim().toLowerCase() === "default") {
      return { ok: false, error: "The Default category is protected and cannot be deleted." };
    }

    // Ensure Default category exists to receive transferred items
    let defaultCategory = await db.inventoryCategory.findFirst({
      where: { name: "Default" },
    });

    if (!defaultCategory) {
      defaultCategory = await db.inventoryCategory.create({
        data: {
          name: "Default",
          description: "Default category for unassigned or reallocated inventory items",
        },
      });
    }

    const itemsCount = await db.inventoryItem.count({
      where: { category_id: categoryId },
    });

    await db.$transaction(async (tx) => {
      if (itemsCount > 0 && defaultCategory) {
        await tx.inventoryItem.updateMany({
          where: { category_id: categoryId },
          data: { category_id: defaultCategory.id },
        });
      }

      await tx.inventoryCategory.delete({
        where: { id: categoryId },
      });
    });

    await logAudit({
      log: `Deleted inventory category "${targetCategory.name}". ${itemsCount} items transferred to "Default".`,
      type: "warn",
      category: "inventory",
    });

    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/inventory/categories");
    revalidatePath("/dashboard/inventory/items");
    return {
      ok: true,
      transferredCount: itemsCount,
      message: itemsCount > 0
        ? `Category "${targetCategory.name}" deleted. ${itemsCount} items transferred to Default.`
        : `Category "${targetCategory.name}" deleted.`,
    };
  } catch (err: any) {
    console.error("DeleteInventoryCategory error:", err);
    return { ok: false, error: "Failed to delete category." };
  }
}

export async function GetAssetScanDetails(scannedTag: string) {
  const { authorized } = await checkPermission("borrow:read");
  if (!authorized) {
    return { ok: false, error: "Forbidden: Insufficient permissions" };
  }

  try {
    const asset = await db.inventoryAsset.findFirst({
      where: {
        OR: [
          { asset_tag: scannedTag },
          { qr_code: scannedTag },
        ],
      },
      include: {
        item: {
          include: {
            category: true,
          },
        },
        borrows: {
          orderBy: { borrowed_at: "desc" },
          take: 1,
          include: {
            student: true,
            borrower: true,
            approver: {
              select: { name: true, email: true },
            },
          },
        },
      },
    });

    if (!asset) {
      return { ok: false, error: "Asset not found." };
    }

    return { ok: true, asset };
  } catch (error) {
    console.error("GetAssetScanDetails error:", error);
    return { ok: false, error: "Failed to resolve asset details." };
  }
}

export async function ProcessBorrowAsset(data: {
  asset_id?: string;
  item_id: string;
  quantity?: number;
  borrower_type: "STUDENT" | "EXTERNAL";
  student_id?: string;
  borrower_details?: {
    first_name: string;
    last_name: string;
    contact_number: string;
    email?: string;
    remarks?: string;
  };
  due_date?: string;
  remarks?: string;
}) {
  const { authorized, user, error } = await checkPermission("borrow:create");
  if (!authorized || !user) {
    return { ok: false, error: error || "Forbidden: Insufficient permissions" };
  }

  try {
    const item = await db.inventoryItem.findUnique({
      where: { id: data.item_id },
      include: { category: true },
    });

    if (!item) {
      return { ok: false, error: "Inventory item not found." };
    }

    let borrowerId: string | null = null;
    let studentId: string | null = null;

    if (data.borrower_type === "STUDENT") {
      if (!data.student_id) {
        return { ok: false, error: "Student ID is required for student borrowings." };
      }
      const student = await db.student.findUnique({
        where: { id: data.student_id },
      });
      if (!student) {
        return { ok: false, error: "Student not found in master list." };
      }
      studentId = student.id;
    } else {
      if (!data.borrower_details) {
        return { ok: false, error: "Borrower details are required for external borrowings." };
      }
      const newBorrower = await db.inventoryBorrowers.create({
        data: {
          first_name: data.borrower_details.first_name,
          last_name: data.borrower_details.last_name,
          contact_number: data.borrower_details.contact_number,
          email: data.borrower_details.email || null,
          remarks: data.borrower_details.remarks || null,
        },
      });
      borrowerId = newBorrower.id;
    }

    const qty = data.quantity ?? 1;

    const borrow = await db.$transaction(async (tx) => {
      if (data.asset_id) {
        const asset = await tx.inventoryAsset.findUnique({
          where: { id: data.asset_id },
        });

        if (!asset) {
          throw new Error("Asset not found.");
        }

        if (asset.status !== ("AVAILABLE" as AssetItemStatus)) {
          throw new Error(`Asset is currently ${asset.status.toLowerCase()}.`);
        }

        await tx.inventoryAsset.update({
          where: { id: data.asset_id },
          data: { status: "BORROWED" as AssetItemStatus },
        });
      } else {
        if (item.type === "PROPERTY" || item.type === "EQUIPMENT" || item.type === "SUPPLIES") {
          throw new Error("Tracked items (Property/Equipment/Supplies) must be borrowed by scanning individual assets.");
        }

        const activeBorrowsCount = await tx.inventoryBorrow.aggregate({
          where: {
            item_id: data.item_id,
            returned_at: null,
            asset_id: null,
          },
          _sum: {
            quantity: true,
          },
        });

        const currentBorrowedQty = activeBorrowsCount._sum.quantity ?? 0;
        if (currentBorrowedQty + qty > item.quantity) {
          throw new Error(`Insufficient stock. Only ${item.quantity - currentBorrowedQty} items available.`);
        }
      }

      return await tx.inventoryBorrow.create({
        data: {
          item_id: data.item_id,
          asset_id: data.asset_id || null,
          quantity: qty,
          student_id: studentId,
          borrowed_by: borrowerId,
          approved_by: user.id,
          due_date: data.due_date ? new Date(data.due_date) : null,
          remarks: data.remarks || null,
        },
      });
    });

    await logAudit({
      log: `Checked out item "${item.name}" (Qty: ${qty}) to ${data.borrower_type.toLowerCase()} borrower.`,
      type: "success",
      category: "inventory",
    });

    revalidatePath("/dashboard/inventory");
    return { ok: true, borrow };
  } catch (err: any) {
    console.error("ProcessBorrowAsset error:", err);
    return { ok: false, error: err.message || "Failed to process borrowing request." };
  }
}

export async function ProcessReturnAsset(
  borrowId: string,
  remarks?: string,
  condition?: string
) {
  const { authorized, user, error } = await checkPermission("borrow:update");
  if (!authorized || !user) {
    return { ok: false, error: error || "Forbidden: Insufficient permissions" };
  }

  try {
    const borrow = await db.inventoryBorrow.findUnique({
      where: { id: borrowId },
      include: { item: true, asset: true },
    });

    if (!borrow) {
      return { ok: false, error: "Borrow record not found." };
    }

    if (borrow.returned_at) {
      return { ok: false, error: "Asset has already been returned." };
    }

    await db.$transaction(async (tx) => {
      await tx.inventoryBorrow.update({
        where: { id: borrowId },
        data: {
          returned_at: new Date(),
          remarks: remarks || borrow.remarks,
        },
      });

      if (borrow.asset_id && borrow.asset) {
        const nextStatus =
          condition === "Damaged"
            ? ("MAINTENANCE" as AssetItemStatus)
            : ("AVAILABLE" as AssetItemStatus);

        await tx.inventoryAsset.update({
          where: { id: borrow.asset_id },
          data: {
            status: nextStatus,
            condition: condition || borrow.asset.condition,
          },
        });
      }
    });

    await logAudit({
      log: `Processed return for item "${borrow.item.name}" (Borrow ID: ${borrow.id})`,
      type: "success",
      category: "inventory",
    });

    revalidatePath("/dashboard/inventory");
    return { ok: true };
  } catch (err: any) {
    console.error("ProcessReturnAsset error:", err);
    return { ok: false, error: "Failed to record item return." };
  }
}

export async function SearchStudentsAction(query: string) {
  const { authorized } = await checkPermission("borrow:read");
  if (!authorized) {
    return { ok: false, error: "Forbidden" };
  }

  try {
    const students = await db.student.findMany({
      where: {
        OR: [
          { student_id: { contains: query, mode: "insensitive" } },
          { first_name: { contains: query, mode: "insensitive" } },
          { last_name: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 10,
      orderBy: { last_name: "asc" },
    });

    return { ok: true, students };
  } catch (error) {
    console.error("SearchStudentsAction error:", error);
    return { ok: false, error: "Failed to search student record." };
  }
}

export async function GetInventoryDashboardData() {
  await ensureDefaultCategories();
  try {
    const [items, assets, borrows, categories, activeBorrowsCount, maintenanceAssetsCount] = await Promise.all([
      db.inventoryItem.findMany({
        include: {
          category: true,
          created_user: { select: { name: true, first_name: true, last_name: true } },
          stock_logs: {
            include: {
              actor: { select: { id: true, name: true, first_name: true, last_name: true, email: true } },
            },
            orderBy: { created_at: "desc" },
            take: 10,
          },
        },
        orderBy: { name: "asc" },
      }),
      db.inventoryAsset.findMany({
        include: {
          item: {
            include: {
              category: true,
              created_user: { select: { name: true, first_name: true, last_name: true } },
            },
          },
        },
        orderBy: { asset_tag: "asc" },
      }),
      db.inventoryBorrow.findMany({
        take: 200,
        include: {
          item: true,
          asset: true,
          student: true,
          borrower: true,
          approver: { select: { name: true } },
        },
        orderBy: { borrowed_at: "desc" },
      }),
      db.inventoryCategory.findMany({
        orderBy: { name: "asc" },
      }),
      db.inventoryBorrow.count({
        where: { returned_at: null },
      }),
      db.inventoryAsset.count({
        where: { status: "MAINTENANCE" },
      }),
    ]);

    const totalItems = items.length;
    const totalAssets = assets.length;

    return {
      ok: true,
      items,
      assets,
      borrows,
      categories,
      stats: {
        totalItems,
        totalAssets,
        activeBorrows: activeBorrowsCount,
        maintenanceAssets: maintenanceAssetsCount,
      },
    };
  } catch (error) {
    console.error("GetInventoryDashboardData error:", error);
    return { ok: false, error: "Failed to fetch dashboard data." };
  }
}

export async function UpdateAssetConditionOrStatus(data: {
  assetId: string;
  condition: string;
  status: AssetItemStatus;
}) {
  const { authorized, user, error } = await checkPermission("inventory:update");
  if (!authorized || !user) {
    return { ok: false, error: error || "Forbidden: Insufficient permissions" };
  }

  try {
    const updated = await db.inventoryAsset.update({
      where: { id: data.assetId },
      data: {
        condition: data.condition,
        status: data.status,
      },
      include: {
        item: true,
      },
    });

    await logAudit({
      log: `Updated condition of asset "${updated.asset_tag}" (${updated.item.name}) to "${data.condition}" and status to "${data.status}"`,
      type: "success",
      category: "inventory",
    });

    revalidatePath("/dashboard/inventory");
    return { ok: true, asset: updated };
  } catch (err: any) {
    console.error("UpdateAssetConditionOrStatus error:", err);
    return { ok: false, error: "Failed to update asset details." };
  }
}

export async function DeleteInventoryAsset(assetId: string) {
  const { authorized, user, error } = await checkPermission("inventory:delete");
  if (!authorized || !user) {
    return { ok: false, error: error || "Forbidden: Insufficient permissions" };
  }

  try {
    const asset = await db.inventoryAsset.findUnique({
      where: { id: assetId },
      include: { item: true, borrows: { where: { returned_at: null } } },
    });

    if (!asset) {
      return { ok: false, error: "Asset not found." };
    }

    if (asset.borrows.length > 0) {
      return { ok: false, error: "Cannot delete asset with active borrows." };
    }

    await db.$transaction(async (tx) => {
      await tx.inventoryBorrow.deleteMany({ where: { asset_id: assetId } });
      await tx.inventoryAsset.delete({ where: { id: assetId } });
      await tx.inventoryItem.update({
        where: { id: asset.item_id },
        data: { quantity: { decrement: 1 } },
      });
    });

    await logAudit({
      log: `Deleted asset "${asset.asset_tag}" from item "${asset.item.name}"`,
      type: "warn",
      category: "inventory",
    });

    revalidatePath("/dashboard/inventory");
    return { ok: true };
  } catch (err: any) {
    console.error("DeleteInventoryAsset error:", err);
    return { ok: false, error: "Failed to delete asset." };
  }
}

export async function DeleteInventoryItem(itemId: string) {
  const { authorized, user, error } = await checkPermission("inventory:delete");
  if (!authorized || !user) {
    return { ok: false, error: error || "Forbidden: Insufficient permissions" };
  }

  try {
    const item = await db.inventoryItem.findUnique({
      where: { id: itemId },
      include: {
        assets: { include: { borrows: { where: { returned_at: null } } } },
        borrows: { where: { returned_at: null } },
      },
    });

    if (!item) {
      return { ok: false, error: "Item not found." };
    }

    const hasActiveBorrows =
      item.borrows.length > 0 ||
      item.assets.some((a) => a.borrows.length > 0);

    if (hasActiveBorrows) {
      return { ok: false, error: "Cannot delete item with active borrows." };
    }

    await db.$transaction(async (tx) => {
      await tx.inventoryBorrow.deleteMany({ where: { item_id: itemId } });
      await tx.inventoryAsset.deleteMany({ where: { item_id: itemId } });
      await tx.inventoryItem.delete({ where: { id: itemId } });
    });

    await logAudit({
      log: `Deleted inventory item "${item.name}" and all associated assets`,
      type: "warn",
      category: "inventory",
    });

    revalidatePath("/dashboard/inventory");
    return { ok: true };
  } catch (err: any) {
    console.error("DeleteInventoryItem error:", err);
    return { ok: false, error: "Failed to delete item." };
  }
}

export async function adjustSupplyQuantity(data: {
  itemId: string;
  quantityChange: number;
  actionType: "ADD" | "REDUCE" | "ADJUSTMENT";
  reason?: string;
}) {
  const { authorized, user, error } = await checkPermission("inventory:update");
  if (!authorized || !user) {
    return { ok: false, error: error || "Forbidden: Insufficient permissions" };
  }

  if (typeof data.quantityChange !== "number" || isNaN(data.quantityChange) || data.quantityChange === 0) {
    return { ok: false, error: "Quantity change must be a non-zero number." };
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({
        where: { id: data.itemId },
        include: { category: true },
      });

      if (!item) {
        throw new Error("Item not found.");
      }

      if (item.type !== "SUPPLIES") {
        throw new Error("Quantity adjustments are allowed for Supplies items only.");
      }

      const previousQuantity = item.quantity;
      let effectiveChange = data.quantityChange;

      if (data.actionType === "REDUCE") {
        effectiveChange = -Math.abs(data.quantityChange);
      } else if (data.actionType === "ADD") {
        effectiveChange = Math.abs(data.quantityChange);
      }

      const newQuantity = previousQuantity + effectiveChange;

      if (newQuantity < 0) {
        throw new Error(`Cannot reduce stock below zero. Available stock: ${previousQuantity}`);
      }

      const log = await tx.inventoryStockLog.create({
        data: {
          item_id: data.itemId,
          actor_id: user.id,
          action_type: data.actionType as StockActionType,
          quantity_change: effectiveChange,
          previous_quantity: previousQuantity,
          new_quantity: newQuantity,
          reason: data.reason || null,
        },
        include: {
          actor: { select: { id: true, name: true, first_name: true, last_name: true, email: true } },
        },
      });

      const updatedItem = await tx.inventoryItem.update({
        where: { id: data.itemId },
        data: { quantity: newQuantity },
        include: {
          category: true,
          created_user: { select: { name: true, first_name: true, last_name: true } },
          stock_logs: {
            include: {
              actor: { select: { id: true, name: true, first_name: true, last_name: true, email: true } },
            },
            orderBy: { created_at: "desc" },
          },
        },
      });

      return { item: updatedItem, log };
    });

    await logAudit({
      log: `Adjusted stock for item "${result.item.name}" (${data.actionType}: ${result.log.quantity_change > 0 ? "+" : ""}${result.log.quantity_change}). New quantity: ${result.item.quantity}. Reason: ${data.reason || "None"}`,
      type: "info",
      category: "inventory",
    });

    revalidatePath("/dashboard/inventory");
    return { ok: true, item: result.item, log: result.log };
  } catch (err: any) {
    console.error("adjustSupplyQuantity error:", err);
    return { ok: false, error: err.message || "Failed to adjust supply quantity." };
  }
}

export async function GetItemDetailsWithLogs(itemId: string) {
  const { authorized } = await checkPermission("inventory:read");
  if (!authorized) {
    return { ok: false, error: "Forbidden: Insufficient permissions" };
  }

  try {
    const item = await db.inventoryItem.findUnique({
      where: { id: itemId },
      include: {
        category: true,
        created_user: { select: { id: true, name: true, first_name: true, last_name: true, email: true, image: true } },
        assets: {
          include: {
            borrows: {
              orderBy: { borrowed_at: "desc" },
              take: 1,
              include: {
                student: true,
                borrower: true,
                approver: { select: { name: true } },
              },
            },
          },
          orderBy: { asset_tag: "asc" },
        },
        borrows: {
          orderBy: { borrowed_at: "desc" },
          include: {
            asset: true,
            student: true,
            borrower: true,
            approver: { select: { name: true } },
          },
        },
        stock_logs: {
          include: {
            actor: { select: { id: true, name: true, first_name: true, last_name: true, email: true } },
          },
          orderBy: { created_at: "desc" },
        },
      },
    });

    if (!item) {
      return { ok: false, error: "Item not found." };
    }

    return { ok: true, item };
  } catch (err) {
    console.error("GetItemDetailsWithLogs error:", err);
    return { ok: false, error: "Failed to fetch item details." };
  }
}

export async function GetExportInventoryItemsData(options?: {
  categoryId?: string;
  includeDisposed?: boolean;
}) {
  const { authorized } = await checkPermission("inventory:read");
  if (!authorized) {
    return { ok: false, error: "Forbidden: Insufficient permissions" };
  }

  try {
    const whereClause: any = {};
    if (options?.categoryId && options.categoryId !== "ALL") {
      whereClause.category_id = options.categoryId;
    }
    if (!options?.includeDisposed) {
      whereClause.is_disposed = false;
    }

    const [items, categories] = await Promise.all([
      db.inventoryItem.findMany({
        where: whereClause,
        include: {
          category: true,
          assets: {
            select: {
              id: true,
              asset_tag: true,
              serial_number: true,
              condition: true,
              status: true,
            },
          },
          created_user: {
            select: {
              name: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
        },
        orderBy: [
          { category: { name: "asc" } },
          { name: "asc" },
        ],
      }),
      db.inventoryCategory.findMany({
        orderBy: { name: "asc" },
      }),
    ]);

    return {
      ok: true,
      items,
      categories,
    };
  } catch (error) {
    console.error("GetExportInventoryItemsData error:", error);
    return { ok: false, error: "Failed to fetch inventory export data." };
  }
}