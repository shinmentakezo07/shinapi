// /admin/(protected)/* — Admin shell skeleton. The protected layout adds
// the top bar (server-rendered) and sidebar (client-side). This skeleton
// matches the page content area beneath those.
import { Skeleton, SkeletonGrid, SkeletonHeader, SkeletonList, SkeletonStats } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="space-y-6">
      {/* Page header band */}
      <SkeletonHeader theme="admin" />

      {/* KPI strip + 2-column content blocks */}
      <SkeletonStats count={3} theme="admin" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SkeletonList theme="admin" rows={4} withBadge />
        <SkeletonList theme="admin" rows={4} withBadge />
      </div>
      <SkeletonGrid count={3} theme="admin" />
    </div>
  );
}
