"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Skeleton primitive library.
 *
 * Two themes:
 *  - "default" — dashboard `bg-white/5` + `motion-safe:animate-pulse` (used on
 *    /dashboard/* routes).
 *  - "admin"   — uses the existing `.admin-skeleton` class (admin shimmer
 *    keyframe, 1.8s) for /admin/(protected)/* routes.
 *
 * All primitives render inside a `<div aria-busy="true" aria-live="polite">`
 * with `aria-hidden="true"` on inner blocks so screen readers announce
 * "Loading…" without trying to parse empty div content.
 */

export type SkeletonTheme = "default" | "admin";

const themeClasses: Record<
  SkeletonTheme,
  { base: string; soft: string; strong: string; ring: string }
> = {
  default: {
    base: "bg-white/5 motion-safe:animate-pulse",
    soft: "bg-white/[0.03]",
    strong: "bg-white/10",
    ring: "border border-white/5",
  },
  admin: {
    // `admin-skeleton` keyframe is defined globally in apps/web/app/globals.css
    // and handles its own prefers-reduced-motion override.
    base: "admin-skeleton",
    soft: "bg-white/[0.02]",
    strong: "bg-white/[0.04]",
    ring: "border border-[var(--admin-border)]",
  },
};

function useTheme(theme: SkeletonTheme = "default") {
  return themeClasses[theme];
}

interface SkeletonProps {
  className?: string;
  theme?: SkeletonTheme;
  children?: ReactNode;
  style?: React.CSSProperties;
}

/** Base animated block. */
export function Skeleton({ className, theme = "default", children, style }: SkeletonProps) {
  const t = useTheme(theme);
  return (
    <div
      aria-hidden="true"
      className={cn("rounded-md", t.base, className)}
      style={style}
    >
      {children}
    </div>
  );
}

/** Container that wraps a composition. Announces to screen readers. */
export function SkeletonRoot({
  children,
  className,
  theme,
  label,
  style,
}: {
  children: ReactNode;
  className?: string;
  theme?: SkeletonTheme;
  label?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label={label ?? "Loading"}
      className={className}
      style={style}
    >
      {children}
    </div>
  );
}

/** Header band: title block + subtitle block + optional right-side action block. */
export function SkeletonHeader({
  hasAction = false,
  theme = "default",
  className,
}: {
  hasAction?: boolean;
  theme?: SkeletonTheme;
  className?: string;
}) {
  const t = useTheme(theme);
  return (
    <SkeletonRoot theme={theme} className={cn("space-y-2", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton theme={theme} className="h-9 w-9 rounded-lg" />
          <div className="space-y-2">
            <Skeleton theme={theme} className="h-7 w-48" />
            <Skeleton theme={theme} className="h-4 w-72" />
          </div>
        </div>
        {hasAction && <Skeleton theme={theme} className="h-9 w-28 rounded-lg" />}
      </div>
    </SkeletonRoot>
  );
}

/** A standard dashboard card: 32px hero block + 3 text lines. */
export function SkeletonCard({
  theme = "default",
  className,
  showFooter = false,
}: {
  theme?: SkeletonTheme;
  className?: string;
  showFooter?: boolean;
}) {
  const t = useTheme(theme);
  return (
    <div
      aria-hidden="true"
      className={cn(
        "rounded-3xl p-6",
        theme === "default"
          ? "bg-[#0A0A0A] border border-white/10"
          : "admin-card",
        className,
      )}
    >
      <Skeleton theme={theme} className="h-32 rounded-2xl mb-4" />
      <div className="space-y-3">
        <Skeleton theme={theme} className="h-4 w-3/4" />
        <Skeleton theme={theme} className="h-4 w-1/2" />
        {showFooter && <Skeleton theme={theme} className="h-10 rounded mt-4" />}
      </div>
    </div>
  );
}

/** Horizontal pipeline of KPI tiles (Used on /admin/(protected)/dashboard). */
export function SkeletonStats({
  count = 3,
  theme = "default",
  className,
}: {
  count?: number;
  theme?: SkeletonTheme;
  className?: string;
}) {
  const t = useTheme(theme);
  return (
    <SkeletonRoot
      theme={theme}
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6",
        className,
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          aria-hidden="true"
          className={cn(
            "p-6 rounded-xl",
            theme === "default"
              ? "bg-[#0A0A0A] border border-white/10"
              : "admin-card",
          )}
        >
          <div className="flex items-center gap-3 mb-3">
            <Skeleton theme={theme} className="h-2 w-2 rounded-full" />
            <Skeleton theme={theme} className="h-3 w-20" />
          </div>
          <Skeleton theme={theme} className="h-7 w-24 mb-2" />
          <Skeleton theme={theme} className="h-3 w-16" />
        </div>
      ))}
    </SkeletonRoot>
  );
}

/** Vertical stack of list rows with title + subtitle + right badge. */
export function SkeletonList({
  rows = 5,
  theme = "default",
  className,
  withBadge = false,
}: {
  rows?: number;
  theme?: SkeletonTheme;
  className?: string;
  withBadge?: boolean;
}) {
  const t = useTheme(theme);
  return (
    <SkeletonRoot theme={theme} className={cn("space-y-3", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          aria-hidden="true"
          className={cn(
            "p-4 rounded-xl flex items-center gap-4",
            theme === "default"
              ? "bg-[#0A0A0A] border border-white/10"
              : "admin-card",
          )}
        >
          <Skeleton theme={theme} className="h-10 w-10 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2 min-w-0">
            <Skeleton theme={theme} className="h-3.5 w-48" />
            <Skeleton theme={theme} className="h-2.5 w-72" />
          </div>
          {withBadge && <Skeleton theme={theme} className="h-6 w-16 rounded-md" />}
        </div>
      ))}
    </SkeletonRoot>
  );
}

/** Table-shaped skeleton: column headers + `rows` of cells. */
export function SkeletonTable({
  rows = 6,
  cols = 5,
  theme = "default",
  className,
}: {
  rows?: number;
  cols?: number;
  theme?: SkeletonTheme;
  className?: string;
}) {
  const t = useTheme(theme);
  return (
    <SkeletonRoot
      theme={theme}
      className={cn(
        theme === "default"
          ? "bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden"
          : "admin-table",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          "p-4 border-b",
          theme === "default"
            ? "border-white/[0.04]"
            : "border-white/[0.02]",
        )}
      >
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} theme={theme} className="h-2.5 flex-1" />
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          aria-hidden="true"
          className={cn(
            "flex items-center gap-4 px-4 py-3.5 border-b last:border-0",
            theme === "default"
              ? "border-white/[0.03]"
              : "border-white/[0.015]",
          )}
        >
          <Skeleton theme={theme} className="h-3 flex-1" />
          <Skeleton theme={theme} className="h-3 w-24 hidden sm:block" />
          <Skeleton theme={theme} className="h-5 w-16 rounded-md" />
        </div>
      ))}
    </SkeletonRoot>
  );
}

/** Vertical form skeleton: labelled inputs + action row. */
export function SkeletonForm({
  fields = 4,
  theme = "default",
  className,
  columns = 1,
}: {
  fields?: number;
  theme?: SkeletonTheme;
  className?: string;
  columns?: 1 | 2;
}) {
  const t = useTheme(theme);
  return (
    <SkeletonRoot
      theme={theme}
      className={cn(
        "p-6 rounded-xl space-y-5",
        theme === "default"
          ? "bg-[#0A0A0A] border border-white/10"
          : "admin-card",
        className,
      )}
    >
      {Array.from({ length: fields }).map((_, i) => (
        <div
          key={i}
          aria-hidden="true"
          className={cn(
            "space-y-2",
            columns === 2 && i % 2 === 0 && "sm:col-span-1",
          )}
        >
          <Skeleton theme={theme} className="h-3 w-24" />
          <Skeleton theme={theme} className="h-10 w-full rounded-lg" />
        </div>
      ))}
      <div className="flex justify-end gap-2 pt-2">
        <Skeleton theme={theme} className="h-9 w-20 rounded" />
        <Skeleton theme={theme} className="h-9 w-28 rounded" />
      </div>
    </SkeletonRoot>
  );
}

/** Large chart / hero area. */
export function SkeletonChart({
  height = 300,
  theme = "default",
  className,
  title,
}: {
  height?: number;
  theme?: SkeletonTheme;
  className?: string;
  title?: string;
}) {
  const t = useTheme(theme);
  return (
    <div
      aria-hidden="true"
      className={cn(
        "p-6 rounded-xl",
        theme === "default"
          ? "bg-[#0A0A0A] border border-white/10"
          : "admin-card",
        className,
      )}
      style={{ minHeight: height + 80 }}
    >
      <div className="flex items-center justify-between mb-6">
        <Skeleton theme={theme} className="h-5 w-40" />
        <Skeleton theme={theme} className="h-4 w-12" />
      </div>
      <Skeleton
        theme={theme}
        className="w-full rounded-lg"
        style={{ height: `${height}px` }}
      />
    </div>
  );
}

/** Generic centroid loader — preserved for fallback / illegible-shape cases. */
export function SkeletonCenter({
  label = "Loading",
  theme = "default",
  minHeight = 400,
}: {
  label?: string;
  theme?: SkeletonTheme;
  minHeight?: number;
}) {
  const t = useTheme(theme);
  return (
    <SkeletonRoot
      theme={theme}
      label={label}
      className="flex items-center justify-center"
      style={{ minHeight: `${minHeight}px` }}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="relative h-8 w-8">
          <div
            className={cn(
              "absolute inset-0 rounded-full border",
              theme === "default"
                ? "border-white/10"
                : "border-[var(--admin-border)]",
            )}
          />
          <div
            className={cn(
              "absolute inset-0 rounded-full border-2 border-transparent animate-spin",
              theme === "default"
                ? "border-t-indigo-500"
                : "border-t-indigo-400/50",
            )}
          />
        </div>
        <p
          className={cn(
            "text-[11px] font-mono tracking-[0.14em] uppercase",
            theme === "default"
              ? "text-gray-400"
              : "text-[var(--admin-text-dim)]",
          )}
        >
          {label}
        </p>
      </div>
    </SkeletonRoot>
  );
}

/* ─────────────────────── Composed Page Skeletons ─────────────────────── */

/** /dashboard — overview (header + 3 stats + progress + 3 cards). */
export function DashboardOverviewSkeleton() {
  return (
    <SkeletonRoot className="max-w-6xl mx-auto p-6 space-y-8">
      <SkeletonHeader hasAction />
      <SkeletonStats count={3} />
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <SkeletonList rows={2} />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <SkeletonGrid count={3} />
      </div>
    </SkeletonRoot>
  );
}

/** /admin/(protected)/* — admin sidebar/topbar placeholder + content shell. */
export function AdminShellSkeleton({
  children,
}: {
  children?: ReactNode;
}) {
  return (
    <SkeletonRoot theme="admin" className="space-y-5">
      <div aria-hidden="true" className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton theme="admin" className="h-7 w-44" />
          <Skeleton theme="admin" className="h-3 w-32" />
        </div>
        <Skeleton theme="admin" className="h-8 w-28 rounded" />
      </div>
      <SkeletonList theme="admin" rows={6} withBadge />
      {children}
    </SkeletonRoot>
  );
}

/** /admin/(protected)/dashboard — hero metric + status strip + grid. */
export function AdminDashboardSkeleton() {
  return (
    <SkeletonRoot theme="admin" className="space-y-5">
      {/* Header */}
      <div aria-hidden="true" className="flex items-end justify-between">
        <div className="space-y-2">
          <Skeleton theme="admin" className="h-7 w-44" />
          <Skeleton theme="admin" className="h-3 w-64" />
        </div>
        <Skeleton theme="admin" className="h-4 w-32" />
      </div>
      {/* Status strip */}
      <div aria-hidden="true" className="admin-card p-4">
        <Skeleton theme="admin" className="h-8 w-full" />
      </div>
      {/* Hero + grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div aria-hidden="true" className="lg:col-span-5 admin-hero-metric admin-card p-8">
          <Skeleton theme="admin" className="h-[200px] w-full" />
        </div>
        <div className="lg:col-span-3 flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} aria-hidden="true" className="admin-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Skeleton theme="admin" className="h-2 w-2 rounded-full" />
                <Skeleton theme="admin" className="h-3 w-20" />
              </div>
              <Skeleton theme="admin" className="h-6 w-24" />
              <Skeleton theme="admin" className="h-3 w-12 mt-2" />
            </div>
          ))}
        </div>
        <div aria-hidden="true" className="lg:col-span-4 admin-card p-6">
          <Skeleton theme="admin" className="h-[200px] w-full" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div aria-hidden="true" className="lg:col-span-2 admin-card p-6">
          <Skeleton theme="admin" className="h-4 w-32 mb-4" />
          <SkeletonList theme="admin" rows={4} />
        </div>
        <div aria-hidden="true" className="admin-card p-6">
          <Skeleton theme="admin" className="h-4 w-32 mb-4" />
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3.5 py-3 rounded-xl border border-white/[0.03]">
                <Skeleton theme="admin" className="h-3.5 w-3.5" />
                <Skeleton theme="admin" className="h-3 flex-1" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </SkeletonRoot>
  );
}

/** Generic grid of card-sized blocks. */
export function SkeletonGrid({
  count = 3,
  theme = "default",
  className,
  cardClassName,
}: {
  count?: number;
  theme?: SkeletonTheme;
  className?: string;
  cardClassName?: string;
}) {
  return (
    <SkeletonRoot
      theme={theme}
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
        className,
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} theme={theme} className={cardClassName} />
      ))}
    </SkeletonRoot>
  );
}
