import { redirect } from "next/navigation";
import { Boxes } from "lucide-react";
import PageTitle from "@/components/layout/dashboard/page-title";
import { checkPermission } from "@/features/auth/lib/permissions";
import { GetInventoryDashboardData } from "@/features/inventory/actions/inventory";
import { InventoryDashboardClient } from "@/features/inventory/components/inventory-dashboard-client";

export default async function InventoryItemsPage() {
  const { authorized, user } = await checkPermission("inventory:read");

  if (!authorized || !user) {
    return redirect("/unauthorized");
  }

  const result = await GetInventoryDashboardData();

  if (!result.ok) {
    return (
      <main className="w-full space-y-4">
        <PageTitle
          icon={Boxes}
          title="Inventory Management"
          desc="Track and check out physical assets and equipment stock"
        />
        <div className="border border-destructive bg-destructive/10 p-4 rounded-lg text-destructive text-sm font-semibold text-left">
          {result.error || "Failed to load inventory dashboard data."}
        </div>
      </main>
    );
  }

  return (
    <main className="w-full space-y-6">
      <PageTitle
        icon={Boxes}
        title="Inventory Management"
        desc="Track and check out physical assets and equipment stock"
      />

      <InventoryDashboardClient
        defaultTab="all"
        initialData={{
          items: result.items || [],
          assets: result.assets || [],
          categories: result.categories || [],
          stats: result.stats || {
            totalItems: 0,
            totalAssets: 0,
            activeBorrows: 0,
            maintenanceAssets: 0,
          },
        }}
      />
    </main>
  );
}
