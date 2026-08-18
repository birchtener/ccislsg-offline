"use client";

import React, { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/features/auth/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  RefreshCw,
  HelpCircle,
  PackageCheck,
  ArchiveX,
} from "lucide-react";

import { LostFoundItemWithImages, LostFoundStatus } from "../types/lost-found";
import { LostFoundCard } from "./lost-found-card";
import { AddEditLostFoundDrawer } from "./add-edit-lost-found-drawer";
import { LostFoundDetailDrawer } from "./lost-found-detail-drawer";

interface LostFoundDashboardClientProps {
  initialItems: LostFoundItemWithImages[];
}

export function LostFoundDashboardClient({
  initialItems = [],
}: LostFoundDashboardClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { data: session } = authClient.useSession();
  const permissions: string[] = session?.user?.permissions ?? [];

  const canCreate = permissions.includes("lost-found:create");
  const canUpdate = permissions.includes("lost-found:update");
  const canDelete = permissions.includes("lost-found:delete");

  // State
  const [activeTab, setActiveTab] = useState<LostFoundStatus>(
    LostFoundStatus.UNCLAIMED,
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Drawer states
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<LostFoundItemWithImages | null>(
    null,
  );
  const [itemToView, setItemToView] = useState<LostFoundItemWithImages | null>(
    null,
  );

  // Filter items by active tab and search query
  const filteredItems = useMemo(() => {
    return initialItems.filter((item) => {
      // Tab filter
      if (item.status !== activeTab) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(query);
        const matchDesc = item.description?.toLowerCase().includes(query);
        const matchLocation = item.location_found
          ?.toLowerCase()
          .includes(query);
        const matchClaimedBy = item.claimed_by?.toLowerCase().includes(query);

        return matchTitle || matchDesc || matchLocation || matchClaimedBy;
      }

      return true;
    });
  }, [initialItems, activeTab, searchQuery]);

  const unclaimedCount = useMemo(
    () =>
      initialItems.filter((i) => i.status === LostFoundStatus.UNCLAIMED).length,
    [initialItems],
  );

  const claimedCount = useMemo(
    () =>
      initialItems.filter((i) => i.status === LostFoundStatus.CLAIMED).length,
    [initialItems],
  );

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div className="w-full space-y-6 text-left">
      {/* Top Header Controls (Payments Layout Standard) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Left Side Search */}
        <div className="relative w-full sm:w-80">
          <Input
            placeholder="Search lost items..."
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

          {canCreate && (
            <Button
              type="button"
              onClick={() => {
                setItemToEdit(null);
                setAddDrawerOpen(true);
              }}
              className="h-13.5 px-4 font-semibold text-xs sm:text-sm gap-2 flex-1 sm:flex-initial"
            >
              <Plus className="w-4 h-4" /> Add Lost Item
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Container (Shadcn Standard h-13.5) */}
      <Tabs
        value={activeTab}
        onValueChange={(val: any) => setActiveTab(val as LostFoundStatus)}
        className="w-full space-y-6"
      >
        <TabsList className="md:w-lg w-full">
          <TabsTrigger value={LostFoundStatus.UNCLAIMED}>
            Unclaimed Items{" (" + unclaimedCount + ")"}
          </TabsTrigger>

          <TabsTrigger value={LostFoundStatus.CLAIMED}>
            Claimed Archive {" (" + claimedCount + ")"}
          </TabsTrigger>
        </TabsList>

        {/* Grid Container */}
        {filteredItems.length === 0 ? (
          <div className="w-full border border-dashed rounded-xl p-12 text-center flex flex-col items-center justify-center gap-3 bg-card">
            <HelpCircle className="w-12 h-12 text-muted-foreground/40" />
            <div className="space-y-1">
              <h3 className="font-bold text-lg">No Items Found</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                No lost & found items match your search filter (
                {activeTab.toLowerCase()}).
              </p>
            </div>
            {canCreate && activeTab === LostFoundStatus.UNCLAIMED && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setItemToEdit(null);
                  setAddDrawerOpen(true);
                }}
                className="mt-2 gap-1.5 text-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Report First Item
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map((item) => (
              <LostFoundCard
                key={item.id}
                item={item}
                onViewDetails={(item) => setItemToView(item)}
              />
            ))}
          </div>
        )}
      </Tabs>

      {/* Add / Edit Item Drawer */}
      <AddEditLostFoundDrawer
        isOpen={addDrawerOpen}
        onClose={() => {
          setAddDrawerOpen(false);
          setItemToEdit(null);
        }}
        itemToEdit={itemToEdit}
        onSuccess={handleRefresh}
      />

      {/* Detail View Drawer */}
      <LostFoundDetailDrawer
        isOpen={Boolean(itemToView)}
        onClose={() => setItemToView(null)}
        item={itemToView}
        onEdit={(item) => {
          setItemToEdit(item);
          setAddDrawerOpen(true);
        }}
        onRefresh={handleRefresh}
        canUpdate={canUpdate}
        canDelete={canDelete}
      />
    </div>
  );
}
