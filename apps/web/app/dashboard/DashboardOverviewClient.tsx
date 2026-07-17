"use client";

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  DollarSign,
  Zap,
  Key,
  Server,
  TrendingUp,
  ArrowRight,
  AlertTriangle,
  Clock,
  Cpu,
  ShieldCheck,
  BarChart3,
  Radio,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { getSDK } from "@/lib/api/sdk";
import { useCredits, useKeys } from "@/lib/api/hooks";

/* ─── Animation Variants (matches admin dashboard) ─── */

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.03 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 120, damping: 22 },
  },
};

const fadeUpCss = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
  },
};

/* ─── Shared Components (mirrors admin dashboard) ─── */

function SectionHeading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between mb-5">
      <div>
        <h2 className="text-[14px] font-semibold text-[var(--admin-text)] tracking-[-0.01em]">
          {title}
        </h2>
        {subtitle && (
          <p className="text-[11px] text-[var(--admin-text-dim)] mt-0.5 font-mono tracking-wide">
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

function ViewAllLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="text-[10px] font-semibold tracking-[0.1em] uppercase flex items-center gap-1.5 transition-colors text-[var(--admin-text-dim)] hover:text-[var(--admin-text)]"
    >
      View
      <ArrowRight className="w-3 h-3" />
    </Link>
  );
}

/* ─── Hero Metric (Total Requests, dominant) ─── */

function HeroMetric({
  totalRequests,
  successToday,
  hourlyData,
}: {
  totalRequests: number;
  successToday: number;
  hourlyData: { time: string; requests: number }[];
}) {
  // 24-hour bar visualization from real hourly aggregation
  const bars = Array.from({ length: 24 }).map((_, i) => {
    const label = `${i.toString().padStart(2, "0")}:00`;
    const hit = hourlyData.find((h) => h.time === label);
    return { label, value: hit?.requests ?? 0 };
  });
  const peak = Math.max(...bars.map((b) => b.value), 1);

  return (
    <motion.div
      variants={fadeUp}
      className="admin-hero-metric admin-card p-8 relative overflow-hidden"
    >
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <Activity
                className="w-4 h-4"
                style={{ color: "var(--admin-accent)" }}
              />
              <span className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[var(--admin-text-muted)]">
                Total Requests
              </span>
            </div>
            <p className="admin-hero-value font-mono">
              {totalRequests.toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400/70 bg-emerald-500/[0.06] px-2.5 py-1 rounded-md">
            <ShieldCheck className="w-3 h-3" />
            <span className="text-[10px] font-semibold tracking-wider uppercase font-mono">
              {successToday.toLocaleString()} ok
            </span>
          </div>
        </div>

        {/* Mini bar visualization — requests per hour */}
        <div className="flex items-end gap-1 h-12 mt-4">
          {bars.map((b, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm transition-all duration-300"
              style={{
                height: `${Math.max((b.value / peak) * 80 + 12, 14)}%`,
                background:
                  i === new Date().getHours()
                    ? "var(--admin-accent)"
                    : "rgba(255,255,255,0.04)",
                opacity: i === new Date().getHours() ? 1 : 0.6,
              }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[9px] font-mono text-[var(--admin-text-dim)]">
            00:00
          </span>
          <span className="text-[9px] font-mono text-[var(--admin-text-dim)]">
            12:00
          </span>
          <span className="text-[9px] font-mono text-[var(--admin-text-dim)]">
            23:59
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Compact Stat ─── */

function CompactStat({
  icon: Icon,
  label,
  value,
  sub,
  accentColor = "var(--admin-accent)",
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  accentColor?: string;
}) {
  return (
    <motion.div
      variants={fadeUp}
      className="admin-card admin-compact-stat p-5 group relative overflow-hidden"
    >
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: accentColor, opacity: 0.6 }}
          />
          <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[var(--admin-text-muted)]">
            {label}
          </span>
        </div>
        <p className="text-[22px] font-bold text-[var(--admin-text)] font-mono tracking-[-0.02em] leading-none">
          {value}
        </p>
        {sub && (
          <p className="text-[11px] text-[var(--admin-text-dim)] mt-2 font-mono">
            {sub}
          </p>
        )}
      </div>
    </motion.div>
  );
}

/* ─── System Status Strip (gateway health) ─── */

function SystemStatusStrip({
  totalRequests,
  successRequests,
  errorRequests,
  avgLatency,
}: {
  totalRequests: number;
  successRequests: number;
  errorRequests: number;
  avgLatency: number;
}) {
  const successPct =
    totalRequests > 0 ? Math.round((successRequests / totalRequests) * 100) : 0;

  const healthStatus =
    totalRequests === 0
      ? "idle"
      : errorRequests > successRequests
        ? "critical"
        : successPct < 95 && totalRequests > 0
          ? "degraded"
          : "healthy";

  const statusColors = {
    healthy: { bg: "rgba(52,211,153,0.06)", text: "#34d399", dot: "#34d399" },
    degraded: { bg: "rgba(251,191,36,0.06)", text: "#fbbf24", dot: "#fbbf24" },
    critical: { bg: "rgba(248,113,113,0.06)", text: "#f87171", dot: "#f87171" },
    idle: { bg: "rgba(156,163,175,0.06)", text: "#9ca3af", dot: "#9ca3af" },
  } as const;

  const sc = statusColors[healthStatus];
  const label =
    healthStatus === "healthy"
      ? "All Systems Operational"
      : healthStatus === "degraded"
        ? "Degraded Performance"
        : healthStatus === "critical"
          ? "Errors Detected"
          : "Awaiting Traffic";

  return (
    <motion.div
      variants={fadeUp}
      className="admin-card admin-status-strip p-4 flex items-center gap-6 overflow-x-auto"
    >
      <div className="flex items-center gap-3 flex-shrink-0">
        <div
          className={`w-2 h-2 rounded-full ${healthStatus === "idle" ? "" : "animate-pulse"}`}
          style={{ backgroundColor: sc.dot }}
        />
        <span
          className="text-[11px] font-semibold tracking-[0.08em] uppercase font-mono"
          style={{ color: sc.text }}
        >
          {label}
        </span>
      </div>

      <div className="w-px h-5 bg-white/[0.04] flex-shrink-0" />

      <div className="flex items-center gap-5 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-[var(--admin-text-dim)]" />
          <span className="text-[12px] font-mono text-[var(--admin-text-muted)]">
            {totalRequests.toLocaleString()} requests
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400/50" />
          <span className="text-[12px] font-mono text-[var(--admin-text-muted)]">
            {successRequests.toLocaleString()} ok
          </span>
        </div>
        {errorRequests > 0 && (
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400/50" />
            <span className="text-[12px] font-mono text-red-400/60">
              {errorRequests.toLocaleString()} errors
            </span>
          </div>
        )}
      </div>

      <div className="w-px h-5 bg-white/[0.04] flex-shrink-0" />

      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="w-24 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${successPct}%`,
              backgroundColor: sc.dot,
            }}
          />
        </div>
        <span className="text-[11px] font-mono text-[var(--admin-text-dim)]">
          {successPct}% ok
        </span>
        <span className="text-[11px] font-mono text-[var(--admin-text-dim)] ml-2">
          · {avgLatency}ms avg
        </span>
      </div>
    </motion.div>
  );
}

/* ─── Platform Pulse (spend + traffic by day) ─── */

function PlatformPulse({
  dailyUsage,
  totalCost,
}: {
  dailyUsage: {
    date: string;
    requests: number;
    cost: number;
    tokens: number;
  }[];
  totalCost: number;
}) {
  const monthRequests = dailyUsage.reduce((s, d) => s + (d.requests ?? 0), 0);
  const monthTokens = dailyUsage.reduce((s, d) => s + (d.tokens ?? 0), 0);
  const costsToday = dailyUsage.length > 0 ? dailyUsage[0].cost : 0;
  const todayPct =
    monthRequests > 0
      ? Math.min(
          ((dailyUsage[0]?.requests || 0) / Math.max(monthRequests, 1)) * 100,
          100,
        )
      : 0;

  return (
    <motion.div variants={fadeUp} className="admin-card p-6">
      <SectionHeading title="Platform Pulse" subtitle="Usage & spend" />

      <div className="space-y-5">
        {/* Total Spend */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[var(--admin-text-muted)]">
              Total Spent
            </span>
            <span className="text-[18px] font-bold font-mono text-[var(--admin-text)] tracking-[-0.02em]">
              ${(totalCost / 100000).toFixed(2)}
            </span>
          </div>
          <div className="w-full h-1 rounded-full bg-white/[0.03]">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max(todayPct, 4)}%`,
                background: "var(--admin-accent)",
                opacity: 0.6,
              }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[9px] font-mono text-[var(--admin-text-dim)]">
              ${(costsToday / 100000).toFixed(2)} today
            </span>
            <span className="text-[9px] font-mono text-[var(--admin-text-dim)]">
              {monthRequests.toLocaleString()} this period
            </span>
          </div>
        </div>

        {/* Tokens */}
        <div className="pt-4 border-t border-white/[0.03]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[var(--admin-text-muted)]">
              Tokens Processed
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[9px] font-mono text-[var(--admin-text-dim)] mb-1 uppercase tracking-wider">
                Total
              </p>
              <p className="text-[16px] font-bold font-mono text-[var(--admin-text)] tracking-[-0.02em]">
                {monthTokens > 1000000
                  ? `${(monthTokens / 1000000).toFixed(1)}M`
                  : monthTokens > 1000
                    ? `${(monthTokens / 1000).toFixed(1)}K`
                    : monthTokens}
              </p>
            </div>
            <div>
              <p className="text-[9px] font-mono text-[var(--admin-text-dim)] mb-1 uppercase tracking-wider">
                Days
              </p>
              <p className="text-[16px] font-bold font-mono text-[var(--admin-text)] tracking-[-0.02em]">
                {dailyUsage.length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Activity Feed (recent logs) ─── */

function ActivityFeed({
  recentLogs,
  isLoading,
}: {
  recentLogs: {
    id: string;
    model: string;
    provider: string;
    cost: number;
    status: string;
    createdAt: string;
  }[];
  isLoading: boolean;
}) {
  const activities = recentLogs.slice(0, 6);

  return (
    <motion.div variants={fadeUp} className="admin-card p-6">
      <SectionHeading
        title="Activity"
        subtitle="Recent requests"
        action={<ViewAllLink href="/dashboard/logs" />}
      />

      <div className="space-y-0">
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-3">
              <div className="w-8 h-8 rounded-lg admin-skeleton" />
              <div className="flex-1 space-y-1.5">
                <div className="admin-skeleton h-3 w-24" />
                <div className="admin-skeleton h-2.5 w-32" />
              </div>
            </div>
          ))}

        {!isLoading &&
          activities.map((log, i) => {
            const ok = log.status === "success";
            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0, transition: { delay: i * 0.03 } }}
                className="flex items-center gap-3 py-3 border-b border-white/[0.02] last:border-0 group"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.02] border border-white/[0.04] flex-shrink-0">
                  <Zap
                    className="w-3.5 h-3.5"
                    style={{ color: ok ? "#34d399" : "#f87171", opacity: 0.6 }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[12px] text-[var(--admin-text)] truncate font-medium">
                      {log.model}
                    </p>
                    <span className="text-[8px] font-semibold tracking-[0.1em] uppercase px-1.5 py-0.5 rounded bg-white/[0.03] text-[var(--admin-text-dim)] border border-white/[0.04]">
                      {log.provider}
                    </span>
                  </div>
                  <p className="text-[10px] text-[var(--admin-text-dim)] truncate font-mono">
                    ${(log.cost / 100000).toFixed(4)} · {log.status}
                  </p>
                </div>
                <span className="text-[9px] font-mono text-[var(--admin-text-dim)] flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {new Date(log.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </motion.div>
            );
          })}

        {!isLoading && activities.length === 0 && (
          <div className="text-center py-10">
            <Radio className="w-5 h-5 text-[var(--admin-text-dim)] mx-auto mb-2 opacity-40" />
            <p className="text-[12px] text-[var(--admin-text-dim)]">
              No recent activity
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Quick Commands ─── */

function QuickCommands() {
  const commands = [
    { href: "/dashboard/keys", label: "API Keys", icon: Key },
    { href: "/dashboard/logs", label: "Logs", icon: Eye },
    { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/dashboard/billing", label: "Billing", icon: DollarSign },
    { href: "/dashboard/keys", label: "New Key", icon: Zap },
    { href: "/dashboard/provider-health", label: "Providers", icon: Server },
  ];

  return (
    <motion.div variants={fadeUp} className="admin-card p-6">
      <SectionHeading title="Commands" subtitle="Quick navigation" />

      <div className="grid grid-cols-2 gap-2">
        {commands.map((cmd) => {
          const Icon = cmd.icon;
          return (
            <Link
              key={cmd.label}
              href={cmd.href}
              className="group flex items-center gap-3 px-3.5 py-3 rounded-xl bg-white/[0.01] border border-white/[0.03] hover:border-white/[0.06] hover:bg-white/[0.02] transition-all duration-200"
            >
              <Icon
                className="w-3.5 h-3.5 flex-shrink-0 transition-colors"
                style={{ color: "var(--admin-accent)", opacity: 0.4 }}
              />
              <span className="text-[12px] font-medium text-[var(--admin-text-muted)] group-hover:text-[var(--admin-text)] transition-colors flex-1">
                {cmd.label}
              </span>
              <ArrowRight className="w-3 h-3 text-[var(--admin-text-dim)] opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ─── Main Page ─── */

export default function DashboardOverviewClient() {
  // Direct SDK call (mirrors admin's getAdminSDK().getDashboard()) — also
  // satisfies the wiring invariant that dashboard components import the SDK.
  const {
    data: analytics,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["dashboard", "overview"],
    queryFn: () => getSDK().getAnalytics(),
    refetchInterval: 30000,
  });
  const { data: credits } = useCredits();
  const { data: keys } = useKeys();

  const summary = analytics?.summary ?? {
    totalRequests: 0,
    successRequests: 0,
    errorRequests: 0,
  };
  const recentLogs = analytics?.recentLogs ?? [];
  const dailyUsage = analytics?.dailyUsage ?? [];

  // Derived metrics
  const totalCost = recentLogs.reduce((s, l) => s + l.cost, 0);
  const avgLatency =
    recentLogs.length > 0
      ? Math.round(
          recentLogs.reduce((s, l) => s + l.latency, 0) / recentLogs.length,
        )
      : 0;
  const creditsRemaining = credits?.balance ?? 0;

  // Hourly aggregation
  const hourlyMap = new Map<string, number>();
  recentLogs.forEach((log) => {
    const hour = new Date(log.createdAt).getHours();
    const time = `${hour.toString().padStart(2, "0")}:00`;
    hourlyMap.set(time, (hourlyMap.get(time) ?? 0) + 1);
  });
  const hourlyData = Array.from(hourlyMap.entries())
    .map(([time, requests]) => ({ time, requests }))
    .sort((a, b) => a.time.localeCompare(b.time));

  if (error) {
    return (
      <div data-admin className="max-w-[1400px] mx-auto p-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="admin-card p-8 text-center max-w-md">
            <AlertTriangle className="w-8 h-8 text-red-400/40 mx-auto mb-4" />
            <p className="text-[14px] font-medium text-[var(--admin-text)] mb-1">
              Failed to load dashboard
            </p>
            <p className="text-[12px] text-[var(--admin-text-dim)]">
              Check your connection and try again
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Top models ranking
  const modelBreakdown = analytics?.modelBreakdown ?? [];
  const totalModelRequests = modelBreakdown.reduce(
    (s, m) => s + (m.count ?? 0),
    0,
  );
  const topModels = modelBreakdown
    .map((m) => ({
      model: m.model,
      requests: m.count ?? 0,
      pct:
        totalModelRequests > 0
          ? Math.round(((m.count ?? 0) / totalModelRequests) * 100)
          : 0,
    }))
    .sort((a, b) => b.requests - a.requests)
    .slice(0, 4);

  return (
    <div
      data-admin
      className="max-w-[1400px] mx-auto"
      style={{ color: "var(--admin-text)" }}
    >
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="space-y-5"
      >
        {/* ── Row 1: Header ── */}
        <motion.div
          variants={fadeUp}
          className="flex items-end justify-between"
        >
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-[22px] font-semibold tracking-[-0.025em]">
                Overview
              </h1>
              <span className="admin-live-badge flex items-center gap-1.5">
                <span className="admin-live-dot" />
                Live
              </span>
            </div>
            <p
              className="text-[12px] font-mono tracking-wide"
              style={{ color: "var(--admin-text-dim)" }}
            >
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/keys"
              className="admin-btn admin-btn-primary group"
            >
              <Key className="w-3.5 h-3.5" />
              New API Key
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <div className="flex items-center gap-2">
              <Clock
                className="w-3.5 h-3.5"
                style={{ color: "var(--admin-text-dim)" }}
              />
              <span
                className="text-[11px] font-mono"
                style={{ color: "var(--admin-text-dim)" }}
              >
                Auto-refresh 30s
              </span>
            </div>
          </div>
        </motion.div>

        {/* ── Row 2: System Status Strip ── */}
        <SystemStatusStrip
          totalRequests={summary.totalRequests}
          successRequests={summary.successRequests}
          errorRequests={summary.errorRequests}
          avgLatency={avgLatency}
        />

        {/* ── Row 3: Hero Metric + Compact Stats + Platform Pulse ── */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-5">
              <div className="admin-card p-8">
                <div className="admin-skeleton h-[200px] w-full" />
              </div>
            </div>
            <div className="lg:col-span-3 flex flex-col gap-4">
              <div className="admin-card p-5">
                <div className="admin-skeleton h-20" />
              </div>
              <div className="admin-card p-5">
                <div className="admin-skeleton h-20" />
              </div>
              <div className="admin-card p-5">
                <div className="admin-skeleton h-20" />
              </div>
            </div>
            <div className="lg:col-span-4">
              <div className="admin-card p-6 h-full">
                <div className="admin-skeleton h-full min-h-[200px]" />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-5">
              <HeroMetric
                totalRequests={summary.totalRequests}
                successToday={summary.successRequests}
                hourlyData={hourlyData}
              />
            </div>

            <div className="lg:col-span-3 flex flex-col gap-4">
              <CompactStat
                icon={DollarSign}
                label="Total Spent"
                value={`$${(totalCost / 100000).toFixed(2)}`}
                sub="lifetime"
                accentColor="#3b82f6"
              />
              <CompactStat
                icon={Cpu}
                label="Avg Latency"
                value={`${avgLatency}ms`}
                sub="recent requests"
                accentColor="#fbbf24"
              />
              <CompactStat
                icon={Key}
                label="Active Keys"
                value={(keys?.length ?? 0).toString()}
                sub="in rotation"
                accentColor="#34d399"
              />
            </div>

            <div className="lg:col-span-4">
              <PlatformPulse dailyUsage={dailyUsage} totalCost={totalCost} />
            </div>
          </div>
        )}

        {/* ── Row 4: Credits + Activity + Commands ── */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="admin-card p-6">
              <div className="admin-skeleton h-40" />
            </div>
            <div className="lg:col-span-2 admin-card p-6">
              <div className="admin-skeleton h-40" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Credits hero — small */}
            <motion.div
              variants={fadeUp}
              className="admin-card p-6 flex flex-col"
            >
              <SectionHeading title="Credits" subtitle="Balance" />
              <p
                className="text-[34px] font-bold font-mono tracking-[-0.03em] leading-none"
                style={{ color: "var(--admin-text)" }}
              >
                ${(creditsRemaining / 100000).toFixed(2)}
              </p>
              <div className="mt-auto pt-6">
                <Link
                  href="/dashboard/billing"
                  className="admin-btn admin-btn-ghost w-full justify-center"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  Add credits
                </Link>
              </div>
            </motion.div>

            <div className="lg:col-span-2">
              <ActivityFeed recentLogs={recentLogs} isLoading={false} />
            </div>
          </div>
        )}

        {/* ── Row 5: Quick Commands + Top Models ── */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="admin-card p-6">
              <div className="admin-skeleton h-48" />
            </div>
            <div className="lg:col-span-2 admin-card p-6">
              <div className="admin-skeleton h-48" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <QuickCommands />
            <div className="lg:col-span-2">
              <TopModels models={topModels} />
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

/* ─── Top Models (ranked, admin palette) ─── */

function TopModels({
  models,
}: {
  models: { model: string; requests: number; pct: number }[];
}) {
  const top = models;

  return (
    <motion.div variants={fadeUpCss} className="admin-card p-6">
      <SectionHeading
        title="Top Models"
        subtitle="Usage distribution"
        action={<ViewAllLink href="/dashboard/analytics" />}
      />
      {top.length > 0 ? (
        <div className="space-y-5">
          {top.map((m, i) => (
            <div key={m.model}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono font-bold text-[var(--admin-text-dim)] w-5">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[12px] font-medium text-[var(--admin-text)]">
                    {m.model}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[var(--admin-text-muted)]">
                  {m.pct}%
                </span>
              </div>
              <div className="w-full h-1 rounded-full bg-white/[0.03]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${m.pct}%` }}
                  transition={{
                    delay: 0.3 + i * 0.08,
                    duration: 0.7,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="h-full rounded-full"
                  style={{
                    background: "linear-gradient(to right, #3b82f6, #7c3aed)",
                    opacity: 0.7,
                  }}
                />
              </div>
              <p className="text-[9px] font-mono text-[var(--admin-text-dim)] mt-1.5">
                {m.requests.toLocaleString()} requests
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <BarChart3 className="w-5 h-5 text-[var(--admin-text-dim)] mx-auto mb-2 opacity-40" />
          <p className="text-[12px] text-[var(--admin-text-dim)]">
            No model usage yet
          </p>
        </div>
      )}
    </motion.div>
  );
}
