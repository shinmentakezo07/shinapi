// /admin/(protected)/dashboard — admin dashboard-specific skeleton (hero
// metric + status strip + compact stats + activities + commands).
// AdminDashboardSkeleton is itself a SkeletonRoot (with role/aria-busy
// announcement), so we don't wrap it here.
import { AdminDashboardSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return <AdminDashboardSkeleton />;
}
