"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
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
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
  UpdateAssetConditionOrStatus,
  DeleteInventoryAsset,
} from "@/features/inventory/actions/inventory";
import {
  MoreHorizontal,
  Printer,
  Trash2,
  Wrench,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  CircleDot,
  PackageX,
} from "lucide-react";
import { toast } from "sonner";

const CONDITIONS = [
  "Brand New",
  "Used - Good",
  "Used - Fair",
  "Broken",
  "To be assessed",
] as const;

const STATUSES = [
  { value: "AVAILABLE", label: "Available", icon: ShieldCheck },
  { value: "MAINTENANCE", label: "Maintenance", icon: Wrench },
  { value: "LOST", label: "Lost", icon: ShieldAlert },
  { value: "DISPOSED", label: "Disposed", icon: ShieldX },
] as const;

interface AssetsTableProps {
  assets: any[];
  filteredAssets: any[];
  selectedAssetIds: Set<string>;
  toggleAssetSelection: (id: string, checked: boolean) => void;
  toggleAllAssets: (checked: boolean) => void;
  handlePrintSingle: (asset: any) => void;
  onRefresh: () => void;
}

export function AssetsTable({
  assets,
  filteredAssets,
  selectedAssetIds,
  toggleAssetSelection,
  toggleAllAssets,
  handlePrintSingle,
  onRefresh,
}: AssetsTableProps) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);

  const handleUpdateCondition = async (asset: any, condition: string) => {
    const result = await UpdateAssetConditionOrStatus({
      assetId: asset.id,
      condition,
      status: asset.status,
    });
    if (result.ok) {
      toast.success(`Updated condition to "${condition}"`);
      onRefresh();
    } else {
      toast.error(result.error || "Failed to update condition.");
    }
  };

  const handleUpdateStatus = async (asset: any, status: string) => {
    const result = await UpdateAssetConditionOrStatus({
      assetId: asset.id,
      condition: asset.condition,
      status: status as any,
    });
    if (result.ok) {
      toast.success(`Updated status to "${status}"`);
      onRefresh();
    } else {
      toast.error(result.error || "Failed to update status.");
    }
  };

  const handleDeleteAsset = async (asset: any) => {
    const result = await DeleteInventoryAsset(asset.id);
    if (result.ok) {
      toast.success(`Deleted asset "${asset.asset_tag}"`);
      onRefresh();
    } else {
      toast.error(result.error || "Failed to delete asset.");
    }
  };

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        id: "select",
        header: () => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={
                filteredAssets.length > 0 &&
                filteredAssets.every((a) => selectedAssetIds.has(a.id))
              }
              onCheckedChange={(checked) => toggleAllAssets(!!checked)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ),
        cell: ({ row }) => {
          const asset = row.original;
          return (
            <div className="flex items-center justify-center">
              <Checkbox
                checked={selectedAssetIds.has(asset.id)}
                onCheckedChange={(checked) =>
                  toggleAssetSelection(asset.id, !!checked)
                }
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          );
        },
        size: 50,
      },
      {
        accessorKey: "asset_tag",
        id: "asset_tag",
        header: ({ column }) => (
          <DataGridColumnHeader title="Asset Tag" column={column} />
        ),
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className="text-[10px] uppercase tracking-tighter font-mono font-bold"
          >
            {row.original.asset_tag}
          </Badge>
        ),
        enableSorting: true,
      },
      {
        accessorFn: (row) => row.item.name,
        id: "itemName",
        header: ({ column }) => (
          <DataGridColumnHeader title="Item Name" column={column} />
        ),
        cell: ({ row }) => (
          <span className="font-bold">{row.original.item.name}</span>
        ),
        enableSorting: true,
      },
      {
        accessorFn: (row) => row.item.category.name,
        id: "category",
        header: ({ column }) => (
          <DataGridColumnHeader title="Category" column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.item.category.name}
          </span>
        ),
        enableSorting: true,
      },
      {
        accessorKey: "status",
        id: "status",
        header: ({ column }) => (
          <DataGridColumnHeader title="Status" column={column} />
        ),
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <Badge
              variant={
                status === "AVAILABLE"
                  ? "secondary"
                  : status === "BORROWED"
                    ? "default"
                    : "outline"
              }
              className={
                status === "AVAILABLE"
                  ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                  : status === "BORROWED"
                    ? "bg-blue-500/10 text-blue-700 border-blue-500/20"
                    : "bg-red-500/10 text-red-700 border-red-500/20"
              }
            >
              {status}
            </Badge>
          );
        },
        enableSorting: true,
      },
      {
        accessorKey: "condition",
        id: "condition",
        header: ({ column }) => (
          <DataGridColumnHeader title="Condition" column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-xs">{row.original.condition}</span>
        ),
        enableSorting: true,
      },
      {
        accessorFn: (row) => row.item.date_purchased,
        id: "date_purchased",
        header: ({ column }) => (
          <DataGridColumnHeader title="Purchased at" column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground font-mono">
            {row.original.item.date_purchased
              ? new Date(row.original.item.date_purchased).toLocaleDateString()
              : "--/--/----"}
          </span>
        ),
        enableSorting: true,
      },
      {
        accessorFn: (row) => {
          const user = row.item.created_user;
          return user ? `${user.first_name} ${user.last_name}` : "System";
        },
        id: "recorded_by",
        header: ({ column }) => (
          <DataGridColumnHeader title="Recorded By" column={column} />
        ),
        cell: ({ row }) => {
          const user = row.original.item.created_user;
          return (
            <span>
              {user ? `${user.first_name} ${user.last_name}` : "System"}
            </span>
          );
        },
        enableSorting: true,
      },
      {
        accessorKey: "created_at",
        id: "created_at",
        header: ({ column }) => (
          <DataGridColumnHeader title="Recorded at" column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground font-mono">
            {new Date(row.original.created_at).toLocaleDateString()}
          </span>
        ),
        enableSorting: true,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const asset = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted cursor-pointer"
                render={<Button variant="ghost" size="icon" />}
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={4} className="w-48">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handlePrintSingle(asset)}
                    className="h-13.5 px-3!"
                  >
                    <Printer className="size-4" />
                    Print Label
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="h-13.5 px-3!">
                    <CircleDot className="size-4" />
                    Update Condition
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {CONDITIONS.map((c) => (
                      <DropdownMenuItem
                        className="h-13.5 px-3!"
                        key={c}
                        onClick={() => handleUpdateCondition(asset, c)}
                        disabled={asset.condition === c}
                      >
                        {c}
                        {asset.condition === c && (
                          <span className="ml-auto text-[10px] text-muted-foreground">
                            Current
                          </span>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="h-13.5 px-3!">
                    <PackageX className="size-4" />
                    Update Status
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {STATUSES.map((s) => (
                      <DropdownMenuItem
                        className="h-13.5 px-3!"
                        key={s.value}
                        onClick={() => handleUpdateStatus(asset, s.value)}
                        disabled={
                          asset.status === s.value ||
                          asset.status === "BORROWED"
                        }
                      >
                        <s.icon className="size-4" />
                        {s.label}
                        {asset.status === s.value && (
                          <span className="ml-auto text-[10px] text-muted-foreground">
                            Current
                          </span>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  className="h-13.5 px-3!"
                  onClick={() => handleDeleteAsset(asset)}
                  disabled={asset.status === "BORROWED"}
                >
                  <Trash2 className="size-4" />
                  Delete Asset
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
        size: 60,
      },
    ],
    [selectedAssetIds, filteredAssets, handlePrintSingle],
  );

  const table = useReactTable({
    columns: columns as any,
    data: filteredAssets,
    pageCount: Math.ceil((filteredAssets.length || 0) / pagination.pageSize),
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
      recordCount={filteredAssets.length}
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
              No assets found.
            </div>
          ) : (
            table.getRowModel().rows.map((row) => {
              const asset = row.original;
              const status = asset.status;
              return (
                <div
                  key={asset.id}
                  className="p-4 rounded-xl border bg-card text-card-foreground shadow-xs space-y-3"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedAssetIds.has(asset.id)}
                        onCheckedChange={(checked) =>
                          toggleAssetSelection(asset.id, !!checked)
                        }
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className="text-[10px] uppercase tracking-tighter font-mono font-bold"
                          >
                            {asset.asset_tag}
                          </Badge>
                          <Badge
                            variant={
                              status === "AVAILABLE"
                                ? "secondary"
                                : status === "BORROWED"
                                  ? "default"
                                  : "outline"
                            }
                            className={
                              status === "AVAILABLE"
                                ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                                : status === "BORROWED"
                                  ? "bg-blue-500/10 text-blue-700 border-blue-500/20"
                                  : "bg-red-500/10 text-red-700 border-red-500/20"
                            }
                          >
                            {status}
                          </Badge>
                        </div>
                        <h4 className="font-bold text-sm text-foreground mt-1">
                          {asset.item.name}
                        </h4>
                      </div>
                    </div>

                    {/* Actions Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="h-9 w-9 flex items-center justify-center rounded-md hover:bg-muted cursor-pointer"
                        render={<Button variant="ghost" size="icon" />}
                      >
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" sideOffset={4} className="w-48">
                        <DropdownMenuGroup>
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="h-12 px-3"
                            onClick={() => handlePrintSingle(asset)}
                          >
                            <Printer className="size-4 mr-2" />
                            Print Asset Tag
                          </DropdownMenuItem>

                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="h-12 px-3">
                              <CircleDot className="size-4 mr-2" />
                              Change Condition
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className="w-44">
                              {CONDITIONS.map((cond) => (
                                <DropdownMenuItem
                                  key={cond}
                                  onClick={() => handleUpdateCondition(asset, cond)}
                                  className="h-10 text-xs"
                                >
                                  {cond}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>

                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="h-12 px-3">
                              <ShieldCheck className="size-4 mr-2" />
                              Change Status
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className="w-44">
                              {STATUSES.map((st) => (
                                <DropdownMenuItem
                                  key={st.value}
                                  onClick={() => handleUpdateStatus(asset, st.value)}
                                  className="h-10 text-xs flex items-center gap-2"
                                >
                                  <st.icon className="size-3.5" />
                                  {st.label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>

                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            className="h-12 px-3"
                            onClick={() => handleDeleteAsset(asset)}
                          >
                            <Trash2 className="size-4 mr-2" />
                            Delete Asset
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Card Body */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t">
                    <div>
                      <span className="text-muted-foreground">Category:</span>
                      <p className="font-medium text-foreground mt-0.5">
                        {asset.item.category.name}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Condition:</span>
                      <p className="font-medium text-foreground mt-0.5">
                        {asset.condition}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Purchased Date:</span>
                      <p className="font-mono text-foreground mt-0.5">
                        {asset.item.date_purchased
                          ? new Date(asset.item.date_purchased).toLocaleDateString()
                          : "N/A"}
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
