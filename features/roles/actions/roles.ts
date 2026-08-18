"use server";

import { db } from "@/lib/prisma";
import { checkPermission } from "@/features/auth/lib/permissions";
import { RoleFormSchema, RoleFormInput } from "../schema/roles";

export async function CreateRole(data: RoleFormInput) {
  const { authorized, error } = await checkPermission("roles:manage");
  if (!authorized) {
    return { ok: false, error: error || "Unauthorized" };
  }

  const parsed = RoleFormSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const nameTrimmed = data.name.trim();

  try {
    const existing = await db.role.findUnique({
      where: { name: nameTrimmed },
    });

    if (existing) {
      return { ok: false, error: "A role with this name already exists." };
    }

    await db.$transaction(async (tx) => {
      const role = await tx.role.create({
        data: { name: nameTrimmed },
      });

      if (data.permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: data.permissionIds.map((pid) => ({
            role_id: role.id,
            permission_id: pid,
          })),
        });
      }
    });

    return { ok: true, message: "Role created successfully" };
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[CREATE_ROLE_ERROR]", err);
    }
    return { ok: false, error: "An unexpected error occurred." };
  }
}

export async function UpdateRole(id: string, data: RoleFormInput) {
  const { authorized, error } = await checkPermission("roles:manage");
  if (!authorized) {
    return { ok: false, error: error || "Unauthorized" };
  }

  const parsed = RoleFormSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const nameTrimmed = data.name.trim();

  try {
    const role = await db.role.findUnique({
      where: { id },
    });

    if (!role) {
      return { ok: false, error: "Role not found." };
    }

    if (role.name.toLowerCase() === "admin" && nameTrimmed.toLowerCase() !== "admin") {
      return { ok: false, error: "The Admin role name cannot be changed." };
    }

    if (role.name !== nameTrimmed) {
      const existingName = await db.role.findUnique({
        where: { name: nameTrimmed },
      });
      if (existingName) {
        return { ok: false, error: "A role with this name already exists." };
      }
    }

    await db.$transaction(async (tx) => {
      await tx.role.update({
        where: { id },
        data: { name: nameTrimmed },
      });

      await tx.rolePermission.deleteMany({
        where: { role_id: id },
      });

      if (data.permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: data.permissionIds.map((pid) => ({
            role_id: id,
            permission_id: pid,
          })),
        });
      }
    });

    return { ok: true, message: "Role updated successfully" };
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[UPDATE_ROLE_ERROR]", err);
    }
    return { ok: false, error: "An unexpected error occurred." };
  }
}

export async function DeleteRole(id: string, newRoleId: string) {
  const { authorized, error } = await checkPermission("roles:manage");
  if (!authorized) {
    return { ok: false, error: error || "Unauthorized" };
  }

  if (id === newRoleId) {
    return { ok: false, error: "Cannot reassign users to the role being deleted." };
  }

  try {
    const roleToDelete = await db.role.findUnique({
      where: { id },
    });

    if (!roleToDelete) {
      return { ok: false, error: "Role to delete not found." };
    }

    if (roleToDelete.name.toLowerCase() === "admin") {
      return { ok: false, error: "The Admin role cannot be deleted." };
    }

    const replacementRole = await db.role.findUnique({
      where: { id: newRoleId },
    });

    if (!replacementRole) {
      return { ok: false, error: "Alternate reassignment role not found." };
    }

    await db.$transaction(async (tx) => {
      
      await tx.user.updateMany({
        where: { role_id: id },
        data: { role_id: newRoleId },
      });

      await tx.rolePermission.deleteMany({
        where: { role_id: id },
      });

      await tx.role.delete({
        where: { id },
      });
    });

    return { ok: true, message: "Role deleted successfully" };
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[DELETE_ROLE_ERROR]", err);
    }
    return { ok: false, error: "An unexpected error occurred." };
  }
}
