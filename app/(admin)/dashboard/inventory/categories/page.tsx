import { redirect } from "next/navigation";
import { FolderTree } from "lucide-react";
import PageTitle from "@/components/layout/dashboard/page-title";
import { checkPermission } from "@/features/auth/lib/permissions";
import { db } from "@/lib/prisma";
import { CategoriesDashboardClient } from "@/features/inventory/components/categories-dashboard-client";

export default async function InventoryCategoriesPage() {
  const { authorized, user } = await checkPermission("inventory:read");

  if (!authorized || !user) {
    return redirect("/unauthorized");
  }

  const categories = await db.inventoryCategory.findMany({
    include: {
      _count: {
        select: {
          inventory_items: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <main className="w-full space-y-6">
      <PageTitle
        icon={FolderTree}
        title="Item Categories"
        desc="Manage subcategories and item type classifications for inventory items"
      />

      <CategoriesDashboardClient categories={categories} />
    </main>
  );
}
