"use client";

import { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RestoreInventoryItem } from "@/features/inventory/actions/inventory";
import { DeleteDisposeDialog } from "./delete-dispose-dialog";
import {
  MoreHorizontal,
  Printer,
  Trash2,
  Edit,
  RotateCcw,
  Info,
} from "lucide-react";
import { toast } from "sonner";

interface ItemsTableProps {
  items: any[];
  filteredItems: any[];
  selectedItemIds: Set<string>;
  toggleItemSelection: (id: string, checked: boolean) => void;
  toggleAllItems: (checked: boolean) => void;
  handlePrintItemAssets: (item: any) => void;
  onRefresh: () => void;
  onItemClick?: (item: any) => void;
  onEdit?: (item: any) => void;
}

export function ItemsTable({
  items,
  filteredItems,
  selectedItemIds,
  toggleItemSelection,
  toggleAllItems,
  handlePrintItemAssets,
  onRefresh,
  onItemClick,
  onEdit,
}: ItemsTableProps) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [targetItemForDelete, setTargetItemForDelete] = useState<any | null>(
    null,
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [filteredItems]);

  const handleRestoreItem = async (item: any) => {
    const res = await RestoreInventoryItem(item.id);
    if (res.ok) {
      toast.success(`Restored item "${item.name}" to active inventory.`);
      onRefresh();
    } else {
      toast.error(res.error || "Failed to restore item.");
    }
  };

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        id: "select",
        header: () => (
          <div
            className="flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Checkbox
              checked={
                filteredItems.filter((i) => {
                  const t = String(i.type || i.category?.type || "SUPPLIES")
                    .toUpperCase()
                    .trim();
                  return (
                    !i.is_disposed && (t === "PROPERTY" || t === "EQUIPMENT")
                  );
                }).length > 0 &&
                filteredItems
                  .filter((i) => {
                    const t = String(i.type || i.category?.type || "SUPPLIES")
                      .toUpperCase()
                      .trim();
                    return (
                      !i.is_disposed && (t === "PROPERTY" || t === "EQUIPMENT")
                    );
                  })
                  .every((i) => selectedItemIds.has(i.id))
              }
              onCheckedChange={(checked) => toggleAllItems(!!checked)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ),
        cell: ({ row }) => {
          const item = row.original;
          const isTracked =
            !item.is_disposed &&
            (item.type === "PROPERTY" || item.type === "EQUIPMENT");
          return isTracked ? (
            <div
              className="flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <Checkbox
                checked={selectedItemIds.has(item.id)}
                onCheckedChange={(checked) =>
                  toggleItemSelection(item.id, !!checked)
                }
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          ) : null;
        },
        size: 40,
        maxSize: 40,
      },
      {
        accessorKey: "item_code",
        id: "item_code",
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Item Code"
            column={column}
            className="whitespace-normal leading-tight"
          />
        ),
        cell: ({ row }) => {
          const item = row.original;
          const code = item.item_code || item.assets?.[0]?.asset_tag;
          const isTracked =
            item.type === "PROPERTY" || item.type === "EQUIPMENT";

          if (!isTracked) {
            return (
              <span className="text-muted-foreground text-xs font-mono">
                --
              </span>
            );
          }

          return (
            <span className="font-mono text-xs font-bold text-foreground break-all leading-tight inline-block">
              {code || "--"}
            </span>
          );
        },
        size: 110,
        enableSorting: true,
      },
      {
        accessorKey: "name",
        id: "name",
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Item"
            column={column}
            className="whitespace-normal leading-tight"
          />
        ),
        cell: ({ row }) => (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onItemClick?.(row.original);
            }}
            className="font-bold cursor-pointer hover:underline text-primary break-words leading-tight block"
          >
            {row.original.name}
          </span>
        ),
        size: 140,
        enableSorting: true,
      },
      {
        accessorKey: "description",
        id: "description",
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Item Description"
            column={column}
            className="whitespace-normal leading-tight"
          />
        ),
        cell: ({ row }) => (
          <span
            className="text-xs text-muted-foreground line-clamp-2 break-words leading-tight block"
            title={row.original.description || ""}
          >
            {row.original.description || "--"}
          </span>
        ),
        size: 150,
        enableSorting: false,
      },
      {
        accessorKey: "serial_number",
        id: "serial_number",
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Serial No."
            column={column}
            className="whitespace-normal leading-tight"
          />
        ),
        cell: ({ row }) => {
          const isTracked =
            row.original.type === "PROPERTY" ||
            row.original.type === "EQUIPMENT";
          if (!isTracked) {
            return (
              <span className="text-muted-foreground text-xs font-mono">
                --
              </span>
            );
          }
          return (
            <span className="text-xs font-mono break-all leading-tight block">
              {row.original.serial_number || "--"}
            </span>
          );
        },
        size: 110,
        enableSorting: true,
      },
      {
        accessorFn: (row) => row.type,
        id: "item_type",
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Item Type"
            column={column}
            className="whitespace-normal leading-tight"
          />
        ),
        cell: ({ row }) => {
          const type = row.original.type || "SUPPLIES";
          let variant: "default" | "outline" | "secondary" = "outline";
          let badgeClass = "text-[10px] font-mono tracking-wide";
          if (type === "PROPERTY")
            badgeClass += " border-blue-500/40 text-blue-600 bg-blue-500/10";
          else if (type === "EQUIPMENT")
            badgeClass +=
              " border-purple-500/40 text-purple-600 bg-purple-500/10";
          else if (type === "SUPPLIES")
            badgeClass +=
              " border-emerald-500/40 text-emerald-600 bg-emerald-500/10";

          return (
            <Badge
              variant={variant}
              className={cn(
                badgeClass,
                "whitespace-normal text-center leading-tight",
              )}
            >
              {type}
            </Badge>
          );
        },
        size: 95,
        enableSorting: true,
      },
      {
        accessorFn: (row) => row.category?.name,
        id: "category",
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Category"
            column={column}
            className="whitespace-normal leading-tight"
          />
        ),
        cell: ({ row }) => (
          <span
            className="text-xs text-foreground wrap-break-word leading-tight line-clamp-2 block"
            title={row.original.category?.name || "Uncategorized"}
          >
            {row.original.category?.name || "Uncategorized"}
          </span>
        ),
        size: 105,
        enableSorting: true,
      },
      {
        accessorKey: "quantity",
        id: "quantity",
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Quantity"
            column={column}
            className="whitespace-normal leading-tight"
          />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs font-bold leading-tight block whitespace-normal">
            {row.original.quantity} {row.original.unit || "pcs"}
          </span>
        ),
        size: 85,
        enableSorting: true,
      },
      {
        accessorKey: "source_of_fund",
        id: "source_of_fund",
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Source"
            column={column}
            className="whitespace-normal leading-tight"
          />
        ),
        cell: ({ row }) => (
          <span
            className="text-xs text-muted-foreground wrap-break-word leading-tight line-clamp-2 block"
            title={row.original.source_of_fund || ""}
          >
            {row.original.source_of_fund || "--"}
          </span>
        ),
        size: 105,
        enableSorting: true,
      },
      {
        accessorKey: "created_at",
        id: "created_at",
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Inventory Date"
            column={column}
            className="whitespace-normal leading-tight"
          />
        ),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground font-mono leading-tight block whitespace-normal">
            {row.original.created_at
              ? new Date(row.original.created_at).toLocaleDateString()
              : "--/--/----"}
          </span>
        ),
        size: 95,
        enableSorting: true,
      },
      {
        accessorKey: "date_purchased",
        id: "date_purchased",
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Purchased at"
            column={column}
            className="whitespace-normal leading-tight"
          />
        ),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground font-mono leading-tight block whitespace-normal">
            {row.original.date_purchased
              ? new Date(row.original.date_purchased).toLocaleDateString()
              : "--/--/----"}
          </span>
        ),
        size: 95,
        enableSorting: true,
      },
      {
        id: "actions",
        header: "",
        size: 45,
        maxSize: 45,
        cell: ({ row }) => {
          const item = row.original;
          const isTracked =
            item.type === "PROPERTY" || item.type === "EQUIPMENT";
          const isDisposed = Boolean(item.is_disposed);

          return (
            <div onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                  render={<Button variant="ghost" size="icon" />}
                >
                  <MoreHorizontal className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  sideOffset={4}
                  className="w-48"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      className="h-13.5 px-3!"
                      onClick={(e) => {
                        e.stopPropagation();
                        onItemClick?.(item);
                      }}
                    >
                      <Info className="size-4" />
                      View Details & Logs
                    </DropdownMenuItem>

                    {!isDisposed && onEdit && (
                      <DropdownMenuItem
                        className="h-13.5 px-3!"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(item);
                        }}
                      >
                        <Edit className="size-4" />
                        Edit Item
                      </DropdownMenuItem>
                    )}

                    {!isDisposed && isTracked && (
                      <DropdownMenuItem
                        className="h-13.5 px-3!"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePrintItemAssets(item);
                        }}
                      >
                        <Printer className="size-4" />
                        Print Asset Tags
                      </DropdownMenuItem>
                    )}

                    {isDisposed && (
                      <DropdownMenuItem
                        className="h-13.5 px-3! text-emerald-600 focus:text-emerald-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestoreItem(item);
                        }}
                      >
                        <RotateCcw className="size-4" />
                        Restore to Active
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      className="h-13.5 px-3!"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTargetItemForDelete(item);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="size-4" />
                      {isDisposed ? "Delete Permanently" : "Delete / Dispose"}
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [selectedItemIds, filteredItems, handlePrintItemAssets, onEdit],
  );

  const table = useReactTable({
    data: filteredItems,
    columns,
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
    <>
      <DataGrid
        table={table}
        recordCount={filteredItems.length}
        onRowClick={(item) => onItemClick?.(item)}
        tableLayout={{
          width: "auto",
          columnsPinnable: false,
          columnsResizable: false,
          columnsMovable: false,
          columnsVisibility: false,
        }}
        tableClassNames={{
          base: "w-full table-auto",
          headerRow: "min-h-13.5 h-auto py-2.5",
          bodyRow: "min-h-13.5 h-auto py-2.5 hover:bg-muted/40 cursor-pointer",
        }}
      >
        <div className="w-full space-y-3">
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <DataGridContainer>
              <DataGridScrollArea className="w-full overflow-x-auto">
                <DataGridTable />
              </DataGridScrollArea>
            </DataGridContainer>
          </div>

          {/* Mobile Card List View */}
          <div className="block md:hidden space-y-3">
            {table.getRowModel().rows.length === 0 ? (
              <div className="p-8 text-center border rounded-xl bg-card text-muted-foreground text-sm">
                No inventory items found.
              </div>
            ) : (
              table.getRowModel().rows.map((row) => {
                const item = row.original;
                const isDisposed = Boolean(item.is_disposed);
                const isTracked =
                  !isDisposed &&
                  (item.type === "PROPERTY" || item.type === "EQUIPMENT");
                const code = item.item_code || item.assets?.[0]?.asset_tag;
                const type = item.type || "SUPPLIES";

                let badgeClass = "text-[10px] font-mono tracking-wide";
                if (type === "PROPERTY")
                  badgeClass +=
                    " border-blue-500/40 text-blue-600 bg-blue-500/10";
                else if (type === "EQUIPMENT")
                  badgeClass +=
                    " border-purple-500/40 text-purple-600 bg-purple-500/10";
                else if (type === "SUPPLIES")
                  badgeClass +=
                    " border-emerald-500/40 text-emerald-600 bg-emerald-500/10";

                return (
                  <div
                    key={item.id}
                    onClick={() => onItemClick?.(item)}
                    className="p-4 rounded-xl border bg-card text-card-foreground shadow-xs space-y-3 cursor-pointer hover:border-primary/50 transition-all text-left"
                  >
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        {isTracked && (
                          <div
                            className="pt-0.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Checkbox
                              checked={selectedItemIds.has(item.id)}
                              onCheckedChange={(checked) =>
                                toggleItemSelection(item.id, !!checked)
                              }
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {code && (
                              <span className="font-mono text-xs font-bold text-foreground bg-muted/80 px-2 py-0.5 rounded border">
                                {code}
                              </span>
                            )}
                            <Badge variant="outline" className={badgeClass}>
                              {type}
                            </Badge>
                            {item.category?.name && (
                              <Badge
                                variant="outline"
                                className="text-[10px] uppercase font-mono tracking-tighter"
                              >
                                {item.category.name}
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-bold text-sm text-foreground mt-1.5 line-clamp-1">
                            {item.name}
                          </h4>
                          {item.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions Menu */}
                      <div onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted cursor-pointer shrink-0"
                            onClick={(e) => e.stopPropagation()}
                            render={<Button variant="ghost" size="icon" />}
                          >
                            <MoreHorizontal className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            sideOffset={4}
                            className="w-48"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DropdownMenuGroup>
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="h-13.5 px-3!"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onItemClick?.(item);
                                }}
                              >
                                <Info className="size-4" />
                                View Details & Logs
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                className="h-13.5 px-3!"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEdit?.(item);
                                }}
                              >
                                <Edit className="size-4" />
                                Edit Item
                              </DropdownMenuItem>

                              {isTracked && !isDisposed && (
                                <DropdownMenuItem
                                  className="h-13.5 px-3!"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePrintItemAssets(item);
                                  }}
                                >
                                  <Printer className="size-4" />
                                  Print Asset Tags
                                </DropdownMenuItem>
                              )}

                              {isDisposed && (
                                <DropdownMenuItem
                                  className="h-13.5 px-3! text-emerald-600 focus:text-emerald-700"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRestoreItem(item);
                                  }}
                                >
                                  <RotateCcw className="size-4" />
                                  Restore to Active
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                className="h-13.5 px-3!"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTargetItemForDelete(item);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="size-4" />
                                {isDisposed
                                  ? "Delete Permanently"
                                  : "Delete / Dispose"}
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Card Body / Metadata Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-2 border-t">
                      <div>
                        <span className="text-[11px] text-muted-foreground block">
                          Quantity:
                        </span>
                        <p className="font-mono font-bold text-foreground mt-0.5">
                          {item.quantity} {item.unit || "pcs"}
                        </p>
                      </div>
                      {item.serial_number && (
                        <div>
                          <span className="text-[11px] text-muted-foreground block">
                            Serial No:
                          </span>
                          <p className="font-mono text-foreground mt-0.5 truncate">
                            {item.serial_number}
                          </p>
                        </div>
                      )}
                      {item.source_of_fund && (
                        <div>
                          <span className="text-[11px] text-muted-foreground block">
                            Source:
                          </span>
                          <p className="text-foreground mt-0.5 truncate">
                            {item.source_of_fund}
                          </p>
                        </div>
                      )}
                      <div>
                        <span className="text-[11px] text-muted-foreground block">
                          Inventory Date:
                        </span>
                        <p className="font-mono text-foreground mt-0.5">
                          {item.created_at
                            ? new Date(item.created_at).toLocaleDateString()
                            : "--/--/----"}
                        </p>
                      </div>
                      <div>
                        <span className="text-[11px] text-muted-foreground block">
                          {isDisposed ? "Disposed at:" : "Purchased at:"}
                        </span>
                        <p className="font-mono text-foreground mt-0.5">
                          {isDisposed && item.disposed_at
                            ? new Date(item.disposed_at).toLocaleDateString()
                            : item.date_purchased
                              ? new Date(
                                  item.date_purchased,
                                ).toLocaleDateString()
                              : "--/--/----"}
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

      <DeleteDisposeDialog
        item={targetItemForDelete}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onSuccess={onRefresh}
      />
    </>
  );
}
