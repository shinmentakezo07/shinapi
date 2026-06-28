// /dashboard/fine-tuning — FineTuningPage shape (header + 1/3 new-job form
// panel + 2/3 jobs list panel).
import { Skeleton, SkeletonForm, SkeletonList } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="p-6 lg:p-10 space-y-6">
      {/* Header */}
      <div aria-hidden="true" className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-6 rounded" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-80" />
          </div>
        </div>
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>

      {/* Form (left) + jobs list (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SkeletonForm fields={3} className="lg:col-span-1" theme="default" />

        {/* Jobs list panel */}
        <div
          aria-hidden="true"
          className="lg:col-span-2 rounded-xl border border-white/5 bg-white/[0.02]"
        >
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
          <SkeletonList rows={5} className="!bg-transparent !border-0 [&>*]:!bg-transparent [&>*]:!border-0" />
        </div>
      </div>
    </div>
  );
}
