import { redirect } from "next/navigation";
import { BarChart3 } from "lucide-react";
import PageTitle from "@/components/layout/dashboard/page-title";
import { checkPermission } from "@/features/auth/lib/permissions";
import { GetPaymentsDashboardData } from "@/features/payments/actions/payments";
import { PaymentsAnalytics } from "@/features/payments/components/payments-analytics";

export default async function PaymentsAnalyticsPage() {
  const { authorized } = await checkPermission("payment:read");

  if (!authorized) {
    return redirect("/unauthorized");
  }

  const result = await GetPaymentsDashboardData();

  if (!result.ok || !result.data) {
    return (
      <main className="w-full space-y-4">
        <PageTitle
          icon={BarChart3}
          title="Payments Analytics"
          desc="Revenue statistics, sales performance, and merchandise item analytics"
        />
        <div className="border border-destructive bg-destructive/10 p-4 rounded-lg text-destructive text-sm font-semibold text-left">
          {result.error || "Failed to load payments analytics data."}
        </div>
      </main>
    );
  }

  return (
    <main className="w-full space-y-6">
      <PageTitle
        icon={BarChart3}
        title="Payments Analytics"
        desc="Revenue statistics, sales performance, and merchandise item analytics"
      />

      <PaymentsAnalytics
        stats={result.data.stats}
        transactions={result.data.transactions}
        feeItems={result.data.feeItems}
      />
    </main>
  );
}
