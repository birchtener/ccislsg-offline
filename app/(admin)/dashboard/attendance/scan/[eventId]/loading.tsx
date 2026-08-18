import { Skeleton } from "@/components/ui/skeleton";

export default function AttendanceScanEventLoading() {
  return (
    <main className="w-full space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-60 sm:w-80" />
        <Skeleton className="h-4 w-72 sm:w-96" />
      </div>

      <div className="max-w-md mx-auto p-6 rounded-xl border bg-card space-y-4">
        <Skeleton className="h-6 w-52 mx-auto" />
        <Skeleton className="aspect-square w-full rounded-xl" />
        <Skeleton className="h-13.5 w-full rounded-lg" />
      </div>
    </main>
  );
}
