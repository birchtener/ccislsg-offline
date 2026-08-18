"use server";

import { db } from "@/lib/prisma";
import { checkPermission } from "@/features/auth/lib/permissions";
import { AuditType, AuditCategory } from "@/lib/generated/prisma/client";

export async function logAudit({
  log,
  type,
  category,
}: {
  log: string;
  type: "success" | "info" | "error" | "warn";
  category:
    | "authentication"
    | "inventory"
    | "payments"
    | "attendance"
    | "clearance"
    | "announcements"
    | "events"
    | "admin";
}) {
  try {
    const { user } = await checkPermission();

    if (!user) {
      console.warn("Attempted to write audit log but no session was found.");
      return { ok: false, error: "No active user session." };
    }

    const audit = await db.auditLog.create({
      data: {
        user_id: user.id,
        log,
        type: type as AuditType,
        category: category as AuditCategory,
      },
    });

    return { ok: true, audit };
  } catch (error) {
    console.error("logAudit error:", error);
    return { ok: false, error: "Failed to write audit log." };
  }
}

export async function GetAuditLogs(filters?: {
  category?: string;
  search?: string;
}) {
  const { authorized, error } = await checkPermission("auditlog:read");
  if (!authorized) {
    return { ok: false, error: error || "Unauthorized" };
  }

  try {
    const where: any = {};

    if (filters?.category) {
      where.category = filters.category as AuditCategory;
    }

    if (filters?.search) {
      where.OR = [
        {
          log: {
            contains: filters.search,
            mode: "insensitive",
          },
        },
        {
          user: {
            name: {
              contains: filters.search,
              mode: "insensitive",
            },
          },
        },
        {
          user: {
            email: {
              contains: filters.search,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    const logs = await db.auditLog.findMany({
      where,
      take: 200,
      orderBy: {
        created_at: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            role: true,
          },
        },
      },
    });

    return { ok: true, logs };
  } catch (error) {
    console.error("GetAuditLogs error:", error);
    return { ok: false, error: "Failed to fetch audit logs." };
  }
}
