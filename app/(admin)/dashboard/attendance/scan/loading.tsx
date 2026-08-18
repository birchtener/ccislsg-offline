import { Skeleton } from "@/components/ui/skeleton";

export default function AttendanceScanLoading() {
  return (
    <main className="w-full space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56 sm:w-72" />
        <Skeleton className="h-4 w-80 sm:w-96" />
      </div>

      <div className="max-w-md mx-auto p-6 rounded-xl border bg-card space-y-4">
        <Skeleton className="h-6 w-48 mx-auto" />
        <Skeleton className="aspect-square w-full rounded-xl" />
        <Skeleton className="h-13.5 w-full rounded-lg" />
      </div>
    </main>
  );
}
