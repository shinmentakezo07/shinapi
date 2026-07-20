// Streaming fallback for /dashboard/organization — header + form-style grid
// matches the resolved settings shell while data hydrates.
import { SkeletonHeader, SkeletonForm } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <SkeletonHeader hasAction />
      <SkeletonForm fields={6} columns={2} />
    </div>
  );
}
