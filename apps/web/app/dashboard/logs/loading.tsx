// /dashboard/logs — LogsClient shape (terminal/dark, filter strip + log feed
// rows). Preserves the dark terminal aesthetic with mono-feeling bars.
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#020202] flex flex-col">
      <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div
          aria-hidden="true"
          className="flex items-center justify-between gap-4"
        >
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
        </div>

        {/* Filter strip */}
        <div
          aria-hidden="true"
          className="flex flex-wrap gap-2 border-b border-white/[0.04] pb-3"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-20 rounded" />
          ))}
        </div>

        {/* Log feed — terminal-style rows */}
        <div className="rounded-2xl border border-white/[0.04] bg-white/[0.015] divide-y divide-white/[0.025]">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              aria-hidden="true"
              className="px-4 py-3 font-mono flex items-center gap-4"
            >
              <Skeleton className="h-3 w-20 bg-white/10" />
              <Skeleton className="h-3 w-16 bg-white/10" />
              <Skeleton className="h-3 w-24 bg-white/10" />
              <Skeleton className="h-3 flex-1 bg-white/[0.03]" />
              <Skeleton className="h-5 w-14 rounded-md bg-white/[0.04]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
