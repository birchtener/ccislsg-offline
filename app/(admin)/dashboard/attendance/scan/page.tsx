import PageTitle from "@/components/layout/dashboard/page-title";
import { ScanClient } from "@/features/attendance/components/scan-client";
import { db } from "@/lib/prisma";
import { ScanQrCode } from "lucide-react";
import { checkPermission } from "@/features/auth/lib/permissions";

export default async function ScanPage() {
  const { authorized, error, user } = await checkPermission("attendance:scan");

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

  const dateBuffer = new Date();
  dateBuffer.setDate(dateBuffer.getDate() - 1);
  dateBuffer.setHours(0, 0, 0, 0);

  const activeEvents = await db.attendanceEvents.findMany({
    where: {
      end_date: {
        gte: dateBuffer,
      },
    },
    select: {
      id: true,
      name: true,
      requires_time_out: true,
      start_date: true,
      end_date: true,
    },
    orderBy: {
      start_date: "asc",
    },
  });

  return (
    <main className="w-full space-y-4">
      <PageTitle
        title="Attendance Scanner"
        desc="Check students in/out of scheduled events using QR/ID scans."
        icon={ScanQrCode}
      />

      <ScanClient events={activeEvents} />
    </main>
  );
}
