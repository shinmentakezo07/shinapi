// /dashboard/battle — ModelBattlePage shape (header, model selection strip,
// prompt input, 4-up response columns).
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="p-6 lg:p-10 space-y-6">
      {/* Header */}
      <div aria-hidden="true" className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-6 rounded" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>

      {/* Model selection strip */}
      <div
        aria-hidden="true"
        className="rounded-xl border border-white/5 bg-white/[0.02] p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-4 w-44" />
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-24 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Prompt area */}
      <div
        aria-hidden="true"
        className="rounded-xl border border-white/5 bg-white/[0.02] p-4"
      >
        <Skeleton className="h-20 w-full rounded-lg" />
        <div className="flex items-center justify-between mt-3">
          <Skeleton className="h-3 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Response grid (4 columns expected) */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            aria-hidden="true"
            className="rounded-xl border border-white/5 bg-white/[0.02] flex flex-col min-h-[280px]"
          >
            {/* Model name + status */}
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            {/* Metrics row */}
            <div className="px-4 py-2 flex items-center gap-4 border-b border-white/5">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-12" />
            </div>
            {/* Body */}
            <div className="flex-1 p-4 space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-11/12" />
              <Skeleton className="h-3 w-10/12" />
              <Skeleton className="h-3 w-9/12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
