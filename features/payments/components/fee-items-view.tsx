"use client";

import { useState, useMemo, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import { FeeItemsTable } from "./fee-items-table";
import { AddFeeItemDrawer } from "./add-fee-item-drawer";
import { FeeItemDetailDrawer } from "./fee-item-detail-drawer";
import { GetPaymentsDashboardData } from "../actions/payments";
import { toast } from "sonner";

interface FeeItemsViewProps {
  initialData: {
    feeItems: any[];
    transactions: any[];
    stockLogs: any[];
    stats: any;
  };
}

export function FeeItemsView({ initialData }: FeeItemsViewProps) {
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState(initialData);
  const [searchQuery, setSearchQuery] = useState("");

  const [addFeeItemOpen, setAddFeeItemOpen] = useState(false);
  const [selectedDetailItem, setSelectedDetailItem] = useState<any | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);

  const handleRefresh = () => {
    startTransition(async () => {
      const res = await GetPaymentsDashboardData();
      if (res.ok && res.data) {
        setData(res.data);
        toast.success("Fee items refreshed.");
      } else {
        toast.error("Failed to refresh items.");
      }
    });
  };

  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return data.feeItems;
    return data.feeItems.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q))
    );
  }, [data.feeItems, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-80">
          <Input
            placeholder="Search items catalog..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-4 pr-10 h-13.5 text-sm"
          />
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isPending}
            className="h-13.5 w-13.5 cursor-pointer shrink-0"
          >
            <RefreshCw className={isPending ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          </Button>

          <Button
            onClick={() => setAddFeeItemOpen(true)}
            className="h-13.5 px-4 font-semibold text-xs gap-2 flex-1 sm:flex-initial"
          >
            <Plus className="h-4 w-4" />
            Add Item / Merch
          </Button>
        </div>
      </div>

      <FeeItemsTable
        items={data.feeItems}
        filteredItems={filteredItems}
        onItemClick={(item) => {
          setSelectedDetailItem(item);
          setDetailDrawerOpen(true);
        }}
        onRefresh={handleRefresh}
      />

      <AddFeeItemDrawer
        open={addFeeItemOpen}
        onOpenChange={setAddFeeItemOpen}
        onSuccess={handleRefresh}
      />

      <FeeItemDetailDrawer
        item={selectedDetailItem}
        isOpen={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
        onRefresh={handleRefresh}
      />
    </div>
  );
}
