import { Skeleton } from "@/components/ui/skeleton";

export default function SystemAuditLogsLoading() {
  return (
    <main className="w-full space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 sm:w-64" />
        <Skeleton className="h-4 w-72 sm:w-96" />
      </div>

      <div className="p-6 rounded-xl border bg-card space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-13.5 w-full sm:w-80 rounded-lg" />
        </div>

        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl border bg-card space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-24 rounded-full" />
                  <Skeleton className="h-5 w-64" />
                </div>
                <Skeleton className="h-4 w-28" />
              </div>
              <div className="flex items-center justify-between pt-2 border-t text-xs">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
