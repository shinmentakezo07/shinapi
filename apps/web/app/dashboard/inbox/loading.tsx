// /dashboard/inbox — InboxPage shape (header + announcements section +
// messages section).
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="p-6 lg:p-10 space-y-6">
      {/* Header */}
      <div aria-hidden="true" className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton className="h-7 w-24" />
        </div>
      </div>

      {/* Announcements section header */}
      <div aria-hidden="true" className="space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-44" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              aria-hidden="true"
              className="bg-[#0A0A0A] border border-blue-500/20 rounded-xl p-4 flex items-start gap-3"
            >
              <Skeleton className="h-5 w-5 mt-0.5 rounded" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-12 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 pt-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-20" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            aria-hidden="true"
            className="bg-[#0A0A0A] border border-white/5 rounded-xl p-4 flex items-start gap-3"
          >
            <Skeleton className="h-5 w-5 mt-0.5 rounded" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-2 w-2 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-44" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
