// /dashboard/billing — BillingPage shape (header, current plan card, promo
// input card, 3 credit package cards, payment methods card).
import {
  Skeleton,
  SkeletonCard,
  SkeletonGrid,
  SkeletonHeader,
} from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="p-6 lg:p-10 space-y-8">
      <SkeletonHeader hasAction />

      {/* Current Plan card */}
      <div
        aria-hidden="true"
        className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 space-y-2"
      >
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Promo code card */}
      <div
        aria-hidden="true"
        className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 space-y-3"
      >
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-44" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 flex-1 max-w-xs rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
      </div>

      {/* Credit packages — 3 column grid */}
      <div className="space-y-4">
        <Skeleton className="h-5 w-40" />
        <SkeletonGrid
          count={3}
          cardClassName="!h-[260px] flex flex-col justify-between"
        />
      </div>

      {/* Payment methods card */}
      <div
        aria-hidden="true"
        className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 space-y-3"
      >
        <Skeleton className="h-5 w-44" />
        <SkeletonCard
          className="!p-3 !rounded-lg"
          showFooter={false}
          theme="default"
        />
      </div>
    </div>
  );
}
