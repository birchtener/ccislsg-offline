import { redirect } from "next/navigation";
import { Boxes } from "lucide-react";
import PageTitle from "@/components/layout/dashboard/page-title";
import { checkPermission } from "@/features/auth/lib/permissions";
import { GetInventoryDashboardData } from "@/features/inventory/actions/inventory";
import { BorrowsDashboardClient } from "@/features/inventory/components/borrows-dashboard-client";

export default async function InventoryBorrowsPage() {
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
          title="Logistics & Borrows"
          desc="Manage equipment borrows and track borrowing records"
        />
        <div className="border border-destructive bg-destructive/10 p-4 rounded-lg text-destructive text-sm font-semibold text-left">
          {result.error || "Failed to load borrow data."}
        </div>
      </main>
    );
  }

  return (
    <main className="w-full space-y-6">
      <PageTitle
        icon={Boxes}
        title="Logistics & Borrows"
        desc="Manage equipment borrows and track borrowing records"
      />

      <BorrowsDashboardClient
        initialData={{
          borrows: result.borrows || [],
        }}
      />
    </main>
  );
}
