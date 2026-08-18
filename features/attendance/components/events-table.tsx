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
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Edit2, Trash, QrCode, Users } from "lucide-react";
import { format, isSameDay } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface EventsTableProps {
  data: any[];
  onEdit: (event: any) => void;
  onDelete: (event: any) => void;
  canUpdate: boolean;
  canDelete: boolean;
}

export function EventsTable({
  data,
  onEdit,
  onDelete,
  canUpdate,
  canDelete,
}: EventsTableProps) {
  const router = useRouter();
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "name",
        id: "name",
        header: ({ column }) => (
          <DataGridColumnHeader title="Event Name" column={column} />
        ),
        cell: ({ row }) => (
          <span className="font-semibold text-foreground">
            {row.getValue("name")}
          </span>
        ),
        enableSorting: true,
        size: 250,
      },
      {
        id: "dates",
        header: ({ column }) => (
          <DataGridColumnHeader title="Event Date(s)" column={column} />
        ),
        accessorFn: (row) => row.start_date,
        cell: ({ row }) => {
          const start = new Date(row.original.start_date);
          const end = new Date(row.original.end_date);
          const dateStr = isSameDay(start, end)
            ? format(start, "MMM d, yyyy")
            : `${format(start, "MMM d, yyyy")} - ${format(end, "MMM d, yyyy")}`;
          return (
            <Link
              href={`/dashboard/attendance/events/${row.original.id}`}
              className="text-muted-foreground text-sm font-medium  block w-full"
            >
              {dateStr}
            </Link>
          );
        },
        enableSorting: true,
        size: 300,
      },
      {
        accessorKey: "requires_time_out",
        id: "requires_time_out",
        header: ({ column }) => (
          <DataGridColumnHeader title="Requires Time Out" column={column} />
        ),
        cell: ({ row }) => {
          const req = row.getValue("requires_time_out") as boolean;
          return (
            <Badge variant={req ? "default" : "outline"}>
              {req ? "Yes" : "No"}
            </Badge>
          );
        },
        enableSorting: true,
        size: 150,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const event = row.original;
          return (
            <div
              className="flex items-center justify-end pr-4"
              onClick={(e) => e.stopPropagation()}
            >
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
                    <DropdownMenuLabel className="py-2 px-2 text-xs font-semibold text-muted-foreground">
                      Actions
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      disabled={!canUpdate}
                      onClick={() => onEdit(event)}
                      className="py-4 px-2 cursor-pointer gap-2"
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit Details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={!canDelete}
                      onClick={() => onDelete(event)}
                      className="py-4 px-2 cursor-pointer gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
                    >
                      <Trash className="h-4 w-4" />
                      Delete Event
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        enableSorting: false,
        size: 80,
      },
    ],
    [onEdit, onDelete, canUpdate, canDelete],
  );

  const table = useReactTable({
    columns: columns as any,
    data,
    pageCount: Math.ceil((data?.length || 0) / pagination.pageSize),
    getRowId: (row: any) => row.id,
    state: {
      pagination,
      sorting,
    },
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
      recordCount={data?.length || 0}
      onRowClick={(row) => router.push(`/dashboard/attendance/events/${row.id}`)}
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
              No events found.
            </div>
          ) : (
            table.getRowModel().rows.map((row) => {
              const event = row.original;
              const createdUser = event.created_user;
              return (
                <div
                  key={event.id}
                  onClick={() => router.push(`/dashboard/attendance/events/${event.id}`)}
                  className="p-4 rounded-xl border bg-card text-card-foreground shadow-xs hover:border-primary/50 transition-colors space-y-3 cursor-pointer"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant={event.requires_time_out ? "default" : "secondary"}
                          className="text-[10px]"
                        >
                          {event.requires_time_out ? "Time-Out Required" : "Check-in Only"}
                        </Badge>
                      </div>
                      <h4 className="font-bold text-sm text-foreground mt-1">
                        {event.name}
                      </h4>
                    </div>

                    {/* Actions Dropdown */}
                    <div onClick={(e) => e.stopPropagation()}>
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
                              onClick={() => router.push(`/dashboard/attendance/events/${event.id}/scan`)}
                              className="py-3 px-2 cursor-pointer gap-2"
                            >
                              <QrCode className="h-4 w-4" />
                              Scan QR Code
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => router.push(`/dashboard/attendance/events/${event.id}`)}
                              className="py-3 px-2 cursor-pointer gap-2"
                            >
                              <Users className="h-4 w-4" />
                              View Attendance
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              disabled={!canUpdate}
                              onClick={() => onEdit(event)}
                              className="py-3 px-2 cursor-pointer gap-2"
                            >
                              <Edit2 className="h-4 w-4" />
                              Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={!canDelete}
                              onClick={() => onDelete(event)}
                              className="py-3 px-2 cursor-pointer gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
                            >
                              <Trash className="h-4 w-4" />
                              Delete Event
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t">
                    <div>
                      <span className="text-muted-foreground">Start Date:</span>
                      <p className="font-mono text-foreground mt-0.5">
                        {new Date(event.start_date).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">End Date:</span>
                      <p className="font-mono text-foreground mt-0.5">
                        {event.end_date ? new Date(event.end_date).toLocaleString() : "N/A"}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Created By:</span>
                      <p className="font-medium text-foreground mt-0.5">
                        {createdUser ? `${createdUser.first_name} ${createdUser.last_name}` : "System"}
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
