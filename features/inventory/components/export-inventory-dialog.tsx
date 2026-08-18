"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Check,
  Download,
  FileSpreadsheet,
  Files,
  FolderTree,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { GetExportInventoryItemsData } from "../actions/inventory";
import {
  exportAllItemsToCsv,
  exportCategoryItemsToCsv,
  InventoryExportItem,
} from "../lib/export-items";

interface ExportInventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Array<{ id: string; name: string; description?: string | null }>;
  currentCategoryId?: string;
}

export function ExportInventoryDialog({
  open,
  onOpenChange,
  categories,
  currentCategoryId = "ALL",
}: ExportInventoryDialogProps) {
  const isMobile = useIsMobile();
  const [exportMode, setExportMode] = useState<
    "ALL_UNIFIED" | "SINGLE_CATEGORY" | "EACH_CATEGORY_SEPARATE"
  >("ALL_UNIFIED");
  const [selectedCategory, setSelectedCategory] = useState<string>(
    currentCategoryId !== "ALL" ? currentCategoryId : categories[0]?.id || ""
  );
  const [includeDisposed, setIncludeDisposed] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (exportMode === "SINGLE_CATEGORY") {
        const targetCatId = selectedCategory || categories[0]?.id;
        const catObj = categories.find((c) => c.id === targetCatId);
        const res = await GetExportInventoryItemsData({
          categoryId: targetCatId,
          includeDisposed,
        });

        if (!res.ok || !res.items) {
          toast.error(res.error || "Failed to fetch export data.");
          return;
        }

        if (res.items.length === 0) {
          toast.info(
            `No items found in category "${catObj?.name || "Selected"}" to export.`
          );
          return;
        }

        exportCategoryItemsToCsv(
          catObj?.name || "category",
          res.items as InventoryExportItem[]
        );
        toast.success(
          `Exported ${res.items.length} items from "${catObj?.name || "Category"}".`
        );
        onOpenChange(false);
      } else if (exportMode === "ALL_UNIFIED") {
        const res = await GetExportInventoryItemsData({
          categoryId: "ALL",
          includeDisposed,
        });

        if (!res.ok || !res.items) {
          toast.error(res.error || "Failed to fetch export data.");
          return;
        }

        if (res.items.length === 0) {
          toast.info("No inventory items available to export.");
          return;
        }

        exportAllItemsToCsv(res.items as InventoryExportItem[]);
        toast.success(
          `Exported all ${res.items.length} inventory items across categories.`
        );
        onOpenChange(false);
      } else if (exportMode === "EACH_CATEGORY_SEPARATE") {
        const res = await GetExportInventoryItemsData({
          categoryId: "ALL",
          includeDisposed,
        });

        if (!res.ok || !res.items) {
          toast.error(res.error || "Failed to fetch export data.");
          return;
        }

        if (res.items.length === 0) {
          toast.info("No inventory items available to export.");
          return;
        }

        // Group items by category
        const itemsByCategory = new Map<string, InventoryExportItem[]>();
        categories.forEach((cat) => itemsByCategory.set(cat.id, []));

        res.items.forEach((item) => {
          const catId = item.category_id;
          if (catId && itemsByCategory.has(catId)) {
            itemsByCategory.get(catId)!.push(item as InventoryExportItem);
          } else {
            const fallbackKey = item.category?.id || "other";
            if (!itemsByCategory.has(fallbackKey)) {
              itemsByCategory.set(fallbackKey, []);
            }
            itemsByCategory.get(fallbackKey)!.push(item as InventoryExportItem);
          }
        });

        let exportedCount = 0;
        let fileCount = 0;

        // Download CSV for each category that has items
        itemsByCategory.forEach((catItems, catId) => {
          if (catItems.length > 0) {
            const catName =
              categories.find((c) => c.id === catId)?.name ||
              catItems[0]?.category?.name ||
              "Category";
            // Stagger download triggers slightly so browser doesn't block multi-download
            setTimeout(() => {
              exportCategoryItemsToCsv(catName, catItems);
            }, fileCount * 250);
            exportedCount += catItems.length;
            fileCount++;
          }
        });

        if (fileCount === 0) {
          toast.info("No items found to export in any category.");
          return;
        }

        toast.success(
          `Exported ${exportedCount} items across ${fileCount} category CSV file(s).`
        );
        onOpenChange(false);
      }
    } catch (err) {
      console.error("Export error:", err);
      toast.error("An unexpected error occurred while exporting.");
    } finally {
      setIsExporting(false);
    }
  };

  const renderContent = () => (
    <div className="space-y-4 px-6 py-4 text-left">
      <div className="space-y-2.5">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Export Scope
        </Label>
        <div className="space-y-2">
          {/* Option 1: All Categories Unified */}
          <div
            onClick={() => setExportMode("ALL_UNIFIED")}
            className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
              exportMode === "ALL_UNIFIED"
                ? "border-primary bg-primary/5 shadow-xs"
                : "border-border hover:bg-muted/50"
            }`}
          >
            <div
              className={`size-4 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${
                exportMode === "ALL_UNIFIED"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted-foreground/40"
              }`}
            >
              {exportMode === "ALL_UNIFIED" && <Check className="size-3 stroke-[3]" />}
            </div>
            <div className="flex-1 space-y-0.5">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <FileSpreadsheet className="h-4 w-4 text-primary" />
                <span>All Categories (Combined CSV)</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Exports all inventory items organized into a single CSV file.
              </p>
            </div>
          </div>

          {/* Option 2: Single Category */}
          <div
            onClick={() => setExportMode("SINGLE_CATEGORY")}
            className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
              exportMode === "SINGLE_CATEGORY"
                ? "border-primary bg-primary/5 shadow-xs"
                : "border-border hover:bg-muted/50"
            }`}
          >
            <div
              className={`size-4 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${
                exportMode === "SINGLE_CATEGORY"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted-foreground/40"
              }`}
            >
              {exportMode === "SINGLE_CATEGORY" && <Check className="size-3 stroke-[3]" />}
            </div>
            <div className="flex-1 space-y-0.5">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <FolderTree className="h-4 w-4 text-emerald-500" />
                <span>Specific Category Only</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Select an individual category to export its items only.
              </p>
            </div>
          </div>

          {/* Option 3: Separate files per category */}
          <div
            onClick={() => setExportMode("EACH_CATEGORY_SEPARATE")}
            className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
              exportMode === "EACH_CATEGORY_SEPARATE"
                ? "border-primary bg-primary/5 shadow-xs"
                : "border-border hover:bg-muted/50"
            }`}
          >
            <div
              className={`size-4 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${
                exportMode === "EACH_CATEGORY_SEPARATE"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted-foreground/40"
              }`}
            >
              {exportMode === "EACH_CATEGORY_SEPARATE" && (
                <Check className="size-3 stroke-[3]" />
              )}
            </div>
            <div className="flex-1 space-y-0.5">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <Files className="h-4 w-4 text-blue-500" />
                <span>Each Category as Separate CSV</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Generates and downloads an individual CSV file for each category.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Picker when Single Category is selected */}
      {exportMode === "SINGLE_CATEGORY" && (
        <div className="space-y-2 animate-in fade-in-50 duration-200">
          <Label className="text-xs font-semibold">Select Category</Label>
          <Select
            value={selectedCategory}
            onValueChange={(val) => setSelectedCategory(val || "")}
          >
            <SelectTrigger className="h-13.5! px-4! py-0! text-sm font-medium w-full">
              <SelectValue placeholder="Choose Category">
                {(val) => {
                  const cat = categories.find((c) => c.id === val);
                  return cat ? cat.name : "Choose Category";
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id} className="h-13.5! px-4!">
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Disposed items checkbox */}
      <div className="flex items-center space-x-2 pt-1">
        <Checkbox
          id="include-disposed"
          checked={includeDisposed}
          onCheckedChange={(c) => setIncludeDisposed(Boolean(c))}
        />
        <Label
          htmlFor="include-disposed"
          className="text-xs text-muted-foreground cursor-pointer font-medium"
        >
          Include archived / disposed items in export
        </Label>
      </div>

      {/* Columns Preview Info */}
      <div className="p-3 bg-muted/50 border rounded-lg space-y-1">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Included Columns
        </div>
        <p className="text-[11px] text-foreground font-mono leading-relaxed break-words">
          Item Code, Item, Item Description, Item Serial No., Quantity, Source of Fund, Inventory Date, Date Purchased, Condition
        </p>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[85dvh] flex flex-col max-w-lg mx-auto">
          <DrawerHeader className="border-b text-left">
            <DrawerTitle className="text-base font-bold flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Export Inventory Items
            </DrawerTitle>
            <DrawerDescription className="text-xs">
              Download CSV spreadsheets formatted with category & item records.
            </DrawerDescription>
          </DrawerHeader>

          <ScrollArea className="flex-1 min-h-0 py-2" data-base-ui-swipe-ignore>
            {renderContent()}
          </ScrollArea>

          <DrawerFooter className="border-t mt-auto shrink-0 flex flex-row gap-2 px-6 py-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isExporting}
              className="flex-1 h-13.5 px-4 font-semibold text-xs sm:text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="flex-1 h-13.5 px-4 font-semibold text-xs sm:text-sm gap-2"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export CSV
                </>
              )}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b text-left">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Export Inventory Items
          </DialogTitle>
          <DialogDescription className="text-xs">
            Download CSV spreadsheets formatted with category & item records.
          </DialogDescription>
        </DialogHeader>

        {renderContent()}

        <div className="p-6 pt-4 border-t flex flex-row gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
            className="h-13.5 px-4 font-semibold text-xs sm:text-sm"
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="h-13.5 px-4 font-semibold text-xs sm:text-sm gap-2 min-w-32"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export CSV
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
