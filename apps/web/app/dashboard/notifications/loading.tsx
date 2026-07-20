// Streaming fallback for /dashboard/notifications — mirrors the resolved
// header + KPI strip + list rows so users never see a spinner flash.
import { SkeletonHeader, SkeletonList } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <SkeletonHeader hasAction />
      <SkeletonList rows={8} withBadge />
    </div>
  );
}
