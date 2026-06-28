// /dashboard/chat — Page header + ChatPlayground split layout
// (sessions sidebar + main message surface + input bar). Uses the ChatPlayground
// surface area as a tall filled block so streaming UI inherits from the
// existing component once data lands.
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen pt-24 px-4 pb-8 relative overflow-hidden">
      {/* Page header */}
      <div aria-hidden="true" className="max-w-7xl mx-auto mb-6 space-y-2">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Chat workspace shell */}
      <div
        aria-hidden="true"
        className="max-w-7xl mx-auto w-full h-[calc(100vh-140px)] flex gap-4 p-4"
      >
        {/* Sidebar (sessions list) */}
        <div className="hidden md:flex flex-col gap-4 shrink-0 w-[320px] bg-[#0A0A0A]/90 border border-white/5 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-7 rounded-lg" />
          </div>
          <div className="p-2 flex-1 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-2 rounded-xl"
              >
                <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-1.5 min-w-0">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-2 w-20" />
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-white/5 space-y-3">
            <Skeleton className="h-2 w-24" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-2.5 w-full" />
              ))}
            </div>
          </div>
        </div>

        {/* Main panel */}
        <div className="flex-1 flex flex-col overflow-hidden relative border border-white/10 shadow-2xl bg-[#050505]/80 rounded-2xl">
          {/* Header bar */}
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-black/60">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-xl flex-shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-2.5 w-32" />
              </div>
            </div>
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>

          {/* Empty-state welcome surface */}
          <div className="flex-1 flex items-center justify-center px-8">
            <div className="text-center space-y-6 max-w-xl w-full">
              <Skeleton className="h-14 w-14 rounded-2xl mx-auto" />
              <div className="space-y-2">
                <Skeleton className="h-7 w-40 mx-auto" />
                <Skeleton className="h-4 w-72 mx-auto" />
                <Skeleton className="h-4 w-64 mx-auto" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2"
                  >
                    <Skeleton className="h-7 w-7 rounded-lg" />
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-2 w-24" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Input bar */}
          <div className="p-4 bg-black/40 border-t border-white/5">
            <div className="flex items-end gap-2 max-w-4xl mx-auto w-full">
              <Skeleton className="flex-1 h-14 rounded-2xl" />
              <Skeleton className="h-14 w-14 rounded-2xl flex-shrink-0" />
            </div>
            <div className="flex justify-center items-center gap-3 mt-3">
              <Skeleton className="h-2.5 w-14" />
              <Skeleton className="h-2.5 w-16" />
              <Skeleton className="h-2.5 w-14" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
