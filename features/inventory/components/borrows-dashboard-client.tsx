"use client";

import { useState, useTransition, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, Search, QrCode } from "lucide-react";
import { BorrowReturnDrawer } from "./borrow-return-drawer";
import { BorrowsTable } from "./borrows-table";

interface BorrowsDashboardClientProps {
  initialData: {
    borrows: any[];
  };
}

export function BorrowsDashboardClient({
  initialData,
}: BorrowsDashboardClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [deskOpen, setDeskOpen] = useState(false);

  const handleRefresh = useCallback(() => {
    startTransition(() => {
      router.refresh();
    });
  }, [router]);

  const filteredBorrows = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return initialData.borrows.filter((borrow) => {
      const studentName = borrow.student
        ? `${borrow.student.first_name} ${borrow.student.last_name}`
        : "";
      const borrowerName = borrow.borrower
        ? `${borrow.borrower.first_name} ${borrow.borrower.last_name}`
        : "";
      return (
        borrow.item.name.toLowerCase().includes(query) ||
        (borrow.asset &&
          borrow.asset.asset_tag.toLowerCase().includes(query)) ||
        studentName.toLowerCase().includes(query) ||
        borrowerName.toLowerCase().includes(query) ||
        (borrow.remarks && borrow.remarks.toLowerCase().includes(query))
      );
    });
  }, [initialData.borrows, searchQuery]);

  return (
    <div className="w-full space-y-6 text-left">
      {/* Top Header Controls (Payments Standard) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Left Side Search */}
        <div className="relative w-full sm:w-80">
          <Input
            placeholder="Search borrow records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-4 pr-10 h-13.5 text-sm"
          />
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>

        {/* Right Side Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
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
            onClick={() => setDeskOpen(true)}
            className="h-13.5 px-4 font-semibold text-xs sm:text-sm gap-2 flex-1 sm:flex-initial"
          >
            <QrCode className="h-4 w-4" />
            Borrow & Return
          </Button>
        </div>
      </div>

      <BorrowsTable
        borrows={initialData.borrows}
        filteredBorrows={filteredBorrows}
      />

      <BorrowReturnDrawer
        open={deskOpen}
        onOpenChange={setDeskOpen}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
