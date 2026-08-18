import PageTitle from "@/components/layout/dashboard/page-title";
import { RolesClient } from "@/features/roles/components/roles-client";
import { db } from "@/lib/prisma";
import { ShieldUser } from "lucide-react";
import { checkPermission } from "@/features/auth/lib/permissions";

export default async function RolesPage() {
  const { authorized, error, user } = await checkPermission("roles:manage");

  if (!user) {
    return null;
  }

  if (!authorized) {
    return (
      <main className="w-full space-y-4 p-6">
        <h1 className="text-xl font-bold text-destructive">Access Denied</h1>
        <p className="text-muted-foreground">
          {error || "You do not have permission to view this page."}
        </p>
      </main>
    );
  }

  const roles = await db.role.findMany({
    include: {
      _count: {
        select: {
          users: true,
        },
      },
      role_permissions: {
        select: {
          permission_id: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  const permissionCategories = await db.permissionCategory.findMany({
    include: {
      permissions: {
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: "asc",
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  const canCreate = true;
  const canUpdate = true;
  const canDelete = true;

  return (
    <main className="w-full space-y-4">
      <PageTitle
        title="Roles & Permissions"
        desc="Configure user authorization groups and system permission matrices."
        icon={ShieldUser}
      />

      <RolesClient
        initialData={roles}
        permissionCategories={permissionCategories}
        canCreate={canCreate}
        canUpdate={canUpdate}
        canDelete={canDelete}
      />
    </main>
  );
}
