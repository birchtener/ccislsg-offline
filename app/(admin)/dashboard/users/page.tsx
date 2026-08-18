import PageTitle from "@/components/layout/dashboard/page-title";
import { UsersClient } from "@/features/users/components/users-client";
import { db } from "@/lib/prisma";
import { Users } from "lucide-react";
import { checkPermission } from "@/features/auth/lib/permissions";

export default async function UsersPage() {
  const { authorized, error, user } = await checkPermission("users:read");

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

  const currentUserId = user.id;

  const [users, roles] = await Promise.all([
    db.user.findMany({
      include: {
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    }),
    db.role.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  const userPermissions = user.permissions;

  const canCreate = userPermissions.includes("users:create");
  const canUpdate = userPermissions.includes("users:update");
  const canDelete = userPermissions.includes("users:delete");

  return (
    <main className="w-full space-y-4">
      <PageTitle title="Users" desc="View and manage users." icon={Users} />

      <UsersClient
        initialData={users}
        roles={roles}
        canCreate={canCreate}
        canUpdate={canUpdate}
        canDelete={canDelete}
        currentUserId={currentUserId}
      />
    </main>
  );
}
