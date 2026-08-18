import { redirect } from "next/navigation";
import { CreditCard } from "lucide-react";
import PageTitle from "@/components/layout/dashboard/page-title";
import { checkPermission } from "@/features/auth/lib/permissions";
import { GetPaymentsDashboardData } from "@/features/payments/actions/payments";
import { TransactionsView } from "@/features/payments/components/transactions-view";

export default async function PaymentsTransactionsPage() {
  const { authorized } = await checkPermission("payment:read");

  if (!authorized) {
    return redirect("/unauthorized");
  }

  const result = await GetPaymentsDashboardData();

  if (!result.ok || !result.data) {
    return (
      <main className="w-full space-y-4">
        <PageTitle
          icon={CreditCard}
          title="Payment Transactions"
          desc="View and manage student acknowledgement receipts (AF) and transaction logs"
        />
        <div className="border border-destructive bg-destructive/10 p-4 rounded-lg text-destructive text-sm font-semibold text-left">
          {result.error || "Failed to load payment transactions data."}
        </div>
      </main>
    );
  }

  return (
    <main className="w-full space-y-6">
      <PageTitle
        icon={CreditCard}
        title="Payment Transactions"
        desc="View and manage student acknowledgement receipts (AF) and transaction logs"
      />

      <TransactionsView initialData={result.data} />
    </main>
  );
}
