import { Skeleton } from "@/components/ui/skeleton";

export default function FeedbackLoading() {
  return (
    <main className="w-full space-y-6 text-left">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 sm:w-64" />
        <Skeleton className="h-4 w-72 sm:w-96" />
      </div>

      <div className="border border-dashed p-12 text-center rounded-lg bg-background flex flex-col items-center justify-center space-y-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
    </main>
  );
}
