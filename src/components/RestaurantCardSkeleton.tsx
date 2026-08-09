import { Skeleton } from "@/components/ui/skeleton";

export default function RestaurantCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <Skeleton className="h-40 w-full rounded-none" />
      <div className="p-4">
        <Skeleton className="h-5 w-3/5" />
        <Skeleton className="mt-2 h-4 w-2/5" />
        <Skeleton className="mt-3 h-4 w-4/5" />
        <div className="mt-4 flex gap-2">
          <Skeleton className="h-10 flex-1 rounded-full" />
          <Skeleton className="h-10 flex-1 rounded-full" />
        </div>
      </div>
    </div>
  );
}
