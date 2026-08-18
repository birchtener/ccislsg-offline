"use server";

import { db } from "@/lib/prisma";
import { checkPermission } from "@/features/auth/lib/permissions";
import { AttendanceType } from "@/lib/generated/prisma/client";

export async function RecordAttendance(
  studentNumber: string,
  eventId: string,
  type: "in" | "out"
) {
  const { authorized, error, user } = await checkPermission("attendance:scan");
  if (!authorized || !user) {
    return { ok: false, error: error || "Unauthorized" };
  }

  const sNumber = studentNumber.trim();
  if (!sNumber) {
    return { ok: false, error: "Student number is required." };
  }

  try {
    const student = await db.student.findUnique({
      where: { student_id: sNumber },
    });

    if (!student) {
      return { ok: false, error: `Student with ID "${sNumber}" not found in the master list.` };
    }

    const event = await db.attendanceEvents.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return { ok: false, error: "Selected event not found." };
    }

    if (type === "out" && !event.requires_time_out) {
      return { ok: false, error: "This event does not require Time Out." };
    }

    const existing = await db.attendance.findFirst({
      where: {
        student_id: student.id,
        event_id: eventId,
        type: type as AttendanceType,
      },
    });

    if (existing) {
      return {
        ok: false,
        error: `Student "${student.first_name} ${student.last_name}" has already logged ${
          type === "in" ? "Time In" : "Time Out"
        } for this event.`,
      };
    }

    await db.attendance.create({
      data: {
        student_id: student.id,
        event_id: eventId,
        staff_id: user.id,
        type: type as AttendanceType,
      },
    });

    return {
      ok: true,
      message: `Successfully logged ${type === "in" ? "Time In" : "Time Out"} for ${
        student.first_name
      } ${student.last_name} (${student.student_id})`,
    };
  } catch (err) {
    return { ok: false, error: "An unexpected database error occurred." };
  }
}
