import { Skeleton } from "@/components/ui/skeleton";

export default function MasterListLoading() {
  return (
    <main className="w-full space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 sm:w-64" />
        <Skeleton className="h-4 w-72 sm:w-96" />
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Skeleton className="h-13.5 w-full sm:w-80 rounded-lg" />
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Skeleton className="h-13.5 w-13.5 rounded-lg shrink-0" />
          <Skeleton className="h-13.5 flex-1 sm:w-44 rounded-lg" />
        </div>
      </div>

      <div className="w-full space-y-3">
        <div className="hidden md:block border rounded-xl bg-card overflow-hidden">
          <div className="h-13.5 border-b px-4 flex items-center gap-4 bg-muted/20">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-13.5 border-b px-4 flex items-center gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>

        <div className="block md:hidden space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl border bg-card space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24 font-mono" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t text-xs">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
