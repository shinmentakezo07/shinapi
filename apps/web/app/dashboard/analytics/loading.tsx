// /dashboard/analytics — AnalyticsClient shape (header, 4 metrics, daily chart
// + pie chart, hourly + latency chart, model breakdown table).
import { SkeletonChart, SkeletonHeader, SkeletonStats, SkeletonTable } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen pt-6 pb-12 px-4 sm:px-6 lg:px-8 bg-[#050505]">
      <div className="max-w-7xl mx-auto space-y-8">
        <SkeletonHeader hasAction />
        <SkeletonStats count={4} className="!grid-cols-1 sm:!grid-cols-2 lg:!grid-cols-4" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <SkeletonChart height={300} />
          <SkeletonChart height={300} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <SkeletonChart height={250} />
          <SkeletonChart height={250} />
        </div>
        <SkeletonTable rows={6} cols={4} />
      </div>
    </div>
  );
}
