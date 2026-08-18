"use client";

import { useState, useTransition, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FolderTree,
  Plus,
  RefreshCw,
  Search,
  Boxes,
  Download,
} from "lucide-react";
import { CategoriesTable } from "./categories-table";
import { AddEditCategoryDrawer } from "./add-edit-category-drawer";
import { ExportInventoryDialog } from "./export-inventory-dialog";

interface CategoriesDashboardClientProps {
  categories: any[];
}

export function CategoriesDashboardClient({
  categories,
}: CategoriesDashboardClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<any | null>(null);

  const handleRefresh = useCallback(() => {
    startTransition(() => {
      router.refresh();
    });
  }, [router]);

  const filteredCategories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return categories.filter((cat) => {
      if (q) {
        const matchesName = cat.name.toLowerCase().includes(q);
        const matchesDesc = cat.description?.toLowerCase().includes(q) || false;
        return matchesName || matchesDesc;
      }
      return true;
    });
  }, [categories, searchQuery]);

  const totalCount = categories.length;
  const totalAssignedItems = categories.reduce(
    (sum, c) => sum + (c._count?.inventory_items || 0),
    0,
  );

  return (
    <div className="w-full space-y-6 text-left">
      {/* Stats Cards (Top Most) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <Card className="border-1! shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Categories
            </CardTitle>
            <FolderTree className="h-4.5 w-4.5 text-primary shrink-0" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-black">{totalCount}</div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Active inventory classifications
            </p>
          </CardContent>
        </Card>

        <Card className="border-1! shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Categorized Items
            </CardTitle>
            <Boxes className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-black">{totalAssignedItems}</div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Inventory items assigned across categories
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Header Controls (Payments Standard) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Left Side Search */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Input
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-4 pr-10 h-13.5 text-sm"
            />
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
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
              setCategoryToEdit(null);
              setAddOpen(true);
            }}
            className="h-13.5 px-4 font-semibold text-xs sm:text-sm gap-2 flex-1 sm:flex-initial"
          >
            <Plus className="size-4" />
            Add Category
          </Button>
        </div>
      </div>

      <CategoriesTable
        categories={filteredCategories}
        onRefresh={handleRefresh}
        onEdit={(cat) => {
          setCategoryToEdit(cat);
          setAddOpen(true);
        }}
      />

      <AddEditCategoryDrawer
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) setCategoryToEdit(null);
        }}
        categoryToEdit={categoryToEdit}
        onSuccess={handleRefresh}
      />

      <ExportInventoryDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        categories={categories}
      />
    </div>
  );
}
