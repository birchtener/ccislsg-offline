import { redirect } from "next/navigation";
import { Tag } from "lucide-react";
import PageTitle from "@/components/layout/dashboard/page-title";
import { checkPermission } from "@/features/auth/lib/permissions";
import { GetPaymentsDashboardData } from "@/features/payments/actions/payments";
import { FeeItemsView } from "@/features/payments/components/fee-items-view";

export default async function PaymentsItemsPage() {
  const { authorized } = await checkPermission("item:read");

  if (!authorized) {
    return redirect("/unauthorized");
  }

  const result = await GetPaymentsDashboardData();

  if (!result.ok || !result.data) {
    return (
      <main className="w-full space-y-4">
        <PageTitle
          icon={Tag}
          title="Fee & Merchandise Items"
          desc="Manage college fee items, merchandise variants, prices, and stock inventory"
        />
        <div className="border border-destructive bg-destructive/10 p-4 rounded-lg text-destructive text-sm font-semibold text-left">
          {result.error || "Failed to load fee items data."}
        </div>
      </main>
    );
  }

  return (
    <main className="w-full space-y-6">
      <PageTitle
        icon={Tag}
        title="Fee & Merchandise Items"
        desc="Manage college fee items, merchandise variants, prices, and stock inventory"
      />

      <FeeItemsView initialData={result.data} />
    </main>
  );
}
