"use client";

import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Loader2, Package, Tag } from "lucide-react";
import { toast } from "sonner";
import { CreateFeeItem } from "../actions/payments";

interface AddFeeItemDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddFeeItemDrawer({
  open,
  onOpenChange,
  onSuccess,
}: AddFeeItemDrawerProps) {
  const isMobile = useIsMobile();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [type, setType] = useState<"cf" | "mf">("mf");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");

  const [hasVariants, setHasVariants] = useState(false);
  const [initialQuantity, setInitialQuantity] = useState("0");
  const [variants, setVariants] = useState<
    Array<{ name: string; quantity: string }>
  >([
    { name: "Small", quantity: "0" },
    { name: "Medium", quantity: "0" },
    { name: "Large", quantity: "0" },
  ]);

  const handleAddVariant = () => {
    setVariants((prev) => [...prev, { name: "", quantity: "0" }]);
  };

  const handleRemoveVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVariantChange = (
    index: number,
    field: "name" | "quantity",
    value: string,
  ) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)),
    );
  };

  const resetForm = () => {
    setName("");
    setPrice("");
    setDescription("");
    setType("mf");
    setHasVariants(false);
    setInitialQuantity("0");
    setVariants([
      { name: "Small", quantity: "0" },
      { name: "Medium", quantity: "0" },
      { name: "Large", quantity: "0" },
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter item name.");
      return;
    }

    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      toast.error("Please enter a valid price.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        name: name.trim(),
        price: numPrice,
        type,
        description: description.trim() || undefined,
      };

      if (type === "mf") {
        payload.has_variants = hasVariants;
        if (hasVariants) {
          const cleanedVars = variants
            .filter((v) => v.name.trim().length > 0)
            .map((v) => ({
              name: v.name.trim(),
              quantity: parseInt(v.quantity, 10) || 0,
            }));

          if (cleanedVars.length === 0) {
            toast.error("Please add at least one valid variant name.");
            setIsSubmitting(false);
            return;
          }
          payload.variants = cleanedVars;
        } else {
          payload.initialQuantity = parseInt(initialQuantity, 10) || 0;
        }
      }

      const res = await CreateFeeItem(payload);
      if (res.ok) {
        toast.success(`Fee item "${name}" created successfully.`);
        resetForm();
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error((res as any).error || "Failed to create fee item.");
      }
    } catch (err: any) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      showSwipeHandle={isMobile}
      swipeDirection={isMobile ? "down" : "right"}
    >
      <DrawerContent className="h-[85dvh] md:h-full flex flex-col max-w-xl mx-auto">
        <DrawerHeader className="border-b pb-4">
          <DrawerTitle className="text-lg font-bold flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Add New Item
          </DrawerTitle>
          <DrawerDescription className="text-xs pb-1">
            Create an organization college fee or merchandise item with price
            and stock details.
          </DrawerDescription>
        </DrawerHeader>

        <ScrollArea className="flex-1 min-h-0 py-4" data-base-ui-swipe-ignore>
          <form
            id="add-fee-item-form"
            onSubmit={handleSubmit}
            className="px-6 space-y-4 text-left"
            data-base-ui-swipe-ignore
          >
            <div className="space-y-1.5">
              <Label htmlFor="type">Item Type</Label>
              <Select
                value={type}
                onValueChange={(val) => val && setType(val as "cf" | "mf")}
              >
                <SelectTrigger id="type" className="h-13.5 px-4">
                  <SelectValue placeholder="Select type">
                    {(val) =>
                      val === "cf" ? "College Fee (cf)" : "Merchandise Fee (mf)"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cf" className="py-2.5">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-blue-500" />
                      <div>
                        <span className="font-semibold block">
                          College Fee (cf)
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Org fee, college council dues (no stock tracking)
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="mf" className="py-2.5">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-emerald-500" />
                      <div>
                        <span className="font-semibold block">
                          Merchandise Fee (mf)
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Shirts, lanyards, pins (with stock & variants)
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name">Item Name *</Label>
              <Input
                id="name"
                placeholder={
                  type === "cf"
                    ? "e.g. 1st Sem College Org Fee"
                    : "e.g. CCIS LSG Org Shirt 2026"
                }
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-13.5 px-4"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="price">Price (₱) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="h-13.5 px-4 font-mono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Provide item details or specifications..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            {type === "mf" && (
              <div className="border rounded-xl p-4 bg-muted/20 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-bold text-sm">
                      Multiple Variants
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Enable for items with sizes (S, M, L) or colors.
                    </p>
                  </div>
                  <Switch
                    checked={hasVariants}
                    onCheckedChange={setHasVariants}
                  />
                </div>

                {!hasVariants ? (
                  <div className="space-y-2 pt-2 border-t">
                    <Label htmlFor="initialQuantity">
                      Initial Stock Quantity
                    </Label>
                    <Input
                      id="initialQuantity"
                      type="number"
                      min="0"
                      value={initialQuantity}
                      onChange={(e) => setInitialQuantity(e.target.value)}
                      className="h-13.5 px-4 font-mono"
                    />
                  </div>
                ) : (
                  <div className="space-y-3 pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Variants List
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddVariant}
                        className="h-10 px-4 text-xs gap-1"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Variant
                      </Button>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {variants.map((v, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            placeholder="e.g. Small / Red"
                            value={v.name}
                            onChange={(e) =>
                              handleVariantChange(index, "name", e.target.value)
                            }
                            className="h-13.5 px-4 text-sm flex-1"
                          />
                          <Input
                            type="number"
                            min="0"
                            placeholder="Stock"
                            value={v.quantity}
                            onChange={(e) =>
                              handleVariantChange(
                                index,
                                "quantity",
                                e.target.value,
                              )
                            }
                            className="h-13.5 px-4 w-28 text-sm font-mono"
                          />
                          {variants.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveVariant(index)}
                              className="h-13.5 w-13.5 text-destructive hover:bg-destructive/10 shrink-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </form>
        </ScrollArea>

        <DrawerFooter className="border-t p-4 flex flex-col sm:flex-row gap-2 sm:gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="h-13.5 px-4 w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="add-fee-item-form"
            disabled={isSubmitting}
            className="h-13.5 px-6 w-full sm:w-auto font-semibold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Fee Item"
            )}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
