import { useState, useTransition, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Package,
  Plus,
  Minus,
  History,
  Info,
  User,
  Calendar,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Boxes,
  Clock,
} from "lucide-react";
import {
  adjustSupplyQuantity,
  GetItemDetailsWithLogs,
} from "@/features/inventory/actions/inventory";
import { toast } from "sonner";

interface ItemDetailDrawerProps {
  item: any | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export function ItemDetailDrawer({
  item: initialItem,
  isOpen,
  onClose,
  onRefresh,
}: ItemDetailDrawerProps) {
  const isMobile = useIsMobile();
  const [item, setItem] = useState<any | null>(initialItem);
  const [activeTab, setActiveTab] = useState<"details" | "history">("details");
  const [isFetching, setIsFetching] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Stock Adjustment Form State
  const [actionType, setActionType] = useState<"ADD" | "REDUCE">("ADD");
  const [quantity, setQuantity] = useState<string>("1");
  const [reason, setReason] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);

  // Sync initial item & fetch full details when opened
  useEffect(() => {
    if (isOpen && initialItem?.id) {
      setItem(initialItem);
      setIsFetching(true);
      GetItemDetailsWithLogs(initialItem.id)
        .then((res) => {
          if (res.ok && res.item) {
            setItem(res.item);
          }
        })
        .finally(() => setIsFetching(false));
    }
  }, [isOpen, initialItem]);

  if (!item) return null;

  const categoryType = item.category?.type || "SUPPLIES";
  const isSupply = categoryType === "SUPPLIES";
  const stockLogs = item.stock_logs || [];
  const assets = item.assets || [];

  // Compute Asset Statistics for Equipment / Property
  const totalAssetsCount = assets.length;
  const availableAssetsCount = assets.filter(
    (a: any) => a.status === "AVAILABLE"
  ).length;
  const borrowedAssetsCount = assets.filter(
    (a: any) => a.status === "BORROWED"
  ).length;
  const maintenanceAssetsCount = assets.filter(
    (a: any) => a.status === "MAINTENANCE"
  ).length;

  const handleAdjustStock = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const qtyNum = parseInt(quantity, 10);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      setFormError("Please enter a valid quantity greater than 0.");
      return;
    }

    if (actionType === "REDUCE" && qtyNum > item.quantity) {
      setFormError(
        `Cannot reduce stock by ${qtyNum}. Only ${item.quantity} available.`
      );
      return;
    }

    startTransition(async () => {
      const res = await adjustSupplyQuantity({
        itemId: item.id,
        quantityChange: qtyNum,
        actionType,
        reason: reason.trim() || undefined,
      });

      if (res.ok) {
        toast.success(
          `Stock successfully ${actionType === "ADD" ? "increased" : "reduced"} by ${qtyNum}`
        );
        if (res.item) {
          setItem(res.item);
        }
        GetItemDetailsWithLogs(item.id).then((freshRes) => {
          if (freshRes.ok && freshRes.item) {
            setItem(freshRes.item);
          }
        });
        setQuantity("1");
        setReason("");
        onRefresh();
      } else {
        const errMsg = res.error || "Failed to adjust stock quantity.";
        setFormError(errMsg);
        toast.error(errMsg);
      }
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={cn(
          "w-full p-0 flex flex-col bg-background border-border shadow-2xl transition-all duration-200 overflow-hidden",
          isSupply
            ? isMobile
              ? "data-[side=bottom]:!h-[85vh] data-[side=bottom]:!max-h-[85vh] !h-[85vh] !max-h-[85vh] rounded-t-2xl border-t"
              : "h-full sm:max-w-xl border-l"
            : isMobile
              ? "data-[side=bottom]:!h-auto data-[side=bottom]:!max-h-[90vh] rounded-t-2xl border-t"
              : "h-auto max-h-[90vh] sm:max-w-xl border-l my-auto"
        )}
      >
        {/* Drawer Header */}
        <SheetHeader className="p-6 pb-4 border-b bg-muted/20 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 pr-6">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant={
                    categoryType === "PROPERTY"
                      ? "default"
                      : categoryType === "EQUIPMENT"
                      ? "secondary"
                      : "outline"
                  }
                  className="font-mono text-[10px] tracking-wider uppercase"
                >
                  {item.category?.name || categoryType}
                </Badge>
              </div>
              <SheetTitle className="text-xl font-bold text-foreground tracking-tight">
                {item.name}
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground line-clamp-2">
                {item.description || "No description provided."}
              </SheetDescription>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-2">
            <div className="p-2.5 rounded-lg border bg-card/60 flex flex-col justify-between">
              <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                <Package className="size-3.5 text-primary" /> Total Stock
              </span>
              <span className="text-lg font-bold font-mono tracking-tight text-foreground mt-1">
                {item.quantity} <span className="text-xs font-normal text-muted-foreground">{item.unit || "pcs"}</span>
              </span>
            </div>
            <div className="p-2.5 rounded-lg border bg-card/60 flex flex-col justify-between">
              <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                <User className="size-3.5 text-muted-foreground" /> Recorded By
              </span>
              <span className="text-xs font-medium truncate mt-1 text-foreground">
                {item.created_user
                  ? `${item.created_user.first_name} ${item.created_user.last_name}`
                  : "System"}
              </span>
            </div>
            <div className="p-2.5 rounded-lg border bg-card/60 flex flex-col justify-between">
              <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                <Calendar className="size-3.5 text-muted-foreground" /> Purchased
              </span>
              <span className="text-xs font-mono mt-1 text-foreground">
                {item.date_purchased
                  ? new Date(item.date_purchased).toLocaleDateString()
                  : "N/A"}
              </span>
            </div>
          </div>
        </SheetHeader>

        {/* Navigation Tabs Bar (Supplies Only) */}
        {isSupply && (
          <div className="flex border-b px-6 pt-2 bg-background gap-4 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("details")}
              className={cn(
                "px-3 pb-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer",
                activeTab === "details"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Info className="size-3.5" /> Item Details
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={cn(
                "px-3 pb-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer",
                activeTab === "history"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <History className="size-3.5" /> Stock Audit Logs ({stockLogs.length})
            </button>
          </div>
        )}

        <div className={cn("px-6 py-4 overflow-y-auto touch-pan-y", isSupply ? "flex-1 min-h-0" : "max-h-[calc(90vh-200px)]")}>
          {/* Section 1: Details & Management */}
          {(activeTab === "details" || !isSupply) && (
            <div className="space-y-6">
              {/* Asset breakdown for Equipment / Property */}
              {!isSupply && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Boxes className="size-4 text-primary" /> Tracked Assets Status
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="p-3 rounded-lg border bg-muted/20 text-center">
                      <div className="text-xs text-muted-foreground">Total Assets</div>
                      <div className="text-base font-bold font-mono text-foreground mt-0.5">
                        {totalAssetsCount}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg border bg-emerald-500/10 border-emerald-500/20 text-center">
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        Available
                      </div>
                      <div className="text-base font-bold font-mono text-emerald-700 dark:text-emerald-300 mt-0.5">
                        {availableAssetsCount}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg border bg-amber-500/10 border-amber-500/20 text-center">
                      <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                        Borrowed
                      </div>
                      <div className="text-base font-bold font-mono text-amber-700 dark:text-amber-300 mt-0.5">
                        {borrowedAssetsCount}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg border bg-rose-500/10 border-rose-500/20 text-center">
                      <div className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                        Maintenance
                      </div>
                      <div className="text-base font-bold font-mono text-rose-700 dark:text-rose-300 mt-0.5">
                        {maintenanceAssetsCount}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Supplies Stock Adjustment Workflow Form (Supplies Only) */}
              {isSupply && (
                <div className="p-4 rounded-xl border bg-card shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Package className="size-4 text-primary" />
                      Quantity Adjustment Workflow
                    </h4>
                    <Badge variant="outline" className="text-[10px]">
                      Current Stock: <span className="font-mono ml-1 font-bold">{item.quantity} {item.unit || "pcs"}</span>
                    </Badge>
                  </div>
                  <Separator />

                  <form onSubmit={handleAdjustStock} className="space-y-4">
                    {/* Quantity Input with inline + Add / - Reduce Icon Action Buttons */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        Quantity to {actionType === "ADD" ? "Add" : "Reduce"}
                      </label>
                      <div className="flex gap-2 items-center">
                        <Input
                          type="number"
                          min="1"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          placeholder="Enter quantity amount..."
                          className="font-mono text-sm h-10 flex-1"
                        />
                        <Button
                          type="button"
                          variant={actionType === "ADD" ? "default" : "outline"}
                          size="icon"
                          className="h-10 w-10 shrink-0 cursor-pointer"
                          onClick={() => {
                            setActionType("ADD");
                            setFormError(null);
                          }}
                          title="Add Stock"
                        >
                          <Plus className="size-4" />
                          <span className="sr-only">Add Stock</span>
                        </Button>
                        <Button
                          type="button"
                          variant={actionType === "REDUCE" ? "destructive" : "outline"}
                          size="icon"
                          className="h-10 w-10 shrink-0 cursor-pointer"
                          onClick={() => {
                            setActionType("REDUCE");
                            setFormError(null);
                          }}
                          title="Reduce Stock"
                        >
                          <Minus className="size-4" />
                          <span className="sr-only">Reduce Stock</span>
                        </Button>
                      </div>
                    </div>

                    {/* Reason Textarea */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        Reason / Remarks (Optional)
                      </label>
                      <Textarea
                        rows={2}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder={
                          actionType === "ADD"
                            ? "e.g., New stock delivery from supplier..."
                            : "e.g., Issued to department or damaged..."
                        }
                        className="text-xs resize-none"
                      />
                    </div>

                    {/* Error display */}
                    {formError && (
                      <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                        <AlertCircle className="size-4 shrink-0" />
                        <span>{formError}</span>
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={isPending}
                      className="w-full h-13.5 text-xs font-medium gap-2 cursor-pointer"
                    >
                      {isPending ? (
                        <span className="flex items-center gap-2">
                          <Clock className="size-3.5 animate-spin" /> Updating Stock...
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          {actionType === "ADD" ? (
                            <TrendingUp className="size-4" />
                          ) : (
                            <TrendingDown className="size-4" />
                          )}
                          Confirm {actionType === "ADD" ? "Stock Addition" : "Stock Reduction"}
                        </span>
                      )}
                    </Button>
                  </form>
                </div>
              )}

              {/* General Metadata Card */}
              <div className="p-4 rounded-xl border bg-muted/10 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Item Metadata & Tracking
                </h4>
                <div className="grid grid-cols-2 gap-y-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Created At:</span>
                    <p className="font-mono text-foreground mt-0.5">
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Last Updated:</span>
                    <p className="font-mono text-foreground mt-0.5">
                      {new Date(item.updated_at).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Category Type:</span>
                    <p className="font-mono uppercase text-foreground mt-0.5">
                      {categoryType}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status Flag:</span>
                    <p className="mt-0.5">
                      <Badge
                        variant={item.quantity > 0 ? "outline" : "destructive"}
                        className="text-[10px]"
                      >
                        {item.quantity > 0 ? "In Stock" : "Out of Stock"}
                      </Badge>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Chronological Stock Audit Log Timeline (Supplies Only) */}
          {isSupply && activeTab === "history" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <History className="size-3.5 text-primary" /> Chronological Log Trail
                </h4>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {stockLogs.length} total entries
                </span>
              </div>

              {stockLogs.length === 0 ? (
                <div className="p-8 text-center border rounded-xl bg-muted/10 space-y-2">
                  <Clock className="size-8 text-muted-foreground/50 mx-auto" />
                  <p className="text-xs text-muted-foreground font-medium">
                    No stock transaction logs recorded yet.
                  </p>
                  <p className="text-[11px] text-muted-foreground/70">
                    Stock changes performed will appear here chronologically.
                  </p>
                </div>
              ) : (
                <div className="relative pl-4 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                  {stockLogs.map((log: any) => {
                    const isAdd = log.action_type === "ADD" || log.quantity_change > 0;
                    const isReduce = log.action_type === "REDUCE" || log.quantity_change < 0;

                    return (
                      <div
                        key={log.id}
                        className="relative pl-4 group"
                      >
                        {/* Timeline Node Icon */}
                        <div
                          className={`absolute -left-[17px] top-1 size-6 rounded-full border flex items-center justify-center bg-background shadow-xs ${
                            isAdd
                              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                              : isReduce
                              ? "border-rose-500 text-rose-600 dark:text-rose-400"
                              : "border-blue-500 text-blue-600 dark:text-blue-400"
                          }`}
                        >
                          {isAdd ? (
                            <TrendingUp className="size-3" />
                          ) : isReduce ? (
                            <TrendingDown className="size-3" />
                          ) : (
                            <RotateCcw className="size-3" />
                          )}
                        </div>

                        {/* Log Item Content Card */}
                        <div className="p-3 rounded-lg border bg-card hover:bg-muted/20 transition-colors space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  isAdd
                                    ? "default"
                                    : isReduce
                                    ? "destructive"
                                    : "secondary"
                                }
                                className="text-[10px] uppercase font-mono px-1.5 py-0"
                              >
                                {log.action_type}
                              </Badge>
                              <span
                                className={`font-mono text-xs font-bold ${
                                  isAdd
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : isReduce
                                    ? "text-rose-600 dark:text-rose-400"
                                    : "text-blue-600 dark:text-blue-400"
                                }`}
                              >
                                {log.quantity_change > 0 ? `+${log.quantity_change}` : log.quantity_change}
                              </span>
                            </div>

                            <span className="text-[10px] font-mono text-muted-foreground">
                              {new Date(log.created_at).toLocaleString()}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                            <span>
                              Stock:{" "}
                              <span className="font-mono text-foreground">
                                {log.previous_quantity} &rarr; {log.new_quantity}
                              </span>
                            </span>

                            <span className="flex items-center gap-1 text-[11px]">
                              <User className="size-3" />
                              {log.actor
                                ? `${log.actor.first_name} ${log.actor.last_name}`
                                : "System"}
                            </span>
                          </div>

                          {log.reason && (
                            <p className="text-xs italic bg-muted/40 p-2 rounded-md border text-foreground/90 mt-1">
                              "{log.reason}"
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
