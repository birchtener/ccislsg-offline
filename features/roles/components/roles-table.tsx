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
import { MoreHorizontal, Edit2, Trash } from "lucide-react";

interface RolesTableProps {
  data: any[];
  onEdit: (role: any) => void;
  onDelete: (role: any) => void;
  canUpdate: boolean;
  canDelete: boolean;
}

export function RolesTable({
  data,
  onEdit,
  onDelete,
  canUpdate,
  canDelete,
}: RolesTableProps) {
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
          <DataGridColumnHeader title="Role Name" column={column} />
        ),
        cell: ({ row }) => (
          <span className="font-semibold text-foreground">{row.getValue("name")}</span>
        ),
        enableSorting: true,
        size: 300,
      },
      {
        accessorFn: (row) => row._count?.users ?? 0,
        id: "users",
        header: ({ column }) => (
          <DataGridColumnHeader title="Users Assigned" column={column} />
        ),
        cell: ({ row }) => {
          const count = row.original._count?.users ?? 0;
          return (
            <span className="text-muted-foreground text-sm font-medium">
              {count} {count === 1 ? "user" : "users"}
            </span>
          );
        },
        enableSorting: true,
        size: 200,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const role = row.original;
          const isAdminRole = role.name.toLowerCase() === "admin";
          return (
            <div className="flex items-center justify-end pr-4">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      disabled={isAdminRole}
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
                      disabled={!canUpdate || isAdminRole}
                      onClick={() => onEdit(role)}
                      className="py-4 px-2 cursor-pointer gap-2"
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit Details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={!canDelete || isAdminRole}
                      onClick={() => onDelete(role)}
                      className="py-4 px-2 cursor-pointer gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
                    >
                      <Trash className="h-4 w-4" />
                      Delete Role
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
              No roles found.
            </div>
          ) : (
            table.getRowModel().rows.map((row) => {
              const role = row.original;
              const isAdminRole = role.name.toLowerCase() === "admin";
              const userCount = role._count?.users ?? 0;
              return (
                <div
                  key={role.id}
                  className="p-4 rounded-xl border bg-card text-card-foreground shadow-xs space-y-3"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{role.name}</h4>
                      <span className="text-xs text-muted-foreground mt-0.5 block">
                        {userCount} {userCount === 1 ? "user" : "users"} assigned
                      </span>
                    </div>

                    {/* Actions Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-muted-foreground hover:text-foreground"
                            disabled={isAdminRole}
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
                            disabled={!canUpdate || isAdminRole}
                            onClick={() => onEdit(role)}
                            className="py-3 px-2 cursor-pointer gap-2"
                          >
                            <Edit2 className="h-4 w-4" />
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={!canDelete || isAdminRole}
                            onClick={() => onDelete(role)}
                            className="py-3 px-2 cursor-pointer gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
                          >
                            <Trash className="h-4 w-4" />
                            Delete Role
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
