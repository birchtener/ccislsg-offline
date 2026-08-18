"use server";

import { db } from "@/lib/prisma";
import { checkPermission } from "@/features/auth/lib/permissions";
import { EventFormSchema, EventFormInput } from "../schema/events";
import { logAudit } from "@/features/audit-logs/actions/audit";

function parseDateBounds(input: Date | string, isEnd = false): Date {
  let year: number;
  let month: number;
  let day: number;

  if (typeof input === "string") {
    const dateOnly = input.split("T")[0];
    const parts = dateOnly.split("-").map(Number);
    if (parts.length === 3 && !parts.some(isNaN)) {
      [year, month, day] = parts;
    } else {
      const d = new Date(input);
      year = d.getFullYear();
      month = d.getMonth() + 1;
      day = d.getDate();
    }
  } else {
    year = input.getFullYear();
    month = input.getMonth() + 1;
    day = input.getDate();
  }

  const pad = (n: number) => n.toString().padStart(2, "0");
  const dateStr = `${year}-${pad(month)}-${pad(day)}`;
  const timeStr = isEnd ? "23:59:59.999" : "00:00:00.000";

  return new Date(`${dateStr}T${timeStr}+08:00`);
}

export async function CreateEvent(data: EventFormInput) {
  const { authorized, error, user } = await checkPermission("attendance:manage");
  if (!authorized || !user) {
    return { ok: false, error: error || "Unauthorized" };
  }

  const parsed = EventFormSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  let finalStart: Date;
  let finalEnd: Date;

  if (data.isRange) {
    if (!data.startDate || !data.endDate) {
      return { ok: false, error: "Start and End dates are required." };
    }
    finalStart = parseDateBounds(data.startDate, false);
    finalEnd = parseDateBounds(data.endDate, true);
  } else {
    if (!data.singleDate) {
      return { ok: false, error: "Event date is required." };
    }
    finalStart = parseDateBounds(data.singleDate, false);
    finalEnd = parseDateBounds(data.singleDate, true);
  }

  try {
    await db.attendanceEvents.create({
      data: {
        name: data.name.trim(),
        start_date: finalStart,
        end_date: finalEnd,
        requires_time_out: data.requires_time_out,
        created_by: user.id,
      },
    });

    await logAudit({
      log: `Created attendance event '${data.name.trim()}'.`,
      type: "success",
      category: "events",
    });

    return { ok: true, message: "Event created successfully" };
  } catch (err) {
    return { ok: false, error: "An unexpected database error occurred." };
  }
}

export async function UpdateEvent(id: string, data: EventFormInput) {
  const { authorized, error } = await checkPermission("attendance:manage");
  if (!authorized) {
    return { ok: false, error: error || "Unauthorized" };
  }

  const parsed = EventFormSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  let finalStart: Date;
  let finalEnd: Date;

  if (data.isRange) {
    if (!data.startDate || !data.endDate) {
      return { ok: false, error: "Start and End dates are required." };
    }
    finalStart = parseDateBounds(data.startDate, false);
    finalEnd = parseDateBounds(data.endDate, true);
  } else {
    if (!data.singleDate) {
      return { ok: false, error: "Event date is required." };
    }
    finalStart = parseDateBounds(data.singleDate, false);
    finalEnd = parseDateBounds(data.singleDate, true);
  }

  try {
    const existing = await db.attendanceEvents.findUnique({
      where: { id },
    });

    if (!existing) {
      return { ok: false, error: "Event not found." };
    }

    await db.attendanceEvents.update({
      where: { id },
      data: {
        name: data.name.trim(),
        start_date: finalStart,
        end_date: finalEnd,
        requires_time_out: data.requires_time_out,
      },
    });

    await logAudit({
      log: `Updated attendance event '${data.name.trim()}' (ID: ${id}).`,
      type: "success",
      category: "events",
    });

    return { ok: true, message: "Event updated successfully" };
  } catch (err) {
    return { ok: false, error: "An unexpected database error occurred." };
  }
}

export async function DeleteEvent(id: string) {
  const { authorized, error } = await checkPermission("attendance:manage");
  if (!authorized) {
    return { ok: false, error: error || "Unauthorized" };
  }

  try {
    const existing = await db.attendanceEvents.findUnique({
      where: { id },
    });

    if (!existing) {
      return { ok: false, error: "Event not found." };
    }

    await db.$transaction(async (tx) => {
      await tx.attendance.deleteMany({
        where: { event_id: id },
      });

      await tx.attendanceEvents.delete({
        where: { id },
      });
    });

    await logAudit({
      log: `Deleted attendance event '${existing.name}' (ID: ${id}).`,
      type: "success",
      category: "events",
    });

    return { ok: true, message: "Event deleted successfully" };
  } catch (err) {
    return { ok: false, error: "An unexpected database error occurred." };
  }
}

export async function GetExportEventAttendanceData(eventId: string) {
  const { authorized, error, user } = await checkPermission("attendance:manage");
  if (!authorized || !user) {
    return { ok: false, error: error || "Unauthorized" };
  }

  try {
    const [event, students] = await Promise.all([
      db.attendanceEvents.findUnique({
        where: { id: eventId },
        include: {
          attendance: {
            orderBy: {
              time: "asc",
            },
          },
        },
      }),
      db.student.findMany({
        select: {
          id: true,
          student_id: true,
          first_name: true,
          last_name: true,
          program: true,
          year: true,
        },
        orderBy: [{ last_name: "asc" }, { first_name: "asc" }],
      }),
    ]);

    if (!event) {
      return { ok: false, error: "Event not found." };
    }

    const attendance = students.map((student) => {
      const studentLogs = event.attendance.filter(
        (att) => att.student_id === student.id,
      );

      let statusVal = "Absent";
      if (studentLogs.length > 0) {
        const sortedLogs = [...studentLogs].sort(
          (a, b) => b.time.getTime() - a.time.getTime(),
        );
        const lastLog = sortedLogs[0];
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

      const times_in = chronoLogs
        .filter((l) => l.type === "in")
        .map((l) => l.time);
      const times_out = chronoLogs
        .filter((l) => l.type === "out")
        .map((l) => l.time);

      return {
        student_id: student.student_id,
        last_name: student.last_name,
        first_name: student.first_name,
        program: student.program,
        year: student.year,
        status: statusVal,
        renderedTime,
        times_in,
        times_out,
      };
    });

    return { ok: true, eventName: event.name, attendance };
  } catch (err) {
    console.error("GetExportEventAttendanceData error:", err);
    return { ok: false, error: "An unexpected database error occurred." };
  }
}
