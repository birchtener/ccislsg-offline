"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  DataGrid,
  DataGridContainer,
} from "@/components/reui/data-grid/data-grid";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table";

interface BorrowsTableProps {
  borrows: any[];
  filteredBorrows: any[];
}

export function BorrowsTable({
  borrows,
  filteredBorrows,
}: BorrowsTableProps) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        id: "item",
        header: ({ column }) => (
          <DataGridColumnHeader title="Item / Tag" column={column} />
        ),
        cell: ({ row }) => {
          const borrow = row.original;
          return (
            <div>
              <div className="font-bold text-sm">{borrow.item.name}</div>
              {borrow.asset && (
                <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                  {borrow.asset.asset_tag}
                </div>
              )}
            </div>
          );
        },
        enableSorting: true,
      },
      {
        id: "borrower",
        header: ({ column }) => (
          <DataGridColumnHeader title="Borrower" column={column} />
        ),
        cell: ({ row }) => {
          const borrow = row.original;
          const studentName = borrow.student
            ? `${borrow.student.first_name} ${borrow.student.last_name}`
            : "";
          const borrowerName = borrow.borrower
            ? `${borrow.borrower.first_name} ${borrow.borrower.last_name}`
            : "";
          return borrow.student ? (
            <div>
              <div className="font-semibold text-xs text-foreground">
                {studentName}
              </div>
              <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                Student ID: {borrow.student?.student_id}
              </div>
            </div>
          ) : (
            <div>
              <div className="font-semibold text-xs text-foreground">
                {borrowerName}
              </div>
              <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                External • {borrow.borrower?.contact_number}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "created_at",
        id: "created_at",
        header: ({ column }) => (
          <DataGridColumnHeader title="Checked Out" column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-xs">
            {new Date(row.original.borrowed_at).toLocaleDateString()}
          </span>
        ),
        enableSorting: true,
      },
      {
        accessorKey: "due_date",
        id: "due_date",
        header: ({ column }) => (
          <DataGridColumnHeader title="Expected Return" column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-xs">
            {row.original.due_date
              ? new Date(row.original.due_date).toLocaleDateString()
              : "No Due Date"}
          </span>
        ),
        enableSorting: true,
      },
      {
        accessorKey: "returned_at",
        id: "returned_at",
        header: ({ column }) => (
          <DataGridColumnHeader title="Returned At" column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-xs">
            {row.original.returned_at
              ? new Date(row.original.returned_at).toLocaleDateString()
              : "-"}
          </span>
        ),
        enableSorting: true,
      },
      {
        id: "status",
        header: ({ column }) => (
          <DataGridColumnHeader title="Status" column={column} />
        ),
        cell: ({ row }) => {
          const returnedAt = row.original.returned_at;
          return (
            <Badge
              variant={returnedAt ? "secondary" : "default"}
              className={
                returnedAt
                  ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-700 border-amber-500/20"
              }
            >
              {returnedAt ? "Returned" : "Active"}
            </Badge>
          );
        },
      },
    ],
    [],
  );

  const table = useReactTable({
    columns: columns as any,
    data: filteredBorrows,
    pageCount: Math.ceil((filteredBorrows.length || 0) / pagination.pageSize),
    getRowId: (row) => row.id,
    state: { pagination, sorting },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <DataGrid
      table={table}
      recordCount={filteredBorrows.length}
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
              No borrow records found.
            </div>
          ) : (
            table.getRowModel().rows.map((row) => {
              const borrow = row.original;
              const returnedAt = borrow.returned_at;
              const studentName = borrow.student
                ? `${borrow.student.first_name} ${borrow.student.last_name}`
                : "";
              const borrowerName = borrow.borrower
                ? `${borrow.borrower.first_name} ${borrow.borrower.last_name}`
                : "";
              return (
                <div
                  key={borrow.id}
                  className="p-4 rounded-xl border bg-card text-card-foreground shadow-xs space-y-3"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant={returnedAt ? "secondary" : "default"}
                          className={
                            returnedAt
                              ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-700 border-amber-500/20"
                          }
                        >
                          {returnedAt ? "Returned" : "Active"}
                        </Badge>
                        {borrow.asset && (
                          <Badge
                            variant="outline"
                            className="text-[10px] uppercase font-mono font-bold"
                          >
                            {borrow.asset.asset_tag}
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-foreground mt-1">
                        {borrow.item.name}
                      </h4>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t">
                    <div>
                      <span className="text-muted-foreground">Borrower:</span>
                      <p className="font-medium text-foreground mt-0.5">
                        {borrow.student ? studentName : borrowerName}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {borrow.student
                          ? `ID: ${borrow.student.student_id}`
                          : `Contact: ${borrow.borrower?.contact_number || "N/A"}`}
                      </p>
                    </div>

                    <div>
                      <span className="text-muted-foreground">Quantity Borrowed:</span>
                      <p className="font-mono font-bold text-foreground mt-0.5">
                        {borrow.quantity}
                      </p>
                    </div>

                    <div>
                      <span className="text-muted-foreground">Checked Out:</span>
                      <p className="font-mono text-foreground mt-0.5">
                        {new Date(borrow.borrowed_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div>
                      <span className="text-muted-foreground">Expected Return:</span>
                      <p className="font-mono text-foreground mt-0.5">
                        {borrow.due_date
                          ? new Date(borrow.due_date).toLocaleDateString()
                          : "No Due Date"}
                      </p>
                    </div>

                    {returnedAt && (
                      <div>
                        <span className="text-muted-foreground">Returned At:</span>
                        <p className="font-mono text-foreground mt-0.5">
                          {new Date(returnedAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
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
