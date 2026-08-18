import { Skeleton } from "@/components/ui/skeleton";

export default function AttendanceLogsLoading() {
  return (
    <main className="w-full space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56 sm:w-72" />
        <Skeleton className="h-4 w-80 sm:w-96" />
      </div>

      <div className="p-6 rounded-xl border bg-card space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-13.5 w-full sm:w-64 rounded-lg" />
        </div>

        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl border bg-card space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
              <Skeleton className="h-4 w-64" />
              <div className="flex items-center justify-between pt-2 border-t text-xs">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
