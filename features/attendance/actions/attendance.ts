"use server";

import { db } from "@/lib/prisma";
import { checkPermission } from "@/features/auth/lib/permissions";
import { ManualImportStudentsInput, EditStudentInput } from "../schema/master-list";
import { logAudit } from "@/features/audit-logs/actions/audit";

export async function ManualImportStudents(data: ManualImportStudentsInput) {
  const { authorized, error, user } =
    await checkPermission("attendance:import");

  if (!authorized) {
    return { ok: false, error };
  }

  const { students } = data;

  try {
    await db.student.createMany({
      data: students.map((s) => ({
        student_id: s.studentNumber,
        first_name: s.firstName,
        last_name: s.lastName,
        year: s.year,
        program: s.program,
      })),
      skipDuplicates: true,
    });

    await logAudit({
      log: `Imported ${students.length} students via manual list upload.`,
      type: "success",
      category: "attendance",
    });

    return { ok: true, message: "Students imported successfully" };
  } catch (err) {
    console.error("Failed to import students:", err);
    return { ok: false, error: "An error occurred while importing students" };
  }
}

export async function UpdateStudent(data: EditStudentInput) {
  const { authorized, error, user } =
    await checkPermission("attendance:manage");

  if (!authorized) {
    return { ok: false, error };
  }

  try {
    await db.student.update({
      where: { id: data.id },
      data: {
        student_id: data.studentNumber,
        first_name: data.firstName,
        last_name: data.lastName,
        year: data.year,
        program: data.program,
      },
    });

    await logAudit({
      log: `Updated student '${data.firstName} ${data.lastName}' (ID/Number: ${data.studentNumber}).`,
      type: "success",
      category: "attendance",
    });

    return { ok: true, message: "Student updated successfully" };
  } catch (err) {
    console.error("Failed to update student:", err);
    return { ok: false, error: "An error occurred while updating student" };
  }
}

export async function DeleteStudent(id: string) {
  const { authorized, error, user } =
    await checkPermission("attendance:manage");

  if (!authorized) {
    return { ok: false, error };
  }

  try {
    const student = await db.student.findUnique({
      where: { id },
    });

    if (!student) {
      return { ok: false, error: "Student not found." };
    }

    await db.student.delete({
      where: { id },
    });

    await logAudit({
      log: `Deleted student '${student.first_name} ${student.last_name}' (ID/Number: ${student.student_id}).`,
      type: "success",
      category: "attendance",
    });

    return { ok: true, message: "Student deleted successfully" };
  } catch (err) {
    console.error("Failed to delete student:", err);
    return { ok: false, error: "An error occurred while deleting student" };
  }
}

export async function GetStudentScanStatus(eventId: string, scannedResult: string) {
  const { authorized, error } = await checkPermission("attendance:scan");
  if (!authorized) {
    return { ok: false, error: error || "Unauthorized" };
  }

  const query = scannedResult.trim();

  try {
    let student = await db.student.findUnique({
      where: { student_id: query },
    });

    if (!student) {
      const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(query);
      if (isUuid) {
        student = await db.student.findUnique({
          where: { id: query },
        });
      }
    }

    if (!student) {
      return { ok: false, error: "Student not registered." };
    }

    const event = await db.attendanceEvents.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return { ok: false, error: "Attendance event not found." };
    }

    const lastAttendance = await db.attendance.findFirst({
      where: {
        student_id: student.id,
        event_id: eventId,
      },
      orderBy: {
        time: "desc",
      },
    });

    return {
      ok: true,
      student: {
        id: student.id,
        student_id: student.student_id,
        first_name: student.first_name,
        last_name: student.last_name,
        program: student.program,
        year: student.year,
      },
      lastAttendance: lastAttendance
        ? {
            id: lastAttendance.id,
            type: lastAttendance.type,
            time: lastAttendance.time,
          }
        : null,
      event: {
        id: event.id,
        name: event.name,
        requires_time_out: event.requires_time_out,
      },
    };
  } catch (err) {
    console.error("GetStudentScanStatus error:", err);
    return { ok: false, error: "Failed to resolve student scan status." };
  }
}

export async function RecordAttendance(eventId: string, studentId: string, type: "in" | "out") {
  const { authorized, error, user } = await checkPermission("attendance:scan");
  if (!authorized || !user) {
    return { ok: false, error: error || "Unauthorized" };
  }

  try {
    const student = await db.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return { ok: false, error: "Student not found." };
    }

    const event = await db.attendanceEvents.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return { ok: false, error: "Event not found." };
    }

    const record = await db.attendance.create({
      data: {
        student_id: studentId,
        event_id: eventId,
        staff_id: user.id,
        type: type === "in" ? "in" : "out",
      },
    });

    await logAudit({
      log: `Recorded Time ${type === "in" ? "In" : "Out"} for student '${student.first_name} ${student.last_name}' (ID/Number: ${student.student_id}) at event '${event.name}'.`,
      type: "success",
      category: "attendance",
    });

    return {
      ok: true,
      message: `Attendance ${type === "in" ? "Time In" : "Time Out"} recorded successfully for ${student.first_name} ${student.last_name}.`,
      record: {
        id: record.id,
        time: record.time,
        type: record.type,
      },
    };
  } catch (err) {
    console.error("RecordAttendance error:", err);
    return { ok: false, error: "Failed to record attendance." };
  }
}


