import { Skeleton } from "@/components/ui/skeleton";

export default function InventoryCategoriesLoading() {
  return (
    <main className="w-full space-y-6 text-left">
      {/* Page Title */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 sm:w-64" />
        <Skeleton className="h-4 w-72 sm:w-96" />
      </div>

      {/* Stats Cards (Top-Most) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="p-4 rounded-xl border bg-card shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-4 w-4 rounded-sm" />
            </div>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-2.5 w-44" />
          </div>
        ))}
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Skeleton className="h-13.5 w-full sm:w-80 rounded-lg" />
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Skeleton className="h-13.5 px-4 flex-1 sm:w-32 rounded-lg" />
          <Skeleton className="h-13.5 w-13.5 rounded-lg shrink-0" />
          <Skeleton className="h-13.5 flex-1 sm:w-36 rounded-lg" />
        </div>
      </div>

      {/* Table & Mobile Cards */}
      <div className="w-full space-y-3">
        {/* Desktop Table View */}
        <div className="hidden md:block border rounded-xl bg-card overflow-hidden">
          <div className="h-13.5 border-b px-4 flex items-center gap-4 bg-muted/20">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-20 ml-auto" />
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-13.5 border-b px-4 flex items-center gap-4">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-4 w-52" />
              <Skeleton className="h-8 w-8 rounded-md ml-auto" />
            </div>
          ))}
        </div>

        {/* Mobile Compact Cards List View */}
        <div className="block md:hidden space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl border bg-card shadow-xs space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24 rounded-full" />
                </div>
                <Skeleton className="h-8 w-8 rounded-md shrink-0" />
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
