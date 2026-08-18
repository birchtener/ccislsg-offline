"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Tag,
  Filter,
} from "lucide-react";

interface PaymentsAnalyticsProps {
  stats: {
    todayTransactionsCount: number;
    todayRevenue: number;
    totalRevenue: number;
    cfRevenue: number;
    mfRevenue: number;
    mfUnitsSold: number;
    totalFeeItems: number;
  };
  transactions: any[];
  feeItems: any[];
}

export function PaymentsAnalytics({
  stats,
  transactions,
  feeItems,
}: PaymentsAnalyticsProps) {
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedItemId, setSelectedItemId] = useState<string>("all");

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (tx.status === "VOIDED") return false;

      if (filterType === "cf") {
        const hasCf = tx.items.some((i: any) => i.item?.type === "cf");
        if (!hasCf) return false;
      } else if (filterType === "mf") {
        const hasMf = tx.items.some((i: any) => i.item?.type === "mf");
        if (!hasMf) return false;
      }

      if (selectedItemId !== "all") {
        const hasItem = tx.items.some((i: any) => i.item_id === selectedItemId);
        if (!hasItem) return false;
      }

      return true;
    });
  }, [transactions, filterType, selectedItemId]);

  const itemEarningsBreakdown = useMemo(() => {
    const map = new Map<
      string,
      { id: string; name: string; type: string; price: number; unitsSold: number; totalEarnings: number }
    >();

    feeItems.forEach((item) => {
      map.set(item.id, {
        id: item.id,
        name: item.name,
        type: item.type,
        price: Number(item.price),
        unitsSold: 0,
        totalEarnings: 0,
      });
    });

    transactions.forEach((tx) => {
      if (tx.status === "VOIDED") return;
      tx.items.forEach((it: any) => {
        const record = map.get(it.item_id);
        if (record) {
          record.unitsSold += it.quantity;
          record.totalEarnings += Number(it.subtotal);
        }
      });
    });

    return Array.from(map.values()).sort(
      (a, b) => b.totalEarnings - a.totalEarnings
    );
  }, [feeItems, transactions]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <Card className="border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-4 pb-1 sm:pb-2 space-y-0">
            <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">
              Today's Earnings
            </CardTitle>
            <TrendingUp className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-emerald-500 shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
            <div className="text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              ₱{stats.todayRevenue.toFixed(2)}
            </div>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5 sm:mt-1 line-clamp-1">
              {stats.todayTransactionsCount} transaction(s) today
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-4 pb-1 sm:pb-2 space-y-0">
            <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-primary shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
            <div className="text-lg sm:text-2xl font-black text-primary">
              ₱{stats.totalRevenue.toFixed(2)}
            </div>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5 sm:mt-1 line-clamp-1">
              Cumulative earnings recorded
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-4 pb-1 sm:pb-2 space-y-0">
            <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">
              College Fees Revenue
            </CardTitle>
            <Tag className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-blue-500 shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
            <div className="text-lg sm:text-2xl font-black text-foreground">
              ₱{stats.cfRevenue.toFixed(2)}
            </div>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5 sm:mt-1 line-clamp-1">
              Org dues & college fee items
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-4 pb-1 sm:pb-2 space-y-0">
            <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">
              Merchandise Revenue
            </CardTitle>
            <ShoppingBag className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-amber-500 shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
            <div className="text-lg sm:text-2xl font-black text-foreground">
              ₱{stats.mfRevenue.toFixed(2)}
            </div>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5 sm:mt-1 line-clamp-1">
              {stats.mfUnitsSold} units sold
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border shadow-xs">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary" />
                Revenue Breakdown & Item Analytics
              </CardTitle>
              <CardDescription className="text-xs">
                Filter analytics by fee type or specific merchandise items.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <Select value={filterType} onValueChange={(val) => val && setFilterType(val)}>
                <SelectTrigger className="h-13.5 px-4 text-xs">
                  <SelectValue placeholder="All Fee Types">
                    {(val) => {
                      if (val === "cf") return "College Fees (cf)";
                      if (val === "mf") return "Merchandise (mf)";
                      return "All Fee Types";
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Fee Types</SelectItem>
                  <SelectItem value="cf">College Fees (cf)</SelectItem>
                  <SelectItem value="mf">Merchandise (mf)</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedItemId} onValueChange={(val) => val && setSelectedItemId(val)}>
                <SelectTrigger className="h-13.5 px-4 text-xs">
                  <SelectValue placeholder="All Fee Items">
                    {(val) => {
                      if (!val || val === "all") return "All Fee Items";
                      const item = feeItems.find((i) => i.id === val);
                      return item ? item.name : "All Fee Items";
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="all">All Fee Items</SelectItem>
                  {feeItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {itemEarningsBreakdown.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border bg-card text-card-foreground flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Badge
                      variant={item.type === "cf" ? "outline" : "secondary"}
                      className="text-[9px] uppercase font-bold"
                    >
                      {item.type === "cf" ? "College Fee" : "Merchandise"}
                    </Badge>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      ₱{item.price.toFixed(2)}/unit
                    </span>
                  </div>
                  <h5 className="font-bold text-sm text-foreground">
                    {item.name}
                  </h5>
                  <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                    {item.type === "mf" ? `${item.unitsSold} units sold` : "Flat fee collections"}
                  </p>
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-base text-primary">
                    ₱{item.totalEarnings.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
