import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <main className="w-full space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-44 sm:w-56" />
        <Skeleton className="h-4 w-64 sm:w-80" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl border bg-card flex flex-col items-center text-center space-y-4">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-36 mx-auto" />
            <Skeleton className="h-4 w-48 mx-auto" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>

        <div className="lg:col-span-2 p-6 rounded-xl border bg-card space-y-5">
          <Skeleton className="h-6 w-40" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-13.5 w-full rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-13.5 w-full rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-13.5 w-full rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-13.5 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
