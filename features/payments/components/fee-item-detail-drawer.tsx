"use client";

import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Minus,
  Calendar,
  User,
  Loader2,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { toast } from "sonner";
import { AdjustFeeItemStock } from "../actions/payments";

interface FeeItemDetailDrawerProps {
  item: any | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

export function FeeItemDetailDrawer({
  item,
  isOpen,
  onClose,
  onRefresh,
}: FeeItemDetailDrawerProps) {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<"details" | "stock" | "logs">(
    "details",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedVariantId, setSelectedVariantId] = useState<string>("default");
  const [actionType, setActionType] = useState<"ADD" | "REDUCE">("ADD");
  const [adjustAmount, setAdjustAmount] = useState("1");
  const [reason, setReason] = useState("");

  if (!item) return null;

  const hasVariants = Boolean(
    item.has_variants && item.variants && item.variants.length > 0,
  );
  const stockLogs = item.stock_logs || [];

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(adjustAmount, 10);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Please enter a valid quantity.");
      return;
    }

    if (
      hasVariants &&
      (!selectedVariantId || selectedVariantId === "default")
    ) {
      toast.error("Please select a variant to adjust.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await AdjustFeeItemStock({
        itemId: item.id,
        variantId: hasVariants ? selectedVariantId : undefined,
        quantityChange: qty,
        actionType,
        reason: reason.trim() || undefined,
      });

      if (res.ok) {
        toast.success(
          `Successfully ${actionType === "ADD" ? "added" : "reduced"} stock.`,
        );
        setAdjustAmount("1");
        setReason("");
        onRefresh?.();
      } else {
        toast.error(res.error || "Failed to adjust stock.");
      }
    } catch (err: any) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      showSwipeHandle={isMobile}
      swipeDirection={isMobile ? "down" : "right"}
    >
      <DrawerContent className="h-[85dvh] md:h-full flex flex-col max-w-xl mx-auto">
        <DrawerHeader className="border-b text-left pb-4">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge
              variant="default"
              className="text-[10px] uppercase font-bold"
            >
              {item.type === "cf" ? "College Fee" : "Merchandise"}
            </Badge>
            <span className="font-mono text-sm font-bold text-primary ml-auto">
              ₱{Number(item.price).toFixed(2)}
            </span>
          </div>
          <DrawerTitle className="text-xl font-bold text-foreground tracking-tight">
            {item.name}
          </DrawerTitle>
          <DrawerDescription className="text-xs text-muted-foreground line-clamp-2">
            {item.description || "No description provided."}
          </DrawerDescription>
        </DrawerHeader>

        <ScrollArea className="flex-1 min-h-0 py-4" data-base-ui-swipe-ignore>
          <div className="px-6 space-y-6" data-base-ui-swipe-ignore>
            <div className="flex rounded-lg p-1 bg-data-grid-bg border border-input gap-1">
              <Button
                type="button"
                variant={activeTab === "details" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("details")}
                className="flex-1 text-xs font-semibold h-11 px-4"
              >
                Item Details
              </Button>
              {item.type === "mf" && (
                <Button
                  type="button"
                  variant={activeTab === "stock" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("stock")}
                  className="flex-1 text-xs font-semibold h-11 px-4"
                >
                  Adjust Stock
                </Button>
              )}
              {item.type === "mf" && (
                <Button
                  type="button"
                  variant={activeTab === "logs" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("logs")}
                  className="flex-1 text-xs font-semibold h-11 px-4"
                >
                  Audit Logs
                </Button>
              )}
            </div>

            {activeTab === "details" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl border bg-card">
                    <span className="text-muted-foreground">Price</span>
                    <p className="font-mono text-base font-bold text-primary mt-1">
                      ₱{Number(item.price).toFixed(2)}
                    </p>
                  </div>

                  {item.type === "mf" && (
                    <div className="p-3 rounded-xl border bg-card">
                      <span className="text-muted-foreground">Total Stock</span>
                      <p className="font-mono text-base font-bold text-foreground mt-1">
                        {item.quantity} units
                      </p>
                    </div>
                  )}
                </div>

                {hasVariants && (
                  <div className="border rounded-xl p-4 bg-muted/20 space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                      Variants & Stock Quantities ({item.variants.length})
                    </h4>

                    <div className="space-y-2">
                      {item.variants.map((v: any) => (
                        <div
                          key={v.id}
                          className="p-3 rounded-lg border bg-card flex items-center justify-between text-xs"
                        >
                          <span className="font-semibold text-foreground">
                            {v.name}
                          </span>
                          <Badge
                            variant={v.quantity > 0 ? "outline" : "destructive"}
                            className="font-mono text-xs"
                          >
                            {v.quantity} in stock
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-4 rounded-xl border space-y-2 text-xs">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" /> Created Date:
                    </span>
                    <span className="font-mono text-foreground">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {item.created_user && (
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" /> Created By:
                      </span>
                      <span className="font-medium text-foreground">
                        {item.created_user.first_name}{" "}
                        {item.created_user.last_name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "stock" && item.type === "mf" && (
              <div className="space-y-4">
                <form onSubmit={handleAdjustSubmit} className="space-y-4">
                  {hasVariants && (
                    <div className="space-y-2">
                      <Label htmlFor="variantSelect">Select Variant *</Label>
                      <Select
                        value={selectedVariantId}
                        onValueChange={(val) =>
                          setSelectedVariantId(val || "default")
                        }
                      >
                        <SelectTrigger
                          id="variantSelect"
                          className="h-13.5 px-4"
                        >
                          <SelectValue placeholder="-- Select Variant --">
                            {(val) => {
                              const v = item.variants?.find(
                                (v: any) => v.id === val,
                              );
                              return v
                                ? `${v.name} (Current Stock: ${v.quantity})`
                                : undefined;
                            }}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {item.variants.map((v: any) => (
                            <SelectItem
                              key={v.id}
                              value={v.id}
                              className="py-2"
                            >
                              {v.name} (Current Stock: {v.quantity})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Adjustment Action</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={actionType === "ADD" ? "default" : "outline"}
                        onClick={() => setActionType("ADD")}
                        className="h-13.5 px-4 gap-2 font-semibold"
                      >
                        <Plus className="h-4 w-4" />
                        Add Stock
                      </Button>
                      <Button
                        type="button"
                        variant={
                          actionType === "REDUCE" ? "destructive" : "outline"
                        }
                        onClick={() => setActionType("REDUCE")}
                        className="h-13.5 px-4 gap-2 font-semibold"
                      >
                        <Minus className="h-4 w-4" />
                        Reduce Stock
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adjustAmount">Quantity Amount *</Label>
                    <Input
                      id="adjustAmount"
                      type="number"
                      min="1"
                      value={adjustAmount}
                      onChange={(e) => setAdjustAmount(e.target.value)}
                      className="h-13.5 px-4 font-mono text-base"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason / Remarks (Optional)</Label>
                    <Textarea
                      id="reason"
                      placeholder="e.g. Received new stock delivery / Damaged items write-off"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={2}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-13.5 px-4 font-semibold text-sm"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating Stock...
                      </>
                    ) : (
                      `Confirm Stock ${actionType === "ADD" ? "Addition" : "Reduction"}`
                    )}
                  </Button>
                </form>
              </div>
            )}

            {activeTab === "logs" && item.type === "mf" && (
              <div className="space-y-3">
                {stockLogs.length === 0 ? (
                  <div className="p-8 text-center border rounded-xl bg-card text-muted-foreground text-xs">
                    No stock audit logs recorded for this item yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {stockLogs.map((log: any) => {
                      const isAdd =
                        log.action_type === "ADD" || log.quantity_change > 0;
                      return (
                        <div
                          key={log.id}
                          className="p-3 rounded-xl border bg-card space-y-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              {isAdd ? (
                                <TrendingUp className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-rose-500" />
                              )}
                              <span className="font-bold text-foreground">
                                {isAdd ? "+" : ""}
                                {log.quantity_change} units
                              </span>
                              {log.variant && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] font-mono"
                                >
                                  {log.variant.name}
                                </Badge>
                              )}
                            </div>
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {new Date(log.created_at).toLocaleString([], {
                                dateStyle: "short",
                                timeStyle: "short",
                              })}
                            </span>
                          </div>

                          <p className="text-[11px] text-muted-foreground">
                            {log.reason || "No reason specified."}
                          </p>

                          <div className="flex items-center justify-between pt-1 border-t text-[10px] text-muted-foreground">
                            <span>
                              By: {log.actor?.first_name} {log.actor?.last_name}
                            </span>
                            <span className="font-mono">
                              Prev: {log.previous_quantity} → New:{" "}
                              {log.new_quantity}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}
