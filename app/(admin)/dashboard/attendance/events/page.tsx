import PageTitle from "@/components/layout/dashboard/page-title";
import { EventsClient } from "@/features/attendance/components/events-client";
import { db } from "@/lib/prisma";
import { CalendarDays } from "lucide-react";
import { checkPermission } from "@/features/auth/lib/permissions";

export default async function EventsPage() {
  const { authorized, error, user } = await checkPermission("attendance:manage");

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

  const events = await db.attendanceEvents.findMany({
    orderBy: {
      start_date: "desc",
    },
  });

  return (
    <main className="w-full space-y-4">
      <PageTitle
        title="Attendance Events"
        desc="Schedule and manage campus event checkpoints."
        icon={CalendarDays}
      />

      <EventsClient
        initialData={events}
        canCreate={true}
        canUpdate={true}
        canDelete={true}
      />
    </main>
  );
}
