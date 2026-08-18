import PageTitle from "@/components/layout/dashboard/page-title";
import { MasterListClient } from "@/features/attendance/components/master-list-client";
import { checkPermission } from "@/features/auth/lib/permissions";
import { db } from "@/lib/prisma";
import { Users } from "lucide-react";
import { redirect } from "next/navigation";
import { Program } from "@/lib/generated/prisma/enums";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    program?: string;
    year?: string;
    page?: string;
    limit?: string;
  }>;
}

export default async function MasterList({ searchParams }: PageProps) {
  const { authorized } = await checkPermission("students:read");
  if (!authorized) {
    return redirect("/unauthorized");
  }

  const resolvedSearchParams = await searchParams;
  const search = resolvedSearchParams.search;
  const program = resolvedSearchParams.program;
  const year = resolvedSearchParams.year;
  const page = resolvedSearchParams.page;
  const limit = resolvedSearchParams.limit;

  const currentPage = Math.max(1, parseInt(page ?? "1", 10) || 1);
  const pageSize = Math.max(5, parseInt(limit ?? "10", 10) || 10);

  const where: any = {};

  if (search) {
    const searchLower = search.trim();
    where.OR = [
      { first_name: { contains: searchLower, mode: "insensitive" } },
      { last_name: { contains: searchLower, mode: "insensitive" } },
      { student_id: { contains: searchLower, mode: "insensitive" } },
    ];
  }

  if (program) {
    const programList = program.split(",").map((p) => p.trim());
    const validPrograms = programList.filter((p) =>
      Object.values(Program).includes(p as Program)
    ) as Program[];

    if (validPrograms.length > 0) {
      where.program = { in: validPrograms };
    }
  }

  if (year) {
    const yearList = year
      .split(",")
      .map((y) => parseInt(y.trim(), 10))
      .filter((y) => !isNaN(y));

    if (yearList.length > 0) {
      where.year = { in: yearList };
    }
  }

  const [students, totalCount] = await Promise.all([
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
      orderBy: { last_name: "asc" },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    }),
    db.student.count({ where }),
  ]);

  return (
    <main className="w-full space-y-4">
      <PageTitle
        title="Master List"
        desc="View and manage the master list of all students."
        icon={Users}
      />

      <MasterListClient
        students={students}
        totalCount={totalCount}
        pageSize={pageSize}
        currentPage={currentPage}
      />
    </main>
  );
}
