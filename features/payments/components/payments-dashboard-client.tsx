"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  RefreshCw,
  Search,
  CreditCard,
  Package,
  BarChart3,
} from "lucide-react";
import { FeeItemsTable } from "./fee-items-table";
import { TransactionsTable } from "./transactions-table";
import { PaymentsAnalytics } from "./payments-analytics";
import { AddFeeItemDrawer } from "./add-fee-item-drawer";
import { AddPaymentDrawer } from "./add-payment-drawer";
import { FeeItemDetailDrawer } from "./fee-item-detail-drawer";
import { GetPaymentsDashboardData } from "../actions/payments";
import { toast } from "sonner";

interface PaymentsDashboardClientProps {
  initialData: {
    feeItems: any[];
    transactions: any[];
    stockLogs: any[];
    stats: any;
  };
  initialTab?: "items" | "transactions" | "analytics";
  userPermissions?: string[];
}

export function PaymentsDashboardClient({
  initialData,
  initialTab = "items",
  userPermissions = [],
}: PaymentsDashboardClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<
    "items" | "transactions" | "analytics"
  >(initialTab === "analytics" ? "analytics" : initialTab === "transactions" ? "transactions" : "items");

  const [data, setData] = useState(initialData);
  const [searchQuery, setSearchQuery] = useState("");

  const [addFeeItemOpen, setAddFeeItemOpen] = useState(false);
  const [addPaymentOpen, setAddPaymentOpen] = useState(false);
  const [selectedDetailItem, setSelectedDetailItem] = useState<any | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);

  const handleRefresh = () => {
    startTransition(async () => {
      const res = await GetPaymentsDashboardData();
      if (res.ok && res.data) {
        setData(res.data);
        toast.success("Payments data refreshed.");
      } else {
        toast.error("Failed to refresh data.");
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

  const filteredTransactions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return data.transactions;
    return data.transactions.filter((tx) => {
      const afMatch = tx.af_number.toLowerCase().includes(q);
      const studentMatch =
        tx.student &&
        (`${tx.student.first_name} ${tx.student.last_name}`.toLowerCase().includes(q) ||
          tx.student.student_id.toLowerCase().includes(q));
      const itemMatch = tx.items?.some((it: any) =>
        it.item?.name.toLowerCase().includes(q)
      );
      return afMatch || studentMatch || itemMatch;
    });
  }, [data.transactions, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items, AF#, student ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-13.5 text-sm"
          />
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
            variant="outline"
            onClick={() => setAddFeeItemOpen(true)}
            className="h-13.5 px-4 font-semibold text-xs gap-2 flex-1 sm:flex-initial"
          >
            <Plus className="h-4 w-4" />
            Add Item / Merch
          </Button>

          <Button
            onClick={() => setAddPaymentOpen(true)}
            className="h-13.5 px-5 font-semibold text-xs gap-2 flex-1 sm:flex-initial"
          >
            <CreditCard className="h-4 w-4" />
            Record Payment
          </Button>
        </div>
      </div>

      <div className="w-full space-y-4">
        <div className="flex rounded-xl p-1 bg-data-grid-bg border border-input gap-1 overflow-x-auto">
          <Button
            type="button"
            variant={activeTab === "items" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("items")}
            className="flex-1 text-xs font-semibold h-11 gap-1.5 min-w-[130px]"
          >
            <Package className="h-4 w-4" />
            Items Catalog ({data.feeItems.length})
          </Button>
          <Button
            type="button"
            variant={activeTab === "transactions" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("transactions")}
            className="flex-1 text-xs font-semibold h-11 gap-1.5 min-w-[130px]"
          >
            <CreditCard className="h-4 w-4" />
            Payments ({data.transactions.length})
          </Button>
          <Button
            type="button"
            variant={activeTab === "analytics" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("analytics")}
            className="flex-1 text-xs font-semibold h-11 gap-1.5 min-w-[110px]"
          >
            <BarChart3 className="h-4 w-4" />
            Analytics
          </Button>
        </div>

        {activeTab === "items" && (
          <div className="space-y-4">
            <FeeItemsTable
              items={data.feeItems}
              filteredItems={filteredItems}
              onItemClick={(item) => {
                setSelectedDetailItem(item);
                setDetailDrawerOpen(true);
              }}
              onRefresh={handleRefresh}
            />
          </div>
        )}

        {activeTab === "transactions" && (
          <div className="space-y-4">
            <TransactionsTable
              transactions={data.transactions}
              filteredTransactions={filteredTransactions}
              onRefresh={handleRefresh}
            />
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-4">
            <PaymentsAnalytics
              stats={data.stats}
              transactions={data.transactions}
              feeItems={data.feeItems}
            />
          </div>
        )}
      </div>

      <AddFeeItemDrawer
        open={addFeeItemOpen}
        onOpenChange={setAddFeeItemOpen}
        onSuccess={handleRefresh}
      />

      <AddPaymentDrawer
        open={addPaymentOpen}
        onOpenChange={setAddPaymentOpen}
        feeItems={data.feeItems}
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
