import { redirect } from "next/navigation";
import { History } from "lucide-react";
import PageTitle from "@/components/layout/dashboard/page-title";
import { checkPermission } from "@/features/auth/lib/permissions";
import { GetPaymentsDashboardData } from "@/features/payments/actions/payments";
import { PaymentsLogsView } from "@/features/payments/components/payments-logs-view";

export default async function PaymentsLogsPage() {
  const { authorized } = await checkPermission("payment:read");

  if (!authorized) {
    return redirect("/unauthorized");
  }

  const result = await GetPaymentsDashboardData();

  if (!result.ok || !result.data) {
    return (
      <main className="w-full space-y-4">
        <PageTitle
          icon={History}
          title="Payments Audit Logs"
          desc="Chronological stock adjustment and transaction audit logs"
        />
        <div className="border border-destructive bg-destructive/10 p-4 rounded-lg text-destructive text-sm font-semibold text-left">
          {result.error || "Failed to load payments audit logs data."}
        </div>
      </main>
    );
  }

  return (
    <main className="w-full space-y-6">
      <PageTitle
        icon={History}
        title="Payments Audit Logs"
        desc="Chronological stock adjustment and transaction audit logs"
      />

      <PaymentsLogsView
        stockLogs={result.data.stockLogs}
        auditLogs={result.data.auditLogs}
        transactions={result.data.transactions}
      />
    </main>
  );
}
