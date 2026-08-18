"use client";

import { useState, useTransition, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Boxes,
  ClipboardList,
  Plus,
  RefreshCw,
  Search,
  Wrench,
  Printer,
  QrCode,
  Archive,
  Download,
} from "lucide-react";
import { AddEditItemDrawer } from "./add-edit-item-drawer";
import { ItemDetailDrawer } from "./item-detail-drawer";
import { PrintableAssetLabels } from "./printable-asset-labels";
import { ExportInventoryDialog } from "./export-inventory-dialog";
import { ItemsTable } from "./items-table";
import { toast } from "sonner";

interface InventoryDashboardClientProps {
  initialData: {
    items: any[];
    assets: any[];
    categories: any[];
    stats: {
      totalItems: number;
      totalAssets: number;
      activeBorrows: number;
      maintenanceAssets: number;
    };
  };
  defaultTab?: "all" | "property" | "equipment" | "supply" | "disposed";
}

export function InventoryDashboardClient({
  initialData,
  defaultTab = "all",
}: InventoryDashboardClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<
    "all" | "property" | "equipment" | "supply" | "disposed"
  >(defaultTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] =
    useState<string>("ALL");

  const [addOpen, setAddOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<any | null>(null);

  const [selectedDetailItem, setSelectedDetailItem] = useState<any | null>(
    null,
  );
  const [detailOpen, setDetailOpen] = useState(false);

  const [printOpen, setPrintOpen] = useState(false);
  const [printAssets, setPrintAssets] = useState<
    Array<{
      tag: string;
      itemName: string;
      itemId: string;
      createdAt: string | Date;
      creatorLastName: string;
      datePurchased?: string | Date | null;
    }>
  >([]);

  const [exportOpen, setExportOpen] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(
    new Set(),
  );

  const handleRefresh = useCallback(() => {
    startTransition(() => {
      router.refresh();
    });
  }, [router]);

  const handlePrintItemAssets = useCallback(
    (item: any) => {
      const itemAssets = initialData.assets.filter(
        (a) => a.item_id === item.id && a.status !== "DISPOSED",
      );
      if (itemAssets.length === 0) {
        toast.error("No active assets found for this item to print.");
        return;
      }
      setPrintAssets(
        itemAssets.map((a) => ({
          tag: a.asset_tag,
          itemName: item.name,
          itemId: item.id,
          createdAt: item.created_at,
          creatorLastName: item.created_user?.last_name || "",
          datePurchased: item.date_purchased,
        })),
      );
      setPrintOpen(true);
    },
    [initialData.assets],
  );

  const toggleItemSelection = useCallback((id: string, checked: boolean) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  // Helper to determine item type reliably (with fallback for legacy items)
  const getItemType = useCallback(
    (item: any): "PROPERTY" | "EQUIPMENT" | "SUPPLIES" => {
      if (
        item.type === "PROPERTY" ||
        item.type === "EQUIPMENT" ||
        item.type === "SUPPLIES"
      ) {
        return item.type;
      }
      if (item.item_code?.startsWith("CCISLSG-P-")) return "PROPERTY";
      if (item.item_code?.startsWith("CCISLSG-E-")) return "EQUIPMENT";
      if (item.item_code?.startsWith("CCISLSG-S-")) return "SUPPLIES";
      if (
        item.category?.type === "PROPERTY" ||
        item.category?.type === "EQUIPMENT" ||
        item.category?.type === "SUPPLIES"
      ) {
        return item.category.type;
      }
      const catName = (item.category?.name || "").toLowerCase();
      if (
        catName.includes("equipment") ||
        catName.includes("it") ||
        catName.includes("audio") ||
        catName.includes("sports")
      ) {
        return "EQUIPMENT";
      }
      if (
        catName.includes("property") ||
        catName.includes("furniture") ||
        catName.includes("appliance")
      ) {
        return "PROPERTY";
      }
      return "SUPPLIES";
    },
    [],
  );

  // Filter items based on Tab, Category dropdown, and Search query
  const filteredItems = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return initialData.items.filter((item) => {
      const isDisposed = Boolean(item.is_disposed);
      const itemType = getItemType(item);

      // 1. Tab Filter
      if (activeTab === "disposed") {
        if (!isDisposed) return false;
      } else {
        if (isDisposed) return false; // Active tabs only show non-disposed
        if (activeTab === "property" && itemType !== "PROPERTY") return false;
        if (activeTab === "equipment" && itemType !== "EQUIPMENT") return false;
        if (activeTab === "supply" && itemType !== "SUPPLIES") return false;
      }

      // 2. Category Dropdown Filter
      if (
        selectedCategoryFilter !== "ALL" &&
        item.category_id !== selectedCategoryFilter
      ) {
        return false;
      }

      // 3. Search Query Filter
      if (query) {
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesCode =
          item.item_code?.toLowerCase().includes(query) || false;
        const matchesSerial =
          item.serial_number?.toLowerCase().includes(query) || false;
        const matchesSource =
          item.source_of_fund?.toLowerCase().includes(query) || false;
        const matchesCategory =
          item.category?.name?.toLowerCase().includes(query) || false;
        const matchesDesc =
          item.description?.toLowerCase().includes(query) || false;

        return (
          matchesName ||
          matchesCode ||
          matchesSerial ||
          matchesSource ||
          matchesCategory ||
          matchesDesc
        );
      }

      return true;
    });
  }, [
    initialData.items,
    activeTab,
    selectedCategoryFilter,
    searchQuery,
    getItemType,
  ]);

  const propertyCount = useMemo(
    () =>
      initialData.items.filter(
        (i) => !i.is_disposed && getItemType(i) === "PROPERTY",
      ).length,
    [initialData.items, getItemType],
  );

  const equipmentCount = useMemo(
    () =>
      initialData.items.filter(
        (i) => !i.is_disposed && getItemType(i) === "EQUIPMENT",
      ).length,
    [initialData.items, getItemType],
  );

  const supplyCount = useMemo(
    () =>
      initialData.items.filter(
        (i) => !i.is_disposed && getItemType(i) === "SUPPLIES",
      ).length,
    [initialData.items, getItemType],
  );

  const activeTotalCount = useMemo(
    () => initialData.items.filter((i) => !i.is_disposed).length,
    [initialData.items],
  );

  const disposedCount = useMemo(
    () => initialData.items.filter((i) => i.is_disposed).length,
    [initialData.items],
  );

  const toggleAllItems = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedItemIds(
          new Set(
            filteredItems
              .filter((i) => {
                const itemType = getItemType(i);
                return (
                  !i.is_disposed &&
                  (itemType === "PROPERTY" || itemType === "EQUIPMENT")
                );
              })
              .map((i) => i.id),
          ),
        );
      } else {
        setSelectedItemIds(new Set());
      }
    },
    [filteredItems, getItemType],
  );

  const handlePrintSelectedItems = () => {
    const selected: Array<{
      tag: string;
      itemName: string;
      itemId: string;
      createdAt: string | Date;
      creatorLastName: string;
      datePurchased?: string | Date | null;
    }> = [];

    initialData.assets.forEach((asset) => {
      if (selectedItemIds.has(asset.item_id) && asset.status !== "DISPOSED") {
        selected.push({
          tag: asset.asset_tag,
          itemName: asset.item.name,
          itemId: asset.item.id,
          createdAt: asset.item.created_at,
          creatorLastName: asset.item.created_user?.last_name || "",
          datePurchased: asset.item.date_purchased,
        });
      }
    });

    if (selected.length === 0) {
      toast.error("No active assets found for selected items.");
      return;
    }
    setPrintAssets(selected);
    setPrintOpen(true);
  };

  const availableCategories = initialData.categories;

  return (
    <div className="w-full space-y-6 text-left">
      {/* Stats Cards (Top Most) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <Card className="">
          <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-4 pb-1 sm:pb-2 space-y-0">
            <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">
              Total Active Items
            </CardTitle>
            <Boxes className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-primary shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
            <div className="text-lg sm:text-2xl font-black">
              {initialData.items.filter((i) => !i.is_disposed).length}
            </div>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5 sm:mt-1 line-clamp-1">
              Active inventory items
            </p>
          </CardContent>
        </Card>

        <Card className="border-1! shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-4 pb-1 sm:pb-2 space-y-0">
            <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">
              Tracked Assets
            </CardTitle>
            <QrCode className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-emerald-500 shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
            <div className="text-lg sm:text-2xl font-black">
              {initialData.assets.filter((a) => a.status !== "DISPOSED").length}
            </div>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5 sm:mt-1 line-clamp-1">
              QR labeled equipment & properties
            </p>
          </CardContent>
        </Card>

        <Card className="border-1! shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-4 pb-1 sm:pb-2 space-y-0">
            <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">
              Active Borrows
            </CardTitle>
            <ClipboardList className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-blue-500 shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
            <div className="text-lg sm:text-2xl font-black">
              {initialData.stats.activeBorrows}
            </div>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5 sm:mt-1 line-clamp-1">
              Currently checked-out materials
            </p>
          </CardContent>
        </Card>

        <Card className="border-1! shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-4 pb-1 sm:pb-2 space-y-0">
            <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">
              Disposed / Written Off
            </CardTitle>
            <Archive className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-amber-500 shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
            <div className="text-lg sm:text-2xl font-black">
              {initialData.items.filter((i) => i.is_disposed).length}
            </div>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5 sm:mt-1 line-clamp-1">
              Archived historical items
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Header Controls (Payments Standard) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Left Side Search & Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {/* Search Bar */}
          <div className="relative w-full sm:w-80">
            <Input
              placeholder="Search items, codes, serials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-4 pr-10 h-13.5 text-sm"
            />
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>

          {/* Category Select Filter */}
          <div className="w-full sm:w-56">
            <Select
              value={selectedCategoryFilter}
              onValueChange={(val) => setSelectedCategoryFilter(val || "ALL")}
            >
              <SelectTrigger className="w-full h-13.5! px-4! py-0! text-sm">
                <SelectValue placeholder="All Categories">
                  {(val) => {
                    if (!val || val === "ALL") return "All Categories";
                    const found = availableCategories.find((c) => c.id === val);
                    return found ? found.name : "All Categories";
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                <SelectItem value="ALL" className="h-13.5! px-4!">
                  All Categories
                </SelectItem>
                {availableCategories.map((cat) => (
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
          </div>
        </div>

        {/* Right Side Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {selectedItemIds.size > 0 && activeTab !== "disposed" && (
            <Button
              onClick={handlePrintSelectedItems}
              className="h-13.5 px-4 font-semibold text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700 text-white animate-in fade-in zoom-in-95 duration-100"
            >
              <Printer className="size-4 mr-2" />
              Print Selected ({selectedItemIds.size})
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setExportOpen(true)}
            className="h-13.5 px-4 font-semibold text-xs sm:text-sm gap-2 cursor-pointer shrink-0"
          >
            <Download className="size-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isPending}
            className="h-13.5 w-13.5 cursor-pointer shrink-0"
          >
            <RefreshCw
              className={isPending ? "h-4 w-4 animate-spin" : "h-4 w-4"}
            />
          </Button>
          <Button
            onClick={() => {
              setItemToEdit(null);
              setAddOpen(true);
            }}
            className="h-13.5 px-4 font-semibold text-xs sm:text-sm gap-2 flex-1 sm:flex-initial"
          >
            <Plus className="size-4" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Tabs Container (All, Property, Equipment, Supply, Disposed) */}
      <Tabs
        value={activeTab}
        onValueChange={(val: any) => {
          setActiveTab(val);
          setSearchQuery("");
          setSelectedCategoryFilter("ALL");
          setSelectedItemIds(new Set());
        }}
        className="w-full space-y-4"
      >
        <div className="w-full overflow-x-auto pb-1.5 scrollbar-none">
          <TabsList className="w-max flex flex-nowrap shrink-0">
            <TabsTrigger
              value="all"
              onClick={() => {
                setActiveTab("all");
                setSelectedItemIds(new Set());
              }}
            >
              All
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-background/50 border border-border/60">
                {activeTotalCount}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="property"
              onClick={() => {
                setActiveTab("property");
                setSelectedItemIds(new Set());
              }}
            >
              Property
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-background/50 border border-border/60">
                {propertyCount}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="equipment"
              onClick={() => {
                setActiveTab("equipment");
                setSelectedItemIds(new Set());
              }}
            >
              Equipment
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-background/50 border border-border/60">
                {equipmentCount}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="supply"
              onClick={() => {
                setActiveTab("supply");
                setSelectedItemIds(new Set());
              }}
            >
              Supply
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-background/50 border border-border/60">
                {supplyCount}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="disposed"
              onClick={() => {
                setActiveTab("disposed");
                setSelectedItemIds(new Set());
              }}
            >
              Disposed
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-background/50 border border-border/60">
                {disposedCount}
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        <ItemsTable
          items={initialData.items}
          filteredItems={filteredItems}
          selectedItemIds={selectedItemIds}
          toggleItemSelection={toggleItemSelection}
          toggleAllItems={toggleAllItems}
          handlePrintItemAssets={handlePrintItemAssets}
          onRefresh={handleRefresh}
          onItemClick={(item) => {
            setSelectedDetailItem(item);
            setDetailOpen(true);
          }}
          onEdit={(item) => {
            setItemToEdit(item);
            setAddOpen(true);
          }}
        />
      </Tabs>

      <AddEditItemDrawer
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) setItemToEdit(null);
        }}
        categories={initialData.categories}
        itemToEdit={itemToEdit}
        onSuccess={handleRefresh}
      />

      <ItemDetailDrawer
        item={selectedDetailItem}
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        onRefresh={handleRefresh}
      />

      <PrintableAssetLabels
        open={printOpen}
        onOpenChange={setPrintOpen}
        assets={printAssets}
      />

      <ExportInventoryDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        categories={initialData.categories}
        currentCategoryId={selectedCategoryFilter}
      />
    </div>
  );
}
