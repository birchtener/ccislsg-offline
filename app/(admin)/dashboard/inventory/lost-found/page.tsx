import { redirect } from "next/navigation";
import { PackageSearch } from "lucide-react";
import PageTitle from "@/components/layout/dashboard/page-title";
import { checkPermission } from "@/features/auth/lib/permissions";
import { getLostFoundItems } from "@/features/lost-found/actions/lost-found";
import { LostFoundDashboardClient } from "@/features/lost-found/components/lost-found-dashboard-client";

export default async function LostFoundPage() {
  const { authorized, user } = await checkPermission("lost-found:read");

  if (!authorized || !user) {
    return redirect("/unauthorized");
  }

  const result = await getLostFoundItems();

  if (!result.ok) {
    return (
      <main className="w-full space-y-4">
        <PageTitle
          icon={PackageSearch}
          title="Lost & Found Registry"
          desc="Log, track, and manage physical items found around campus"
        />
        <div className="border border-destructive bg-destructive/10 p-4 rounded-lg text-destructive text-sm font-semibold text-left">
          {result.error || "Failed to load lost & found inventory data."}
        </div>
      </main>
    );
  }

  return (
    <main className="w-full space-y-6">
      <PageTitle
        icon={PackageSearch}
        title="Lost & Found Registry"
        desc="Log, track, and manage physical items found around campus"
      />

      <LostFoundDashboardClient initialItems={result.data || []} />
    </main>
  );
}
