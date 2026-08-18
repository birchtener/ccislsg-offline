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
import { User } from "@/lib/generated/prisma/client";
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
import { MoreHorizontal, Edit2, Trash, KeyRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UsersTableProps {
  data: any[]; 
  onEdit: (user: any) => void;
  onDelete: (id: string) => void;
  onResetPassword: (user: any) => void;
  canUpdate: boolean;
  canDelete: boolean;
  currentUserId: string;
}

export function UsersTable({
  data,
  onEdit,
  onDelete,
  onResetPassword,
  canUpdate,
  canDelete,
  currentUserId,
}: UsersTableProps) {
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
          <DataGridColumnHeader title="Name" column={column} />
        ),
        cell: ({ row }) => {
          const name = (row.getValue("name") as string) || "";
          const image = row.original.image as string | null;
          return (
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={image || undefined} alt={name || undefined} />
                <AvatarFallback>{name.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <span className="font-medium text-foreground">{name}</span>
            </div>
          );
        },
        enableSorting: true,
        size: 200,
      },
      {
        accessorKey: "username",
        id: "username",
        header: ({ column }) => (
          <DataGridColumnHeader title="Username" column={column} />
        ),
        enableSorting: true,
        size: 200,
      },
      {
        accessorFn: (row) => row.role?.name || "",
        id: "role",
        header: ({ column }) => (
          <DataGridColumnHeader title="Role" column={column} />
        ),
        enableSorting: true,
        size: 200,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const user = row.original;
          const isCurrentUser = user.id === currentUserId;
          return (
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
                      disabled={!canUpdate}
                      onClick={() => onEdit(user)}
                      className="py-4 px-2 cursor-pointer gap-2"
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit Details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={!canUpdate}
                      onClick={() => onResetPassword(user)}
                      className="py-4 px-2 cursor-pointer gap-2"
                    >
                      <KeyRound className="h-4 w-4" />
                      Reset Password
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={!canDelete || isCurrentUser}
                      onClick={() => onDelete(user.id)}
                      className="py-4 px-2 cursor-pointer gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
                    >
                      <Trash className="h-4 w-4" />
                      Delete User
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
    [onEdit, onDelete, onResetPassword, canUpdate, canDelete, currentUserId],
  );

  const table = useReactTable({
    columns: columns as any,
    data,
    pageCount: Math.ceil((data?.length || 0) / pagination.pageSize),
    getRowId: (row: User) => row.id,
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
              No users found.
            </div>
          ) : (
            table.getRowModel().rows.map((row) => {
              const user = row.original;
              const isCurrentUser = user.id === currentUserId;
              const name = user.name || "";
              const image = user.image as string | null;
              return (
                <div
                  key={user.id}
                  className="p-4 rounded-xl border bg-card text-card-foreground shadow-xs space-y-3"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={image || undefined} alt={name || undefined} />
                        <AvatarFallback>{name.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-bold text-sm text-foreground">{name}</h4>
                        <span className="text-xs text-muted-foreground">@{user.username}</span>
                      </div>
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
                            disabled={!canUpdate}
                            onClick={() => onEdit(user)}
                            className="py-3 px-2 cursor-pointer gap-2"
                          >
                            <Edit2 className="h-4 w-4" />
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={!canUpdate}
                            onClick={() => onResetPassword(user)}
                            className="py-3 px-2 cursor-pointer gap-2"
                          >
                            <KeyRound className="h-4 w-4" />
                            Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={!canDelete || isCurrentUser}
                            onClick={() => onDelete(user.id)}
                            className="py-3 px-2 cursor-pointer gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
                          >
                            <Trash className="h-4 w-4" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Card Body */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t">
                    <div>
                      <span className="text-muted-foreground">Role:</span>
                      <p className="font-medium text-foreground mt-0.5">
                        {(user as any).role?.name || "No Role"}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <p className="font-medium text-foreground mt-0.5 truncate">
                        {user.email || "N/A"}
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
