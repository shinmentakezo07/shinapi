// /dashboard/admin — user-facing admin dashboard (different from /admin/(protected)/dashboard).
// Layout: header + 3 stat tiles + 2 cards (provider health, circuit breakers)
// + users table with pagination.
import { Skeleton, SkeletonList, SkeletonStats, SkeletonTable } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="p-6 lg:p-10 space-y-8">
      {/* Header */}
      <div aria-hidden="true" className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton className="h-7 w-44" />
        </div>
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>

      {/* Stats grid */}
      <SkeletonStats count={3} />

      {/* Two-column cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          aria-hidden="true"
          className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 w-36" />
          </div>
          <SkeletonList rows={3} className="!bg-transparent [&>*]:!bg-transparent [&>*]:!border-0 [&>*]:!p-0" />
        </div>
        <div
          aria-hidden="true"
          className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 w-36" />
          </div>
          <SkeletonList rows={3} className="!bg-transparent [&>*]:!bg-transparent [&>*]:!border-0 [&>*]:!p-0" />
        </div>
      </div>

      {/* Users table + pagination */}
      <SkeletonTable rows={6} cols={4} />
      <div aria-hidden="true" className="flex items-center justify-between pt-2">
        <Skeleton className="h-8 w-24 rounded" />
        <div className="flex items-center gap-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-8 rounded" />
          ))}
        </div>
        <Skeleton className="h-8 w-20 rounded" />
      </div>
    </div>
  );
}
