"use client";

import { useState, useMemo, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  RefreshCw,
  Search,
  CreditCard,
} from "lucide-react";
import { TransactionsTable } from "./transactions-table";
import { AddPaymentDrawer } from "./add-payment-drawer";
import { GetPaymentsDashboardData } from "../actions/payments";
import { toast } from "sonner";

interface TransactionsViewProps {
  initialData: {
    feeItems: any[];
    transactions: any[];
    stockLogs: any[];
    stats: any;
  };
}

export function TransactionsView({ initialData }: TransactionsViewProps) {
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState(initialData);
  const [searchQuery, setSearchQuery] = useState("");

  const [addPaymentOpen, setAddPaymentOpen] = useState(false);

  const handleRefresh = () => {
    startTransition(async () => {
      const res = await GetPaymentsDashboardData();
      if (res.ok && res.data) {
        setData(res.data);
        toast.success("Transactions refreshed.");
      } else {
        toast.error("Failed to refresh transactions.");
      }
    });
  };

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
          <Input
            placeholder="Search AF#, student ID, item..."
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
            onClick={() => setAddPaymentOpen(true)}
            className="h-13.5 px-4 font-semibold text-xs gap-2 flex-1 sm:flex-initial"
          >
            <CreditCard className="h-4 w-4" />
            Record Payment
          </Button>
        </div>
      </div>

      <TransactionsTable
        transactions={data.transactions}
        filteredTransactions={filteredTransactions}
        onRefresh={handleRefresh}
      />

      <AddPaymentDrawer
        open={addPaymentOpen}
        onOpenChange={setAddPaymentOpen}
        feeItems={data.feeItems}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
