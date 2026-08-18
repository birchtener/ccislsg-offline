import { Skeleton } from "@/components/ui/skeleton";

export default function AttendanceLoading() {
  return (
    <main className="w-full space-y-6">
      <div className="space-y-2">
        <div className="flex gap-3 items-center">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-5 w-96" />
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Skeleton className="h-11 w-full sm:w-80 rounded-lg" />
        <div className="flex gap-2 w-full sm:w-auto">
          <Skeleton className="h-11 w-24 rounded-lg" />
          <Skeleton className="h-11 w-32 rounded-lg" />
        </div>
      </div>

      <div className="border border-border rounded-xl bg-card overflow-hidden">
        <div className="grid grid-cols-5 p-4 border-b border-border bg-muted/20">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20 justify-self-end" />
        </div>

        <div className="divide-y divide-border">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="grid grid-cols-5 p-4 items-center">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-5 w-24" />
              <div className="justify-self-end flex gap-2">
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
