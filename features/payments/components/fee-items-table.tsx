"use client";

import { useState, useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, SlidersHorizontal, Trash2 } from "lucide-react";
import { DeleteFeeItem } from "../actions/payments";
import { toast } from "sonner";

interface FeeItemsTableProps {
  items: any[];
  filteredItems: any[];
  onItemClick: (item: any) => void;
  onRefresh: () => void;
  canUpdate?: boolean;
  canDelete?: boolean;
}

export function FeeItemsTable({
  items,
  filteredItems,
  onItemClick,
  onRefresh,
  canUpdate = true,
  canDelete = true,
}: FeeItemsTableProps) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (itemId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete fee item "${name}"?`)) return;
    setDeletingId(itemId);
    try {
      const res = await DeleteFeeItem(itemId);
      if (res.ok) {
        toast.success(`Deleted fee item "${name}".`);
        onRefresh();
      } else {
        toast.error(res.error || "Failed to delete item.");
      }
    } catch (err) {
      toast.error("An error occurred while deleting item.");
    } finally {
      setDeletingId(null);
    }
  };

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "name",
        id: "name",
        header: ({ column }) => (
          <DataGridColumnHeader title="Item Name" column={column} />
        ),
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex flex-col">
              <span className="font-bold text-sm text-foreground">
                {item.name}
              </span>
              {item.description && (
                <span className="text-xs text-muted-foreground line-clamp-1">
                  {item.description}
                </span>
              )}
            </div>
          );
        },
        enableSorting: true,
        size: 200,
      },
      {
        accessorKey: "type",
        id: "type",
        header: ({ column }) => (
          <DataGridColumnHeader title="Fee Type" column={column} />
        ),
        cell: ({ row }) => {
          const type = row.original.type;
          return (
            <Badge
              variant={type === "cf" ? "outline" : "default"}
              className="text-xs font-bold uppercase"
            >
              {type === "cf" ? "College Fee" : "Merchandise"}
            </Badge>
          );
        },
        enableSorting: true,
        size: 130,
      },
      {
        accessorKey: "price",
        id: "price",
        header: ({ column }) => (
          <DataGridColumnHeader title="Price (₱)" column={column} />
        ),
        cell: ({ row }) => {
          return (
            <span className="font-mono font-bold text-sm text-primary">
              ₱{Number(row.original.price).toFixed(2)}
            </span>
          );
        },
        enableSorting: true,
        size: 120,
      },
      {
        accessorKey: "variants",
        id: "variants",
        header: ({ column }) => (
          <DataGridColumnHeader title="Variants" column={column} />
        ),
        cell: ({ row }) => {
          const item = row.original;
          if (item.type === "cf") {
            return <span className="text-xs text-muted-foreground">---</span>;
          }
          if (item.has_variants && item.variants && item.variants.length > 0) {
            return (
              <Badge variant="outline" className="text-[10px] font-mono">
                {item.variants.length} variant(s)
              </Badge>
            );
          }
          return (
            <span className="text-xs text-muted-foreground">Single Item</span>
          );
        },
        enableSorting: false,
        size: 130,
      },
      {
        accessorKey: "quantity",
        id: "quantity",
        header: ({ column }) => (
          <DataGridColumnHeader title="Total Stock" column={column} />
        ),
        cell: ({ row }) => {
          const item = row.original;
          if (item.type === "cf") {
            return <span className="text-xs text-muted-foreground">---</span>;
          }
          return (
            <span className="font-mono text-sm font-bold text-foreground">
              {item.quantity} units
            </span>
          );
        },
        enableSorting: true,
        size: 130,
      },
      {
        accessorKey: "created_at",
        id: "created_at",
        header: ({ column }) => (
          <DataGridColumnHeader title="Created Date" column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-xs font-mono text-muted-foreground">
            {new Date(row.original.created_at).toLocaleDateString()}
          </span>
        ),
        enableSorting: true,
        size: 120,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div
              className="flex items-center justify-end"
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
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="py-2 px-2 text-xs font-semibold text-muted-foreground">
                      Options
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onItemClick(item)}
                      className="py-2.5 px-2 cursor-pointer gap-2"
                    >
                      <SlidersHorizontal className="h-4 w-4 text-primary" />
                      View Details & Stock
                    </DropdownMenuItem>
                    {canDelete && (
                      <DropdownMenuItem
                        onClick={() => handleDelete(item.id, item.name)}
                        disabled={deletingId === item.id}
                        className="py-2.5 px-2 cursor-pointer gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Item
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        enableSorting: false,
        size: 60,
      },
    ],
    [canUpdate, canDelete, deletingId, onItemClick],
  );

  const table = useReactTable({
    columns,
    data: filteredItems,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    state: {
      pagination,
      sorting,
    },
  });

  return (
    <DataGrid
      table={table}
      recordCount={filteredItems.length}
      onRowClick={onItemClick}
      tableLayout={{
        columnsPinnable: false,
        columnsResizable: false,
        columnsMovable: false,
        columnsVisibility: false,
      }}
      tableClassNames={{
        bodyRow: "h-13.5 cursor-pointer hover:bg-muted/50 transition-colors",
        headerRow: "h-13.5",
      }}
    >
      <div className="w-full space-y-3">
        <div className="hidden md:block">
          <DataGridContainer>
            <DataGridScrollArea className="w-full overflow-hidden">
              <DataGridTable />
            </DataGridScrollArea>
          </DataGridContainer>
        </div>

        <div className="block md:hidden space-y-3">
          {table.getRowModel().rows.length === 0 ? (
            <div className="p-8 text-center border rounded-xl bg-card text-muted-foreground text-sm">
              No fee or merchandise items found.
            </div>
          ) : (
            table.getRowModel().rows.map((row) => {
              const item = row.original;
              return (
                <div
                  key={item.id}
                  onClick={() => onItemClick(item)}
                  className="p-4 rounded-xl border bg-card text-card-foreground shadow-xs hover:border-primary/50 transition-colors space-y-3 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant={item.type === "cf" ? "outline" : "default"}
                          className="text-[10px] font-bold uppercase"
                        >
                          {item.type === "cf" ? "College Fee" : "Merchandise"}
                        </Badge>
                      </div>
                      <h4 className="font-bold text-sm text-foreground mt-1">
                        {item.name}
                      </h4>
                    </div>

                    <span className="font-mono font-bold text-base text-primary shrink-0">
                      ₱{Number(item.price).toFixed(2)}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">
                        Variants:
                      </span>
                      <p className="font-mono font-semibold text-foreground mt-0.5">
                        {item.type === "cf"
                          ? "---"
                          : item.has_variants && item.variants
                            ? `${item.variants.length} var`
                            : "Single"}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">
                        Total Stock:
                      </span>
                      <p className="font-mono font-semibold text-foreground mt-0.5">
                        {item.type === "cf" ? "---" : `${item.quantity} units`}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">
                        Created:
                      </span>
                      <p className="font-mono text-foreground mt-0.5">
                        {new Date(item.created_at).toLocaleDateString()}
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
