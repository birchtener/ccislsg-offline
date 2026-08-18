import { Skeleton } from "@/components/ui/skeleton";

export default function LostFoundLoading() {
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

      <div className="flex gap-2">
        <Skeleton className="h-13.5 w-40 rounded-lg" />
        <Skeleton className="h-13.5 w-40 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-4 rounded-xl border bg-card space-y-3">
            <Skeleton className="h-40 w-full rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
