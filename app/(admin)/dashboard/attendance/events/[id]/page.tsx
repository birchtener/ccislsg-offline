import PageTitle from "@/components/layout/dashboard/page-title";
import { EventDashboard } from "@/features/attendance/components/event-dashboard";
import { EventAttendanceTable } from "@/features/attendance/components/event-attendance-table";
import { db } from "@/lib/prisma";
import { CalendarDays } from "lucide-react";
import { checkPermission } from "@/features/auth/lib/permissions";
import { format } from "date-fns";
import { Program } from "@/lib/generated/prisma/enums";

interface EventDashboardPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    search?: string;
    program?: string;
    year?: string;
    status?: string;
    page?: string;
    limit?: string;
  }>;
}

export default async function EventDashboardPage({
  params,
  searchParams,
}: EventDashboardPageProps) {
  const { authorized, error, user } =
    await checkPermission("attendance:manage");

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

  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const search = resolvedSearchParams.search;
  const program = resolvedSearchParams.program;
  const year = resolvedSearchParams.year;
  const status = resolvedSearchParams.status;
  const page = resolvedSearchParams.page;
  const limit = resolvedSearchParams.limit;

  const currentPage = Math.max(1, parseInt(page ?? "1", 10) || 1);
  const pageSize = Math.max(5, parseInt(limit ?? "10", 10) || 10);

  const logs = await db.attendance.findMany({
    where: { event_id: id },
    orderBy: { time: "asc" },
  });

  const studentStatuses = new Map<string, "Timed In" | "Timed Out">();
  logs.forEach((log) => {
    studentStatuses.set(log.student_id, log.type === "in" ? "Timed In" : "Timed Out");
  });

  const timedInIds = [...studentStatuses.entries()].filter(([_, s]) => s === "Timed In").map(([sid]) => sid);
  const timedOutIds = [...studentStatuses.entries()].filter(([_, s]) => s === "Timed Out").map(([sid]) => sid);
  const hasLogsIds = Array.from(studentStatuses.keys());

  const where: any = {};
  const andConditions: any[] = [];

  if (search) {
    const searchLower = search.trim();
    andConditions.push({
      OR: [
        { first_name: { contains: searchLower, mode: "insensitive" } },
        { last_name: { contains: searchLower, mode: "insensitive" } },
        { student_id: { contains: searchLower, mode: "insensitive" } },
      ],
    });
  }

  if (program) {
    const programList = program.split(",").map((p) => p.trim());
    const validPrograms = programList.filter((p) =>
      Object.values(Program).includes(p as Program)
    ) as Program[];

    if (validPrograms.length > 0) {
      andConditions.push({ program: { in: validPrograms } });
    }
  }

  if (year) {
    const yearList = year
      .split(",")
      .map((y) => parseInt(y.trim(), 10))
      .filter((y) => !isNaN(y));

    if (yearList.length > 0) {
      andConditions.push({ year: { in: yearList } });
    }
  }

  if (status) {
    const statusList = status.split(",").map((s) => s.trim());
    const statusConditions: any[] = [];

    if (statusList.includes("Timed In")) {
      statusConditions.push({ id: { in: timedInIds } });
    }
    if (statusList.includes("Timed Out")) {
      statusConditions.push({ id: { in: timedOutIds } });
    }
    if (statusList.includes("Absent")) {
      statusConditions.push({ id: { notIn: hasLogsIds } });
    }

    if (statusConditions.length > 0) {
      andConditions.push({ OR: statusConditions });
    } else {
      andConditions.push({ id: "" });
    }
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  const [event, students, totalCount] = await Promise.all([
    db.attendanceEvents.findUnique({
      where: { id },
      include: {
        attendance: {
          orderBy: {
            time: "asc",
          },
          include: {
            student: {
              select: {
                program: true,
              },
            },
          },
        },
      },
    }),
    db.student.findMany({
      where,
      select: {
        id: true,
        student_id: true,
        first_name: true,
        last_name: true,
        program: true,
        year: true,
      },
      orderBy: [{ last_name: "asc" }, { first_name: "asc" }],
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    }),
    db.student.count({ where }),
  ]);

  if (!event) {
    return (
      <main className="w-full space-y-4 p-6">
        <h1 className="text-xl font-bold text-destructive">Event Not Found</h1>
        <p className="text-muted-foreground">
          The requested event was not found in the database.
        </p>
      </main>
    );
  }

  const studentAttendanceList = students.map((student) => {
    const studentLogs = event.attendance.filter(
      (att) => att.student_id === student.id,
    );

    let statusVal = "Absent";
    let lastScanTime: Date | null = null;
    let scanType: "in" | "out" | "none" = "none";

    if (studentLogs.length > 0) {
      const sortedLogs = [...studentLogs].sort(
        (a, b) => b.time.getTime() - a.time.getTime(),
      );
      const lastLog = sortedLogs[0];
      scanType = lastLog.type as "in" | "out";
      lastScanTime = lastLog.time;
      statusVal = lastLog.type === "in" ? "Timed In" : "Timed Out";
    }

    let totalMinutes = 0;
    let tempInTime: Date | null = null;

    const chronoLogs = [...studentLogs].sort(
      (a, b) => a.time.getTime() - b.time.getTime(),
    );
    chronoLogs.forEach((log) => {
      if (log.type === "in") {
        tempInTime = log.time;
      } else if (log.type === "out" && tempInTime) {
        const diffMs = log.time.getTime() - tempInTime.getTime();
        totalMinutes += diffMs / (1000 * 60);
        tempInTime = null;
      }
    });

    let renderedTime = "-";
    if (totalMinutes > 0) {
      const hrs = Math.floor(totalMinutes / 60);
      const mins = Math.floor(totalMinutes % 60);
      renderedTime = `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
    }

    return {
      id: student.id,
      student_id: student.student_id,
      first_name: student.first_name,
      last_name: student.last_name,
      program: student.program,
      year: student.year,
      status: statusVal,
      scanType,
      lastScanTime,
      renderedTime,
      logs: studentLogs.map((log) => ({
        id: log.id,
        type: log.type as "in" | "out",
        time: log.time,
      })),
    };
  });

  return (
    <main className="w-full space-y-6">
      <PageTitle
        title={event.name}
        desc="Event Dashboard, scanning tracking statistics, and user flow charts."
        icon={CalendarDays}
      />

      <EventDashboard event={event} />

      <EventAttendanceTable
        data={studentAttendanceList}
        totalCount={totalCount}
        pageSize={pageSize}
        currentPage={currentPage}
        eventId={id}
      />
    </main>
  );
}
