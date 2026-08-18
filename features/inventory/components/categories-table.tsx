"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ColumnDef,
  getCoreRowModel,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DeleteInventoryCategory, GetExportInventoryItemsData } from "../actions/inventory";
import { exportCategoryItemsToCsv, InventoryExportItem } from "../lib/export-items";
import { MoreHorizontal, Edit, Trash2, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CategoriesTableProps {
  categories: any[];
  onRefresh: () => void;
  onEdit: (category: any) => void;
}

export function CategoriesTable({
  categories,
  onRefresh,
  onEdit,
}: CategoriesTableProps) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [targetCategoryForDelete, setTargetCategoryForDelete] = useState<any | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [exportingCatId, setExportingCatId] = useState<string | null>(null);

  const handleExportCategory = async (cat: any) => {
    setExportingCatId(cat.id);
    try {
      const res = await GetExportInventoryItemsData({ categoryId: cat.id });
      if (!res.ok || !res.items) {
        toast.error(res.error || "Failed to fetch items for export.");
        return;
      }
      if (res.items.length === 0) {
        toast.info(`No items found in category "${cat.name}" to export.`);
        return;
      }
      exportCategoryItemsToCsv(cat.name, res.items as InventoryExportItem[]);
      toast.success(`Exported ${res.items.length} items from "${cat.name}".`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to export category items.");
    } finally {
      setExportingCatId(null);
    }
  };

  const handleDeleteCategory = async () => {
    if (!targetCategoryForDelete) return;
    setIsDeleting(true);
    try {
      const res = await DeleteInventoryCategory(targetCategoryForDelete.id);
      if (!res.ok) {
        toast.error(res.error || "Failed to delete category.");
        return;
      }
      if (res.message) {
        toast.success(res.message);
      } else {
        toast.success(`Category "${targetCategoryForDelete.name}" deleted.`);
      }
      onRefresh();
      setDeleteDialogOpen(false);
    } catch (err) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "name",
        id: "name",
        header: ({ column }) => (
          <DataGridColumnHeader title="Category Name" column={column} />
        ),
        cell: ({ row }) => {
          const isDefault = row.original.name?.toLowerCase() === "default";
          return (
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground">
                {row.original.name}
              </span>
              {isDefault && (
                <Badge
                  variant="outline"
                  className="text-[10px] font-semibold text-primary border-primary/30 bg-primary/10"
                >
                  Protected Default
                </Badge>
              )}
            </div>
          );
        },
        enableSorting: true,
      },
      {
        accessorKey: "description",
        id: "description",
        header: ({ column }) => (
          <DataGridColumnHeader title="Description" column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground line-clamp-1 max-w-[280px]">
            {row.original.description || "--"}
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorFn: (row) => row._count?.inventory_items || row.inventory_items?.length || 0,
        id: "items_count",
        header: ({ column }) => (
          <DataGridColumnHeader title="Assigned Items" column={column} />
        ),
        cell: ({ row }) => {
          const count =
            row.original._count?.inventory_items ??
            row.original.inventory_items?.length ??
            0;
          return (
            <span className="text-xs font-mono font-bold bg-muted px-2 py-0.5 rounded border">
              {count} {count === 1 ? "item" : "items"}
            </span>
          );
        },
        enableSorting: true,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const cat = row.original;
          const isDefault = cat.name?.toLowerCase() === "default";

          if (isDefault) {
            return (
              <div
                className="flex items-center justify-center text-muted-foreground px-2"
                title="System default category cannot be modified or deleted"
              >
                <span className="text-[11px] font-mono text-muted-foreground/60 select-none">
                  System
                </span>
              </div>
            );
          }

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
                <DropdownMenuContent align="end" sideOffset={4} className="w-44" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="h-13.5 px-3!"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportCategory(cat);
                      }}
                      disabled={exportingCatId === cat.id}
                    >
                      {exportingCatId === cat.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Download className="size-4" />
                      )}
                      Export Items (.csv)
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="h-13.5 px-3!"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(cat);
                      }}
                    >
                      <Edit className="size-4" />
                      Edit Category
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      className="h-13.5 px-3!"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTargetCategoryForDelete(cat);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="size-4" />
                      Delete Category
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        size: 60,
      },
    ],
    [onEdit],
  );

  const table = useReactTable({
    data: categories,
    columns,
    state: {
      pagination,
      sorting,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <>
      <DataGrid
        table={table}
        recordCount={categories.length}
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
                No categories found.
              </div>
            ) : (
              table.getRowModel().rows.map((row) => {
                const cat = row.original;
                const isDefault = cat.name?.toLowerCase() === "default";
                const count =
                  cat._count?.inventory_items ??
                  cat.inventory_items?.length ??
                  0;

                return (
                  <div
                    key={cat.id}
                    className="p-4 rounded-xl border bg-card text-card-foreground shadow-xs space-y-3 text-left"
                  >
                    {/* Card Header */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <h4 className="font-bold text-sm text-foreground">
                          {cat.name}
                        </h4>
                        {isDefault && (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-semibold text-primary border-primary/30 bg-primary/10"
                          >
                            Protected Default
                          </Badge>
                        )}
                      </div>

                      {/* Actions */}
                      {isDefault ? (
                        <span className="text-[11px] font-mono text-muted-foreground/60 select-none px-2">
                          System
                        </span>
                      ) : (
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
                            className="w-44"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DropdownMenuGroup>
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="h-13.5 px-3!"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleExportCategory(cat);
                                }}
                                disabled={exportingCatId === cat.id}
                              >
                                {exportingCatId === cat.id ? (
                                  <Loader2 className="size-4 animate-spin" />
                                ) : (
                                  <Download className="size-4" />
                                )}
                                Export Items (.csv)
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="h-13.5 px-3!"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEdit(cat);
                                }}
                              >
                                <Edit className="size-4" />
                                Edit Category
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                className="h-13.5 px-3!"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTargetCategoryForDelete(cat);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="size-4" />
                                Delete Category
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t">
                      <div>
                        <span className="text-[11px] text-muted-foreground block">
                          Assigned Items:
                        </span>
                        <p className="font-mono font-bold text-foreground mt-0.5">
                          {count} {count === 1 ? "item" : "items"}
                        </p>
                      </div>
                      <div>
                        <span className="text-[11px] text-muted-foreground block">
                          Description:
                        </span>
                        <p className="text-foreground mt-0.5 line-clamp-1">
                          {cat.description || "--"}
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete category <strong>&quot;{targetCategoryForDelete?.name}&quot;</strong>?
              {((targetCategoryForDelete?._count?.inventory_items || targetCategoryForDelete?.inventory_items?.length || 0) > 0) ? (
                <span className="block mt-2 text-amber-600 dark:text-amber-400 font-medium leading-relaxed">
                  All {targetCategoryForDelete?._count?.inventory_items || targetCategoryForDelete?.inventory_items?.length} items assigned to this category will automatically be moved to the <strong>Default</strong> category.
                </span>
              ) : (
                <span className="block mt-1 text-muted-foreground">
                  This category has no assigned items and will be permanently removed.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="h-11">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              disabled={isDeleting}
              className="h-11 bg-destructive text-destructive-foreground hover:bg-destructive/90 font-semibold"
            >
              {isDeleting ? "Deleting..." : "Confirm Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
