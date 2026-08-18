import PageTitle from "@/components/layout/dashboard/page-title";
import { AuditLogsTable } from "@/features/audit-logs/components/audit-logs-table";
import { GetAuditLogs } from "@/features/audit-logs/actions/audit";
import { ScrollText } from "lucide-react";
import { checkPermission } from "@/features/auth/lib/permissions";

export default async function InventoryLogsPage() {
  const { authorized, error, user } = await checkPermission("auditlog:read");

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

  const result = await GetAuditLogs({ category: "inventory" });
  const logs = result.ok ? result.logs : [];

  return (
    <main className="w-full space-y-4">
      <PageTitle
        title="Inventory Audit Logs"
        desc="Chronological history of item creations, checkouts, returns, updates, and deletions."
        icon={ScrollText}
      />

      <AuditLogsTable initialData={logs as any} showCategoryFilter={false} />
    </main>
  );
}
