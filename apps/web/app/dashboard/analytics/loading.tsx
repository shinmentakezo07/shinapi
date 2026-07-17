// /dashboard/analytics — AnalyticsClient shape: header, 6 spark KPIs,
// 4 sub-summary chips, 3 charts, heat strip, 2 charts, 2 panels, live feed, table.
import {
  SkeletonChart,
  SkeletonHeader,
  SkeletonStats,
  SkeletonTable,
} from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen pt-6 pb-12 px-4 sm:px-6 lg:px-8 bg-[#050505]">
      <div className="max-w-7xl mx-auto space-y-6">
        <SkeletonHeader hasAction />
        <SkeletonStats
          count={6}
          className="!grid-cols-2 sm:!grid-cols-3 lg:!grid-cols-6"
        />
        <SkeletonStats count={4} className="!grid-cols-2 lg:!grid-cols-4" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SkeletonChart height={340} />
          <SkeletonChart height={340} />
          <SkeletonChart height={340} />
        </div>
        <SkeletonChart height={140} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonChart height={290} />
          <SkeletonChart height={290} />
        </div>
        <SkeletonTable rows={8} cols={7} />
        <SkeletonTable rows={6} cols={4} />
      </div>
    </div>
  );
}
