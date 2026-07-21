// /dashboard/keys — KeysClient shape: aurora header + 3 stat tiles + search
// bar + key cards.
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="relative min-h-screen pt-6 pb-12 px-4 sm:px-6 lg:px-8 bg-[#050505] overflow-hidden">
      {/* Ambient aurora placeholder */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-0"
      >
        <div className="absolute -top-40 -left-32 w-[36rem] h-[36rem] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute top-1/3 -right-32 w-[28rem] h-[28rem] rounded-full bg-fuchsia-500/10 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 w-[24rem] h-[24rem] rounded-full bg-cyan-500/[0.08] blur-[120px]" />
      </div>

      <div className="relative max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div aria-hidden="true" className="relative">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Skeleton className="h-10 w-10 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-8 w-44" />
                <Skeleton className="h-4 w-72" />
              </div>
            </div>
            <Skeleton className="h-11 w-44 rounded-xl" />
          </div>
          <div
            aria-hidden="true"
            className="mt-6 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
          />
        </div>

        {/* Stat strip */}
        <div
          aria-hidden="true"
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0A0A0A]/80 p-4"
            >
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-16 mt-3" />
            </div>
          ))}
        </div>

        {/* Search toolbar */}
        <div aria-hidden="true" className="flex">
          <Skeleton className="h-11 flex-1 rounded-xl" />
        </div>

        {/* Key cards */}
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              aria-hidden="true"
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#0C0C0C] to-[#080808] p-5 sm:p-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1 space-y-3 min-w-0">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="flex-1 h-9 rounded-lg" />
                    <Skeleton className="h-9 w-9 rounded-lg" />
                    <Skeleton className="h-9 w-9 rounded-lg" />
                  </div>
                  <div className="flex gap-4">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
                <Skeleton className="h-9 w-9 rounded-lg flex-shrink-0" />
              </div>
            </div>
          ))}
        </div>

        {/* Info banner */}
        <div
          aria-hidden="true"
          className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] flex items-start gap-3"
        >
          <Skeleton className="h-9 w-9 rounded-lg flex-shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      </div>
    </div>
  );
}
