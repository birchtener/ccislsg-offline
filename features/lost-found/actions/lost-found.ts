"use server";

import { revalidatePath } from "next/cache";
import { checkPermission } from "@/features/auth/lib/permissions";
import { db } from "@/lib/prisma";
import { deleteImage } from "@/actions/cloudinary";
import { logAudit } from "@/features/audit-logs/actions/audit";
import { LostFoundItemWithImages, LostFoundStatus } from "../types/lost-found";

export async function getLostFoundItems(status?: LostFoundStatus): Promise<{
  ok: boolean;
  data?: LostFoundItemWithImages[];
  error?: string;
}> {
  try {
    const { authorized } = await checkPermission("lost-found:read");
    if (!authorized) {
      return { ok: false, error: "Unauthorized: Insufficient permissions" };
    }

    const items = await db.lostFoundItem.findMany({
      where: status ? { status } : undefined,
      include: {
        images: {
          orderBy: { order: "asc" },
        },
        created_user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return { ok: true, data: items as LostFoundItemWithImages[] };
  } catch (error: any) {
    console.error("[GET_LOST_FOUND_ITEMS_ERROR]", error);
    return { ok: false, error: error.message || "Failed to fetch lost and found items" };
  }
}

export type CloudinaryUploadedImage = {
  url: string;
  publicId?: string;
};

export async function createLostFoundItem(data: {
  title: string;
  description?: string;
  location_found?: string;
  date_found?: string | Date;
  images?: CloudinaryUploadedImage[];
}): Promise<{ ok: boolean; data?: LostFoundItemWithImages; error?: string }> {
  try {
    const { authorized, user } = await checkPermission("lost-found:create");
    if (!authorized || !user) {
      return { ok: false, error: "Unauthorized: Insufficient permissions" };
    }

    const newItem = await db.lostFoundItem.create({
      data: {
        title: data.title,
        description: data.description || null,
        location_found: data.location_found || null,
        date_found: data.date_found ? new Date(data.date_found) : new Date(),
        status: LostFoundStatus.UNCLAIMED,
        created_by: user.id,
        images: {
          create: (data.images || []).map((img, idx) => ({
            image_url: img.url,
            public_id: img.publicId || null,
            order: idx,
          })),
        },
      },
      include: {
        images: { orderBy: { order: "asc" } },
        created_user: { select: { id: true, name: true, image: true } },
      },
    });

    await logAudit({
      log: `Reported lost item "${newItem.title}" found at "${newItem.location_found || "Unspecified location"}"`,
      type: "success",
      category: "inventory",
    });

    revalidatePath("/dashboard/inventory/lost-found");
    revalidatePath("/dashboard/inventory/logs");
    revalidatePath("/dashboard/audit-logs");
    return { ok: true, data: newItem as LostFoundItemWithImages };
  } catch (error: any) {
    console.error("[CREATE_LOST_FOUND_ITEM_ERROR]", error);
    return { ok: false, error: error.message || "Failed to create lost item" };
  }
}

export async function updateLostFoundItem(
  id: string,
  data: {
    title: string;
    description?: string;
    location_found?: string;
    date_found?: string | Date;
    remarks?: string;
    images?: CloudinaryUploadedImage[];
    removedImageIds?: string[];
  }
): Promise<{ ok: boolean; data?: LostFoundItemWithImages; error?: string }> {
  try {
    const { authorized } = await checkPermission("lost-found:update");
    if (!authorized) {
      return { ok: false, error: "Unauthorized: Insufficient permissions" };
    }

    const existing = await db.lostFoundItem.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!existing) {
      return { ok: false, error: "Item not found" };
    }

    // Delete removed images from DB & Cloudinary
    if (data.removedImageIds && data.removedImageIds.length > 0) {
      const imagesToDelete = existing.images.filter((img: any) =>
        data.removedImageIds?.includes(img.id)
      );

      for (const img of imagesToDelete) {
        if (img.image_url) {
          await deleteImage(img.image_url);
        }
      }

      await db.lostFoundImage.deleteMany({
        where: { id: { in: data.removedImageIds } },
      });
    }

    // Update base fields and add new images
    const updated = await db.lostFoundItem.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description || null,
        location_found: data.location_found || null,
        date_found: data.date_found ? new Date(data.date_found) : existing.date_found,
        remarks: data.remarks !== undefined ? (data.remarks || null) : existing.remarks,
        images: data.images && data.images.length > 0 ? {
          create: data.images.map((img, idx) => ({
            image_url: img.url,
            public_id: img.publicId || null,
            order: existing.images.length + idx,
          })),
        } : undefined,
      },
      include: {
        images: { orderBy: { order: "asc" } },
        created_user: { select: { id: true, name: true, image: true } },
      },
    });

    await logAudit({
      log: `Updated lost item "${updated.title}" details`,
      type: "info",
      category: "inventory",
    });

    revalidatePath("/dashboard/inventory/lost-found");
    revalidatePath("/dashboard/inventory/logs");
    revalidatePath("/dashboard/audit-logs");
    return { ok: true, data: updated as LostFoundItemWithImages };
  } catch (error: any) {
    console.error("[UPDATE_LOST_FOUND_ITEM_ERROR]", error);
    return { ok: false, error: error.message || "Failed to update item" };
  }
}

export async function updateLostFoundStatus(
  id: string,
  status: LostFoundStatus,
  claimedBy?: string,
  remarks?: string
): Promise<{ ok: boolean; data?: LostFoundItemWithImages; error?: string }> {
  try {
    const { authorized } = await checkPermission("lost-found:update");
    if (!authorized) {
      return { ok: false, error: "Unauthorized: Insufficient permissions" };
    }

    const isClaimed = status === LostFoundStatus.CLAIMED;

    const updated = await db.lostFoundItem.update({
      where: { id },
      data: {
        status,
        claimed_by: isClaimed ? (claimedBy || null) : null,
        claimed_at: isClaimed ? new Date() : null,
        remarks: remarks || null,
      },
      include: {
        images: { orderBy: { order: "asc" } },
        created_user: { select: { id: true, name: true, image: true } },
      },
    });

    if (isClaimed) {
      await logAudit({
        log: `Marked lost item "${updated.title}" as CLAIMED by "${claimedBy || "Unknown Claimer"}"`,
        type: "success",
        category: "inventory",
      });
    } else {
      await logAudit({
        log: `Reverted lost item "${updated.title}" status to UNCLAIMED`,
        type: "warn",
        category: "inventory",
      });
    }

    revalidatePath("/dashboard/inventory/lost-found");
    revalidatePath("/dashboard/inventory/logs");
    revalidatePath("/dashboard/audit-logs");
    return { ok: true, data: updated as LostFoundItemWithImages };
  } catch (error: any) {
    console.error("[UPDATE_LOST_FOUND_STATUS_ERROR]", error);
    return { ok: false, error: error.message || "Failed to update item status" };
  }
}

export async function deleteLostFoundItem(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { authorized } = await checkPermission("lost-found:delete");
    if (!authorized) {
      return { ok: false, error: "Unauthorized: Insufficient permissions" };
    }

    const item = await db.lostFoundItem.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!item) {
      return { ok: false, error: "Item not found" };
    }

    // Delete all associated images from Cloudinary
    for (const img of item.images) {
      if (img.image_url) {
        await deleteImage(img.image_url);
      }
    }

    await db.lostFoundItem.delete({
      where: { id },
    });

    await logAudit({
      log: `Deleted lost item "${item.title}" from registry`,
      type: "warn",
      category: "inventory",
    });

    revalidatePath("/dashboard/inventory/lost-found");
    revalidatePath("/dashboard/inventory/logs");
    revalidatePath("/dashboard/audit-logs");
    return { ok: true };
  } catch (error: any) {
    console.error("[DELETE_LOST_FOUND_ITEM_ERROR]", error);
    return { ok: false, error: error.message || "Failed to delete item" };
  }
}
