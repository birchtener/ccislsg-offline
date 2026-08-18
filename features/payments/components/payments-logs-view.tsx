"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History, User, Calendar, AlertTriangle, CreditCard, Tag } from "lucide-react";

interface PaymentsLogsViewProps {
  stockLogs: any[];
  auditLogs?: any[];
  transactions?: any[];
}

export function PaymentsLogsView({
  stockLogs,
  auditLogs = [],
  transactions = [],
}: PaymentsLogsViewProps) {
  const [filter, setFilter] = useState<"ALL" | "TRANSACTIONS" | "STOCK" | "AUDIT">("ALL");

  const combinedLogs = useMemo(() => {
    const list: Array<{
      id: string;
      categoryType: "TRANSACTION" | "VOID" | "STOCK" | "AUDIT";
      title: string;
      description: string;
      actorName?: string;
      badgeText: string;
      badgeVariant: "default" | "destructive" | "outline" | "secondary";
      created_at: string | Date;
      extraInfo?: string;
    }> = [];

    transactions.forEach((tx) => {
      const isVoided = tx.status === "VOIDED";
      const studentName = tx.student
        ? `${tx.student.first_name} ${tx.student.last_name}`
        : "Student";

      if (isVoided) {
        list.push({
          id: `tx-void-${tx.id}`,
          categoryType: "VOID",
          title: `Voided Transaction AF# ${tx.af_number}`,
          description: `Transaction AF# ${tx.af_number} for ${studentName} was voided. Amount: ₱${Number(tx.total_amount).toFixed(2)}. ${tx.remarks ? `Remarks: ${tx.remarks}` : ""}`,
          actorName: tx.staff ? `${tx.staff.first_name} ${tx.staff.last_name}` : undefined,
          badgeText: "VOIDED TRANSACTION",
          badgeVariant: "destructive",
          created_at: tx.updated_at || tx.created_at,
          extraInfo: `AF# ${tx.af_number}`,
        });
      } else {
        list.push({
          id: `tx-${tx.id}`,
          categoryType: "TRANSACTION",
          title: `Payment Recorded AF# ${tx.af_number}`,
          description: `Issued AF# ${tx.af_number} for ${studentName} (${tx.student?.student_id || ""}). Total: ₱${Number(tx.total_amount).toFixed(2)}.`,
          actorName: tx.staff ? `${tx.staff.first_name} ${tx.staff.last_name}` : undefined,
          badgeText: "PAYMENT RECORDED",
          badgeVariant: "default",
          created_at: tx.created_at,
          extraInfo: `AF# ${tx.af_number}`,
        });
      }
    });

    stockLogs.forEach((log) => {
      const isAdd = log.action_type === "ADD" || log.quantity_change > 0;
      list.push({
        id: `stock-${log.id}`,
        categoryType: "STOCK",
        title: `Stock ${isAdd ? "Addition" : "Reduction"}: ${log.item?.name || "Item"}`,
        description: log.reason || "No remarks provided.",
        actorName: log.actor ? `${log.actor.first_name} ${log.actor.last_name}` : undefined,
        badgeText: `STOCK ${log.action_type} (${isAdd ? "+" : ""}${log.quantity_change})`,
        badgeVariant: isAdd ? "default" : "secondary",
        created_at: log.created_at,
        extraInfo: `Prev: ${log.previous_quantity} → New: ${log.new_quantity}`,
      });
    });

    auditLogs.forEach((audit) => {
      if (
        audit.log.includes("Voided payment transaction") ||
        audit.log.includes("Recorded payment transaction")
      ) {
        return;
      }
      list.push({
        id: `audit-${audit.id}`,
        categoryType: "AUDIT",
        title: audit.log,
        description: `Audit Log Level: ${audit.type.toUpperCase()}`,
        actorName: audit.user ? `${audit.user.first_name} ${audit.user.last_name}` : undefined,
        badgeText: audit.type.toUpperCase(),
        badgeVariant: audit.type === "warn" || audit.type === "error" ? "destructive" : "outline",
        created_at: audit.created_at,
      });
    });

    list.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return list;
  }, [stockLogs, auditLogs, transactions]);

  const filteredLogs = useMemo(() => {
    if (filter === "TRANSACTIONS") {
      return combinedLogs.filter(
        (l) => l.categoryType === "TRANSACTION" || l.categoryType === "VOID"
      );
    }
    if (filter === "STOCK") {
      return combinedLogs.filter((l) => l.categoryType === "STOCK");
    }
    if (filter === "AUDIT") {
      return combinedLogs.filter((l) => l.categoryType === "AUDIT");
    }
    return combinedLogs;
  }, [combinedLogs, filter]);

  return (
    <Card className="border shadow-xs">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              Payments & Stock Audit Logs
            </CardTitle>
            <CardDescription className="text-xs">
              Chronological audit feed of payment transactions, voided receipts, and stock adjustments.
            </CardDescription>
          </div>

          <div className="flex items-center gap-1 bg-data-grid-bg p-1 rounded-lg border border-input">
            <Button
              type="button"
              variant={filter === "ALL" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("ALL")}
              className="h-9 px-3 text-xs font-semibold"
            >
              All Logs ({combinedLogs.length})
            </Button>
            <Button
              type="button"
              variant={filter === "TRANSACTIONS" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("TRANSACTIONS")}
              className="h-9 px-3 text-xs font-semibold"
            >
              Transactions & Voids
            </Button>
            <Button
              type="button"
              variant={filter === "STOCK" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("STOCK")}
              className="h-9 px-3 text-xs font-semibold"
            >
              Stock Adjustments
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center border rounded-xl bg-card text-muted-foreground text-xs">
            No audit logs found for the selected category.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-xl border bg-card text-card-foreground shadow-xs space-y-2 text-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant={log.badgeVariant}
                        className="text-[10px] font-mono font-bold uppercase"
                      >
                        {log.badgeText}
                      </Badge>
                      <span className="font-bold text-sm text-foreground">
                        {log.title}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {log.description}
                    </p>
                  </div>

                  {log.extraInfo && (
                    <div className="text-right shrink-0">
                      <span className="font-mono text-xs font-bold text-foreground block">
                        {log.extraInfo}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t font-mono">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" /> By: {log.actorName || "System / Admin"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(log.created_at).toLocaleString([], {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
