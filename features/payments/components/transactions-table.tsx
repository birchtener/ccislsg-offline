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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  MoreHorizontal,
  Ban,
  Loader2,
} from "lucide-react";
import { VoidTransaction } from "../actions/payments";
import { toast } from "sonner";

interface TransactionsTableProps {
  transactions: any[];
  filteredTransactions: any[];
  onRefresh: () => void;
  canVoid?: boolean;
}

export function TransactionsTable({
  transactions,
  filteredTransactions,
  onRefresh,
  canVoid = true,
}: TransactionsTableProps) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);

  const [voidingTx, setVoidingTx] = useState<any | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [isSubmittingVoid, setIsSubmittingVoid] = useState(false);

  const handleConfirmVoid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voidingTx) return;

    setIsSubmittingVoid(true);
    try {
      const res = await VoidTransaction({
        transactionId: voidingTx.id,
        reason: voidReason.trim() || undefined,
      });

      if (res.ok) {
        toast.success(`Transaction AF# ${voidingTx.af_number} voided.`);
        setVoidingTx(null);
        setVoidReason("");
        onRefresh();
      } else {
        toast.error(res.error || "Failed to void transaction.");
      }
    } catch (err) {
      toast.error("An error occurred while voiding transaction.");
    } finally {
      setIsSubmittingVoid(false);
    }
  };

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "af_number",
        id: "af_number",
        header: ({ column }) => (
          <DataGridColumnHeader title="AF Number" column={column} />
        ),
        cell: ({ row }) => {
          const tx = row.original;
          const isVoided = tx.status === "VOIDED";
          return (
            <div className="flex items-center gap-2">
              <Badge
                variant={isVoided ? "destructive" : "outline"}
                className="font-mono font-bold text-xs uppercase"
              >
                AF# {tx.af_number}
              </Badge>
              {isVoided && (
                <Badge variant="destructive" className="text-[10px]">
                  VOIDED
                </Badge>
              )}
            </div>
          );
        },
        enableSorting: true,
        size: 140,
      },
      {
        accessorKey: "student",
        id: "student",
        header: ({ column }) => (
          <DataGridColumnHeader title="Student" column={column} />
        ),
        cell: ({ row }) => {
          const s = row.original.student;
          if (!s) return <span className="text-xs text-muted-foreground">N/A</span>;
          return (
            <div className="flex flex-col">
              <span className="font-bold text-sm text-foreground">
                {s.first_name} {s.last_name}
              </span>
              <span className="text-[11px] font-mono text-muted-foreground">
                ID: {s.student_id} ({s.program} Yr {s.year})
              </span>
            </div>
          );
        },
        enableSorting: true,
        size: 200,
      },
      {
        accessorKey: "items",
        id: "items",
        header: ({ column }) => (
          <DataGridColumnHeader title="Purchased Items" column={column} />
        ),
        cell: ({ row }) => {
          const items = row.original.items || [];
          return (
            <div className="flex flex-col gap-1 max-w-xs">
              {items.map((it: any) => (
                <div key={it.id} className="text-xs flex items-center gap-1.5 truncate">
                  <span className="font-medium text-foreground truncate">
                    {it.item?.name}
                  </span>
                  {it.variant && (
                    <Badge variant="secondary" className="text-[9px] px-1 py-0">
                      {it.variant.name}
                    </Badge>
                  )}
                  <span className="text-muted-foreground font-mono text-[11px]">
                    ×{it.quantity}
                  </span>
                </div>
              ))}
            </div>
          );
        },
        enableSorting: false,
        size: 240,
      },
      {
        accessorKey: "total_amount",
        id: "total_amount",
        header: ({ column }) => (
          <DataGridColumnHeader title="Total Amount" column={column} />
        ),
        cell: ({ row }) => {
          const tx = row.original;
          return (
            <span
              className={`font-mono font-bold text-sm ${
                tx.status === "VOIDED" ? "line-through text-muted-foreground" : "text-primary"
              }`}
            >
              ₱{Number(tx.total_amount).toFixed(2)}
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
          <DataGridColumnHeader title="Date & Time" column={column} />
        ),
        cell: ({ row }) => (
          <div className="flex flex-col text-xs font-mono text-muted-foreground">
            <span>{new Date(row.original.created_at).toLocaleDateString()}</span>
            <span className="text-[10px]">
              {new Date(row.original.created_at).toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          </div>
        ),
        enableSorting: true,
        size: 140,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const tx = row.original;
          const isVoided = tx.status === "VOIDED";
          return (
            <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
              {canVoid && !isVoided && (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel className="py-2 px-2 text-xs font-semibold text-muted-foreground">Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setVoidingTx(tx)}
                        className="py-2.5 px-2 cursor-pointer gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
                      >
                        <Ban className="h-4 w-4" />
                        Void Transaction
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          );
        },
        enableSorting: false,
        size: 60,
      },
    ],
    [canVoid]
  );

  const table = useReactTable({
    columns,
    data: filteredTransactions,
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
    <>
      <DataGrid
        table={table}
        recordCount={filteredTransactions.length}
        tableLayout={{
          columnsPinnable: false,
          columnsResizable: false,
          columnsMovable: false,
          columnsVisibility: false,
        }}
        tableClassNames={{
          bodyRow: "h-13.5 hover:bg-muted/50 transition-colors",
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
                No payment transactions found.
              </div>
            ) : (
              table.getRowModel().rows.map((row) => {
                const tx = row.original;
                const s = tx.student;
                const isVoided = tx.status === "VOIDED";
                return (
                  <div
                    key={tx.id}
                    className="p-4 rounded-xl border bg-card text-card-foreground shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant={isVoided ? "destructive" : "outline"}
                            className="text-[10px] font-mono font-bold uppercase"
                          >
                            AF# {tx.af_number}
                          </Badge>
                          {isVoided && (
                            <Badge variant="destructive" className="text-[10px]">
                              VOIDED
                            </Badge>
                          )}
                        </div>
                        {s && (
                          <h4 className="font-bold text-sm text-foreground mt-1">
                            {s.first_name} {s.last_name}
                          </h4>
                        )}
                        {s && (
                          <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                            ID: {s.student_id} ({s.program} Yr {s.year})
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`font-mono font-bold text-base ${
                            isVoided ? "line-through text-muted-foreground" : "text-primary"
                          }`}
                        >
                          ₱{Number(tx.total_amount).toFixed(2)}
                        </span>
                        {canVoid && !isVoided && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setVoidingTx(tx)}
                            className="h-7 text-[11px] text-destructive hover:bg-destructive/10 px-2"
                          >
                            Void
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t space-y-1.5">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Purchased Items
                      </span>
                      <div className="space-y-1">
                        {tx.items?.map((it: any) => (
                          <div
                            key={it.id}
                            className="text-xs flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="font-medium text-foreground truncate">
                                {it.item?.name}
                              </span>
                              {it.variant && (
                                <Badge variant="secondary" className="text-[9px] px-1">
                                  {it.variant.name}
                                </Badge>
                              )}
                              <span className="text-muted-foreground font-mono text-[11px]">
                                ×{it.quantity}
                              </span>
                            </div>
                            <span className="font-mono text-xs font-semibold">
                              ₱{Number(it.subtotal).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground pt-2 border-t">
                      <span>
                        Recorded: {new Date(tx.created_at).toLocaleDateString()} {new Date(tx.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      </span>
                      {tx.staff && (
                        <span>Staff: {tx.staff.first_name || tx.staff.name}</span>
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

      <Dialog open={Boolean(voidingTx)} onOpenChange={(open) => !open && setVoidingTx(null)}>
        <DialogContent className="sm:max-w-md p-6">
          <DialogHeader className="text-left border-b pb-3">
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Ban className="h-5 w-5" />
              Void Transaction AF# {voidingTx?.af_number}
            </DialogTitle>
            <DialogDescription>
              Voiding this transaction will restore sold merchandise quantities back to inventory stock.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmVoid} className="space-y-4 my-2">
            <div className="space-y-2">
              <Label htmlFor="voidReason">Reason for Voiding *</Label>
              <Input
                id="voidReason"
                placeholder="e.g. Incorrect student ID / Payment refund requested"
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                className="h-13.5 px-4"
                required
              />
            </div>

            <div className="flex items-center justify-end pt-2 gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setVoidingTx(null)}
                disabled={isSubmittingVoid}
                className="h-13.5 px-4 w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={isSubmittingVoid || !voidReason.trim()}
                className="h-13.5 px-6 w-full sm:w-auto font-semibold"
              >
                {isSubmittingVoid ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Voiding...
                  </>
                ) : (
                  "Confirm Void Transaction"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
