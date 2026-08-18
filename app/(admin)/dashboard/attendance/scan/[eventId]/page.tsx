import { EventScannerClient } from "@/features/attendance/components/event-scanner-client";
import { db } from "@/lib/prisma";
import { checkPermission } from "@/features/auth/lib/permissions";
import { notFound } from "next/navigation";

interface EventScanPageProps {
  params: Promise<{
    eventId: string;
  }>;
}

export default async function EventScanPage({ params }: EventScanPageProps) {
  const { eventId } = await params;

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

  const event = await db.attendanceEvents.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      name: true,
      requires_time_out: true,
      start_date: true,
      end_date: true,
    },
  });

  if (!event) {
    notFound();
  }

  const lastScans = await db.attendance.findMany({
    where: { event_id: eventId },
    take: 10,
    orderBy: { time: "desc" },
    include: {
      student: {
        select: {
          student_id: true,
          first_name: true,
          last_name: true,
        },
      },
    },
  });

  const initialLogs = lastScans.map((scan) => ({
    id: scan.id,
    studentId: scan.student.student_id,
    studentName: `${scan.student.first_name} ${scan.student.last_name}`,
    type: scan.type as "in" | "out",
    time: scan.time,
  }));

  return (
    <main className="w-full">
      <EventScannerClient event={event} initialLogs={initialLogs} />
    </main>
  );
}
