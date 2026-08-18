"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  CreateInventoryItem,
  UpdateInventoryItem,
  GetNextItemCode,
} from "../actions/inventory";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Edit, CalendarIcon, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CategoryType } from "@/lib/generated/prisma/client";

import {
  ASSET_CONDITIONS,
  DEFAULT_ASSET_CONDITION,
} from "@/features/inventory/constants/conditions";

interface Category {
  id: string;
  name: string;
  description?: string | null;
}

interface AddEditItemDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  itemToEdit?: any | null;
  onSuccess?: () => void;
}

const formSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  type: z.enum(["PROPERTY", "EQUIPMENT", "SUPPLIES"] as const),
  description: z.string().optional(),
  category_id: z.string().min(1, "Category is required"),
  code_suffix: z.string().optional(),
  serial_number: z.string().optional(),
  source_of_fund: z.string().optional(),
  unit: z.string().optional(),
  condition: z.string().optional(),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  date_purchased: z.date().nullable().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function AddEditItemDrawer({
  open,
  onOpenChange,
  categories,
  itemToEdit = null,
  onSuccess,
}: AddEditItemDrawerProps) {
  const isMobile = useIsMobile();
  const isEdit = Boolean(itemToEdit);
  const [loading, setLoading] = useState(false);
  const [fetchingCode, setFetchingCode] = useState(false);
  const [currentPrefix, setCurrentPrefix] = useState("CCISLSG-E-");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "EQUIPMENT",
      description: "",
      category_id: "",
      code_suffix: "",
      serial_number: "",
      source_of_fund: "",
      unit: "pcs",
      condition: DEFAULT_ASSET_CONDITION,
      quantity: 1,
      date_purchased: null,
    },
  });

  const selectedType = watch("type");
  const selectedCategoryId = watch("category_id");
  const selectedCondition = watch("condition") || DEFAULT_ASSET_CONDITION;
  const datePurchased = watch("date_purchased");

  const isTracked = selectedType === "PROPERTY" || selectedType === "EQUIPMENT";

  // Calculate prefix when Item Type changes
  useEffect(() => {
    let p = "E";
    if (selectedType === "PROPERTY") p = "P";
    else if (selectedType === "EQUIPMENT") p = "E";
    else if (selectedType === "SUPPLIES") p = "S";
    setCurrentPrefix(`CCISLSG-${p}-`);
  }, [selectedType]);

  // When drawer opens, populate form or calculate next sequence
  useEffect(() => {
    if (!open) return;

    if (itemToEdit) {
      let suffix = "";
      if (itemToEdit.item_code) {
        const parts = itemToEdit.item_code.split("-");
        suffix =
          parts.length > 2 ? parts.slice(2).join("-") : parts[parts.length - 1];
      }
      reset({
        name: itemToEdit.name || "",
        type: (itemToEdit.type || "SUPPLIES") as any,
        description: itemToEdit.description || "",
        category_id: itemToEdit.category_id || "",
        code_suffix: suffix,
        serial_number: itemToEdit.serial_number || "",
        source_of_fund: itemToEdit.source_of_fund || "",
        unit: itemToEdit.unit || "pcs",
        quantity: itemToEdit.quantity || 1,
        date_purchased: itemToEdit.date_purchased
          ? new Date(itemToEdit.date_purchased)
          : null,
      });
    } else {
      reset({
        name: "",
        type: "EQUIPMENT",
        description: "",
        category_id: categories.length > 0 ? categories[0].id : "",
        code_suffix: "",
        serial_number: "",
        source_of_fund: "",
        unit: "pcs",
        condition: DEFAULT_ASSET_CONDITION,
        quantity: 1,
        date_purchased: null,
      });

      // Auto fetch next code for default type (EQUIPMENT)
      setFetchingCode(true);
      GetNextItemCode("EQUIPMENT")
        .then((res) => {
          if (res.ok && res.nextSeq) {
            setValue("code_suffix", res.nextSeq);
          }
        })
        .finally(() => setFetchingCode(false));
    }
  }, [open, itemToEdit, categories, reset, setValue]);

  // When user switches Item Type in create mode, auto suggest next code sequence
  const handleTypeChange = async (
    type: "PROPERTY" | "EQUIPMENT" | "SUPPLIES",
  ) => {
    setValue("type", type);
    if (!isEdit && (type === "PROPERTY" || type === "EQUIPMENT")) {
      setFetchingCode(true);
      try {
        const res = await GetNextItemCode(type);
        if (res.ok && res.nextSeq) {
          setValue("code_suffix", res.nextSeq);
        }
      } finally {
        setFetchingCode(false);
      }
    }
  };

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const fullItemCode =
        isTracked && values.code_suffix?.trim()
          ? `${currentPrefix}${values.code_suffix.trim()}`
          : undefined;

      const serialNumber = isTracked
        ? values.serial_number?.trim() || undefined
        : undefined;
      const unit = values.unit?.trim() || "pcs";

      if (isEdit && itemToEdit) {
        const res = await UpdateInventoryItem({
          id: itemToEdit.id,
          name: values.name,
          type: values.type as CategoryType,
          description: values.description,
          category_id: values.category_id,
          unit,
          item_code: fullItemCode,
          serial_number: serialNumber,
          source_of_fund: values.source_of_fund,
          date_purchased: values.date_purchased,
        });

        if (!res.ok) {
          toast.error(res.error || "Failed to update item.");
          return;
        }

        toast.success(`Inventory item "${values.name}" updated successfully.`);
      } else {
        const res = await CreateInventoryItem({
          name: values.name,
          type: values.type as CategoryType,
          description: values.description,
          category_id: values.category_id,
          quantity: values.quantity,
          unit,
          item_code: fullItemCode,
          serial_number: serialNumber,
          source_of_fund: values.source_of_fund,
          condition: isTracked ? values.condition : undefined,
          date_purchased: values.date_purchased,
        });

        if (!res.ok) {
          toast.error(res.error || "Failed to create item.");
          return;
        }

        toast.success("Inventory item created successfully.");
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      showSwipeHandle={isMobile}
      swipeDirection={isMobile ? "down" : "right"}
    >
      <DrawerContent className="h-[85dvh] md:h-full flex flex-col max-w-lg mx-auto">
        <DrawerHeader className="border-b">
          <DrawerTitle className="text-lg font-bold flex items-center gap-2">
            {isEdit ? (
              <>
                <Edit className="size-5 text-primary" />
                Edit Inventory Item
              </>
            ) : (
              <>
                <Plus className="size-5 text-primary" />
                Add Inventory Item
              </>
            )}
          </DrawerTitle>
          <DrawerDescription className="text-xs pb-2">
            {isEdit
              ? "Update details, classification, category, codes, or metadata for this item."
              : "Fill details for a new inventory item. Property and equipment will auto-generate tracked assets."}
          </DrawerDescription>
        </DrawerHeader>

        <ScrollArea className="flex-1 min-h-0 py-4" data-base-ui-swipe-ignore>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="px-6 space-y-4 text-left"
            data-base-ui-swipe-ignore
          >
            {/* Item Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name">
                Item Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g. Cisco Gigabit Switch, Office Chair, HDMI Cable"
                className="h-13.5 px-4 text-sm"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs font-semibold text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Item Type (Property / Equipment / Supplies) */}
            <div className="space-y-1.5">
              <Label htmlFor="item_type">
                Item Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedType}
                onValueChange={(val: any) =>
                  handleTypeChange(val || "SUPPLIES")
                }
              >
                <SelectTrigger className="w-full h-13.5! px-4! py-0! text-sm">
                  <SelectValue placeholder="Select Item Type">
                    {(value) => {
                      if (value === "EQUIPMENT")
                        return "Equipment (QR-Tracked serialized items & devices)";
                      if (value === "PROPERTY")
                        return "Property (Furniture, appliances, major fixtures)";
                      if (value === "SUPPLIES")
                        return "Supplies (Consumable items, bulk stocks)";
                      return undefined;
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EQUIPMENT" className="h-13.5! px-4!">
                    Equipment (QR-Tracked serialized items & devices)
                  </SelectItem>
                  <SelectItem value="PROPERTY" className="h-13.5! px-4!">
                    Property (Furniture, appliances, major fixtures)
                  </SelectItem>
                  <SelectItem value="SUPPLIES" className="h-13.5! px-4!">
                    Supplies (Consumable items, bulk stocks)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label htmlFor="category_id">
                Category <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedCategoryId}
                onValueChange={(val) => setValue("category_id", val || "")}
              >
                <SelectTrigger className="w-full h-13.5! px-4! py-0! text-sm">
                  <SelectValue placeholder="Select Category">
                    {(value) => {
                      const category = categories.find((c) => c.id === value);
                      return category ? category.name : undefined;
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {categories.map((cat) => (
                    <SelectItem
                      key={cat.id}
                      value={cat.id}
                      className="h-13.5! px-4!"
                    >
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category_id && (
                <p className="text-xs font-semibold text-destructive">
                  {errors.category_id.message}
                </p>
              )}
            </div>

            {/* Item Code (For Equipment and Property only with locked prefix addon) */}
            {isTracked && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="code_suffix">Item Code (Asset Tag)</Label>
                  {fetchingCode && (
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                      <Loader2 className="size-3 animate-spin" /> Suggesting
                      code...
                    </span>
                  )}
                </div>
                <div className="flex items-stretch rounded-md border border-input overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                  <span className="inline-flex items-center px-3.5 bg-muted text-muted-foreground font-mono text-sm font-semibold border-r select-none shrink-0">
                    {currentPrefix}
                  </span>
                  <Input
                    id="code_suffix"
                    placeholder="001"
                    className="h-13.5 px-4 text-sm font-mono border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 flex-1"
                    {...register("code_suffix")}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  The prefix is locked according to the Item Type. You can
                  customize the identifier suffix.
                </p>
              </div>
            )}

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description">Item Description</Label>
              <Textarea
                id="description"
                placeholder="Technical specifications, serials, notes, or storage details"
                className="resize-none h-20 px-4 py-2 text-sm"
                {...register("description")}
              />
            </div>

            {/* Serial Number (for Equipment and Property) */}
            {isTracked && (
              <div className="space-y-1.5">
                <Label htmlFor="serial_number">
                  Item Serial No. (Optional)
                </Label>
                <Input
                  id="serial_number"
                  placeholder="e.g. SN-8941-XJ902"
                  className="h-13.5 px-4 text-sm font-mono"
                  {...register("serial_number")}
                />
              </div>
            )}

            {/* Source of Fund */}
            <div className="space-y-1.5">
              <Label htmlFor="source_of_fund">Source of Fund (Optional)</Label>
              <Input
                id="source_of_fund"
                placeholder="e.g. LSG Operational Budget 2026, Student Council Grant, Donation"
                className="h-13.5 px-4 text-sm"
                {...register("source_of_fund")}
              />
            </div>

            {/* Quantity & Unit of Measure Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Quantity */}
              <div className="space-y-1.5">
                <Label htmlFor="quantity">
                  {isTracked ? "Units to Generate" : "Stock Quantity"}
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  disabled={isEdit}
                  placeholder={isTracked ? "e.g. 5" : "e.g. 100"}
                  className={cn(
                    "h-13.5 px-4 text-sm",
                    isEdit &&
                      "bg-muted text-muted-foreground cursor-not-allowed",
                  )}
                  {...register("quantity", { valueAsNumber: true })}
                />
                {errors.quantity && (
                  <p className="text-xs font-semibold text-destructive">
                    {errors.quantity.message}
                  </p>
                )}
              </div>

              {/* Unit of Measurement */}
              <div className="space-y-1.5">
                <Label htmlFor="unit">Unit of Measure</Label>
                <Input
                  id="unit"
                  placeholder="e.g. pcs, box, roll, pack, set"
                  className="h-13.5 px-4 text-sm"
                  {...register("unit")}
                />
              </div>
            </div>
            {isEdit && (
              <p className="text-[11px] text-muted-foreground -mt-1">
                To adjust supply stock quantities or add assets to an existing
                item, use the Stock Adjustment controls in the item details.
              </p>
            )}

            {/* Initial Condition (For Equipment and Property when creating) */}
            {!isEdit && isTracked && (
              <div className="space-y-1.5">
                <Label htmlFor="condition">Initial Asset Condition</Label>
                <Select
                  value={selectedCondition}
                  onValueChange={(val) =>
                    setValue("condition", val || DEFAULT_ASSET_CONDITION)
                  }
                >
                  <SelectTrigger className="w-full h-13.5! px-4! py-0! text-sm font-medium">
                    <SelectValue placeholder="Select Condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSET_CONDITIONS.map((cond) => (
                      <SelectItem
                        key={cond}
                        value={cond}
                        className="h-13.5! px-4!"
                      >
                        {cond}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Default is Used - Good. You can also adjust individual asset
                  conditions later from the assets view.
                </p>
              </div>
            )}

            {/* Date Purchased */}
            <div className="space-y-1.5 flex flex-col">
              <Label>Date Purchased (Optional)</Label>
              <div className="relative w-full flex items-center">
                <Popover>
                  <PopoverTrigger
                    render={
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "w-full h-13.5 justify-start text-left font-normal border-border gap-2 px-4 pr-10 text-sm",
                          !datePurchased && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="size-4 text-muted-foreground shrink-0" />
                        <span>
                          {datePurchased
                            ? format(new Date(datePurchased), "PPP")
                            : "Pick a date"}
                        </span>
                      </Button>
                    }
                  />
                  <PopoverContent
                    className="w-auto p-0 flex flex-col"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      captionLayout="dropdown"
                      startMonth={new Date(2000, 0)}
                      endMonth={new Date(new Date().getFullYear() + 10, 11)}
                      selected={datePurchased || undefined}
                      onSelect={(val) =>
                        setValue("date_purchased", val || null)
                      }
                    />
                    {datePurchased && (
                      <div className="p-2 border-t flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-xs h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setValue("date_purchased", null)}
                        >
                          Clear Date
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>

                {datePurchased && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer z-10"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setValue("date_purchased", null);
                    }}
                  >
                    <X className="size-4" />
                  </Button>
                )}
              </div>
            </div>
          </form>
        </ScrollArea>

        <DrawerFooter className="border-t mt-auto shrink-0 flex flex-row gap-2 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="flex-1 h-13.5 px-4 text-sm font-semibold"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={loading}
            className="flex-1 h-13.5 px-4 text-sm font-semibold"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Update Item" : "Save Item"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
