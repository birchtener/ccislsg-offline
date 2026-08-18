"use client";

import { useMemo, useState } from "react";
import {
  DataGrid,
  DataGridContainer,
} from "@/components/reui/data-grid/data-grid";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table";
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Student } from "@/lib/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type StudentData = Omit<Student, "created_at">;

interface MasterListTableProps {
  data: StudentData[];
  totalCount: number;
  pageSize: number;
  currentPage: number;
  onEdit: (student: StudentData) => void;
  onDelete: (id: string) => void;
}

export function MasterListTable({
  data,
  totalCount,
  pageSize,
  currentPage,
  onEdit,
  onDelete,
}: MasterListTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [sorting, setSorting] = useState<SortingState>([]);

  const handlePaginationChange = (updater: any) => {
    const nextState = typeof updater === "function"
      ? updater({ pageIndex: currentPage - 1, pageSize })
      : updater;
    const nextPage = nextState.pageIndex + 1;
    const nextLimit = nextState.pageSize;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));
    params.set("limit", String(nextLimit));
    router.push(`${pathname}?${params.toString()}`);
  };

  const columns = useMemo<ColumnDef<StudentData>[]>(
    () => [
      {
        accessorKey: "student_id",
        id: "student_id",
        header: ({ column }) => (
          <DataGridColumnHeader title="ID" column={column} />
        ),
        enableSorting: true,
        size: 100,
      },
      {
        accessorKey: "last_name",
        id: "last_name",
        header: ({ column }) => (
          <DataGridColumnHeader title="Last Name" column={column} />
        ),
        enableSorting: true,
        size: 200,
      },
      {
        accessorKey: "first_name",
        id: "first_name",
        header: ({ column }) => (
          <DataGridColumnHeader title="First Name" column={column} />
        ),
        enableSorting: true,
        size: 200,
      },
      {
        accessorKey: "program",
        id: "program",
        header: ({ column }) => (
          <DataGridColumnHeader title="Program" column={column} />
        ),
        enableSorting: true,
        size: 100,
      },
      {
        accessorKey: "year",
        id: "year",
        header: ({ column }) => (
          <DataGridColumnHeader title="Year" column={column} />
        ),
        enableSorting: true,
        size: 80,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center justify-end pr-4">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    <MoreHorizontal className="h-4.5 w-4.5" />
                    <span className="sr-only">Actions</span>
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="py-2 px-2 text-xs font-semibold text-muted-foreground">Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onEdit(row.original)}
                    className="py-4 px-2 cursor-pointer gap-2"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit Details
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(row.original.id)}
                    className="py-4 px-2 cursor-pointer gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
                  >
                    <Trash className="h-4 w-4" />
                    Delete Student
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
        enableSorting: false,
        size: 80,
      },
    ],
    [onEdit, onDelete],
  );

  const table = useReactTable({
    columns,
    data,
    pageCount: Math.ceil(totalCount / pageSize),
    getRowId: (row: StudentData) => row.id,
    state: {
      pagination: {
        pageIndex: currentPage - 1,
        pageSize,
      },
      sorting,
    },
    onPaginationChange: handlePaginationChange,
    manualPagination: true,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <DataGrid
      table={table}
      recordCount={totalCount}
      tableLayout={{
        columnsPinnable: false,
        columnsResizable: false,
        columnsMovable: false,
        columnsVisibility: false,
      }}
      tableClassNames={{
        bodyRow: "h-13.5",
        headerRow: "h-13.5",
      }}
    >
      <div className="w-full space-y-3">
        {/* Desktop Table View */}
        <div className="hidden md:block">
          <DataGridContainer>
            <DataGridScrollArea className="w-full overflow-hidden">
              <DataGridTable />
            </DataGridScrollArea>
          </DataGridContainer>
        </div>

        {/* Mobile Card List View */}
        <div className="block md:hidden space-y-3">
          {table.getRowModel().rows.length === 0 ? (
            <div className="p-8 text-center border rounded-xl bg-card text-muted-foreground text-sm">
              No students found.
            </div>
          ) : (
            table.getRowModel().rows.map((row) => {
              const student = row.original;
              return (
                <div
                  key={student.id}
                  className="p-4 rounded-xl border bg-card text-card-foreground shadow-xs space-y-3"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono font-bold uppercase"
                        >
                          ID: {student.student_id}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] uppercase font-bold">
                          {student.program}
                        </Badge>
                      </div>
                      <h4 className="font-bold text-sm text-foreground mt-1">
                        {student.first_name} {student.last_name}
                      </h4>
                    </div>

                    {/* Actions Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-muted-foreground hover:text-foreground"
                          >
                            <MoreHorizontal className="h-4.5 w-4.5" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuGroup>
                          <DropdownMenuLabel className="py-2 px-2 text-xs font-semibold text-muted-foreground">Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onEdit(student)}
                            className="py-3 px-2 cursor-pointer gap-2"
                          >
                            <Edit2 className="h-4 w-4" />
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDelete(student.id)}
                            className="py-3 px-2 cursor-pointer gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
                          >
                            <Trash className="h-4 w-4" />
                            Delete Student
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Card Body */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t">
                    <div>
                      <span className="text-muted-foreground">Year Level:</span>
                      <p className="font-medium text-foreground mt-0.5">
                        Year {student.year}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Program:</span>
                      <p className="font-semibold text-foreground mt-0.5">
                        {student.program}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <DataGridPagination />
      </div>
    </DataGrid>
  );
}
