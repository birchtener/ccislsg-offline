import { Skeleton } from "@/components/ui/skeleton";

export default function InventoryItemsLoading() {
  return (
    <main className="w-full space-y-6 text-left">
      {/* Page Title */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 sm:w-64" />
        <Skeleton className="h-4 w-72 sm:w-96" />
      </div>

      {/* Top-Most Stats Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-3 sm:p-4 rounded-xl border bg-card shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-4 rounded-sm" />
            </div>
            <Skeleton className="h-7 w-12" />
            <Skeleton className="h-2.5 w-28" />
          </div>
        ))}
      </div>

      {/* Control Bar (Search + Category + Actions) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Skeleton className="h-13.5 w-full sm:w-80 rounded-lg" />
          <Skeleton className="h-13.5 w-full sm:w-56 rounded-lg" />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Skeleton className="h-13.5 px-4 flex-1 sm:w-32 rounded-lg" />
          <Skeleton className="h-13.5 w-13.5 rounded-lg shrink-0" />
          <Skeleton className="h-13.5 flex-1 sm:w-32 rounded-lg" />
        </div>
      </div>

      {/* Horizontal Tabs Skeleton */}
      <div className="w-full overflow-x-auto pb-1.5 scrollbar-none">
        <div className="flex gap-2 w-max">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-13.5 w-24 sm:w-28 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Items Table & Mobile Compact Cards */}
      <div className="w-full space-y-3">
        {/* Desktop Table View */}
        <div className="hidden md:block border rounded-xl bg-card overflow-hidden">
          <div className="h-13.5 border-b px-4 flex items-center gap-4 bg-muted/20">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24 ml-auto" />
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-13.5 border-b px-4 flex items-center gap-4">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-md ml-auto" />
            </div>
          ))}
        </div>

        {/* Mobile Compact Cards List View */}
        <div className="block md:hidden space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl border bg-card shadow-xs space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-20 rounded-md" />
                    <Skeleton className="h-5 w-24 rounded-md" />
                  </div>
                  <Skeleton className="h-4 w-40" />
                </div>
                <Skeleton className="h-8 w-8 rounded-md shrink-0" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t text-xs">
                <div className="space-y-1">
                  <Skeleton className="h-3 w-14" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
