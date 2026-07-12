"use client";

import { useState, useEffect, type SVGProps } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Key,
  BarChart3,
  DollarSign,
  Zap,
  TrendingUp,
  ArrowRight,
  Braces,
  Gauge,
  AlertCircle,
  Clock,
} from "lucide-react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAnalytics, useCredits, useKeys } from "@/lib/api/hooks";

/* ------------------------------------------------------------------ */
/*  Utilities                                                          */
/* ------------------------------------------------------------------ */

function CostDisplay({ cost }: { cost: number }) {
  const dollars = cost / 100000;
  if (dollars < 0.01)
    return <span className="text-emerald-400/60">&lt;$0.01</span>;
  return <span>${dollars.toFixed(dollars < 1 ? 4 : 2)}</span>;
}

/* ------------------------------------------------------------------ */
/*  Enhanced Metric Card — Intentional Minimalism                     */
/*  Purpose: Present data with clinical precision and subtle depth.   */
/* ------------------------------------------------------------------ */

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: React.ElementType;
  accent: string;
  index: number;
}

function MetricCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  accent,
  index,
}: MetricCardProps) {
  const changeColors = {
    positive: "text-emerald-400",
    negative: "text-red-400",
    neutral: "text-slate-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.05,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="group relative"
    >
      {/* Ambient glow on hover */}
      <div
        className={`absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl ${accent.replace(
          "from-",
          "bg-"
        )}`}
      />

      <div
        className="relative h-full flex flex-col justify-between p-5 rounded-2xl border border-white/[0.06] bg-[#0A0A0A] overflow-hidden
          hover:border-white/[0.12] transition-all duration-300"
      >
        {/* Top edge sheen */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Top row: icon + change */}
        <div className="flex items-start justify-between mb-4">
          <div
            className={`p-2.5 rounded-xl bg-gradient-to-br ${accent} border border-white/[0.04]`}
          >
            <Icon className="w-5 h-5 text-white/90" />
          </div>
          {change && (
            <span
              className={`text-[11px] font-mono font-medium ${changeColors[changeType]}`}
            >
              {change}
            </span>
          )}
        </div>

        {/* Value */}
        <div className="mt-auto">
          <div className="text-2xl font-bold text-white tracking-tight font-mono tabular-nums">
            {value}
          </div>
          <p className="text-[11px] text-slate-500 uppercase tracking-[0.1em] font-medium mt-1.5">
            {title}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Enhanced Status Badge                                               */
/* ------------------------------------------------------------------ */

interface StatusBadgeProps {
  status: "success" | "error" | "warning" | "info";
  label: string;
  size?: "sm" | "md" | "lg";
}

function StatusBadge({ status, label, size = "sm" }: StatusBadgeProps) {
  const styles = {
    success: {
      bg: "bg-emerald-500/8",
      text: "text-emerald-400",
      border: "border-emerald-500/15",
      pulse: "bg-emerald-400",
    },
    error: {
      bg: "bg-red-500/8",
      text: "text-red-400",
      border: "border-red-500/15",
      pulse: "bg-red-400",
    },
    warning: {
      bg: "bg-amber-500/8",
      text: "text-amber-400",
      border: "border-amber-500/15",
      pulse: "bg-amber-400",
    },
    info: {
      bg: "bg-blue-500/8",
      text: "text-blue-400",
      border: "border-blue-500/15",
      pulse: "bg-blue-400",
    },
  };

  const s = styles[status];
  const sizes = {
    sm: "text-[10px] px-2 py-0.5 gap-1.5",
    md: "text-xs px-2.5 py-1 gap-1.5",
    lg: "text-sm px-3 py-1.5 gap-2",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border font-mono font-semibold uppercase tracking-wider ${s.bg} ${s.text} ${s.border} ${sizes[size]}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${s.pulse} ${status === "success" ? "animate-pulse" : ""}`}
      />
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Custom Chart Tooltip                                                */
/* ------------------------------------------------------------------ */

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  unit?: string;
}

function CustomTooltip({
  active,
  payload,
  label,
  unit,
}: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-[#0c0c0e]/95 backdrop-blur-xl border border-white/[0.08] rounded-xl p-3 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
      <p className="text-[11px] text-slate-400 font-mono mb-2 uppercase tracking-wider">
        {label}
      </p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm font-mono text-white">
            {entry.value}
            {unit}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Dashboard                                                      */
/* ------------------------------------------------------------------ */

export default function DashboardOverviewClient() {
  const {
    data: analytics,
    isLoading: analyticsLoading,
    error: analyticsError,
  } = useAnalytics();
  const { data: credits, isLoading: creditsLoading } = useCredits();
  const { data: keys, isLoading: keysLoading } = useKeys();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const loading = analyticsLoading || creditsLoading || keysLoading;
  const error = analyticsError ? (analyticsError as Error).message : null;

  const summary = analytics?.summary ?? {
    totalRequests: 0,
    successRequests: 0,
    errorRequests: 0,
  };
  const recentLogs = analytics?.recentLogs ?? [];
  const modelBreakdown = analytics?.modelBreakdown ?? [];
  const dailyUsage = analytics?.dailyUsage ?? [];

  // Derive metrics
  const totalCost = recentLogs.reduce((sum, log) => sum + log.cost, 0);
  const avgLatency =
    recentLogs.length > 0
      ? Math.round(
          recentLogs.reduce((sum, log) => sum + log.latency, 0) /
            recentLogs.length,
        )
      : 0;
  const successRate =
    summary.totalRequests > 0
      ? ((summary.successRequests / summary.totalRequests) * 100).toFixed(1)
      : "0.0";
  const creditsRemaining = credits?.balance ?? 0;

  // Hourly aggregation for the requests chart
  const hourlyMap = new Map<
    string,
    { requests: number; latency: number; count: number }
  >();
  recentLogs.forEach((log) => {
    const hour = new Date(log.createdAt).getHours();
    const time = `${hour.toString().padStart(2, "0")}:00`;
    const existing = hourlyMap.get(time) ?? {
      requests: 0,
      latency: 0,
      count: 0,
    };
    hourlyMap.set(time, {
      requests: existing.requests + 1,
      latency: existing.latency + log.latency,
      count: existing.count + 1,
    });
  });
  const hourlyData = Array.from(hourlyMap.entries())
    .map(([time, data]) => ({
      time,
      requests: data.requests,
      latency: Math.round(data.latency / data.count),
    }))
    .sort((a, b) => a.time.localeCompare(b.time));

  // Top models
  const totalModelRequests = modelBreakdown.reduce(
    (sum, m) => sum + (m.count ?? 0),
    0,
  );
  const topModels = modelBreakdown
    .map((m) => ({
      model: m.model,
      requests: m.count ?? 0,
      percentage:
        totalModelRequests > 0
          ? Math.round(((m.count ?? 0) / totalModelRequests) * 100)
          : 0,
    }))
    .sort((a, b) => b.requests - a.requests)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-[#050505] relative isolate">
      {/* ── Ambient background layers ── */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {/* Large soft orbs */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-500/[0.03] rounded-full blur-[120px] animate-mesh-shift" />
        <div className="absolute -top-40 right-1/4 w-[500px] h-[500px] bg-violet-500/[0.025] rounded-full blur-[100px] animate-mesh-shift" style={{ animationDelay: "-5s" }} />
        {/* Noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.015] "
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative px-4 sm:px-6 lg:px-8 pt-10 pb-20 max-w-[88rem] mx-auto">
        {/* ── Header ── */}
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-white tracking-tight">
                Overview
              </h1>
              <span className="hidden sm:inline-block h-4 w-px bg-white/10" />
              <span className="text-[11px] text-slate-500 font-mono tracking-wider uppercase">
                {mounted
                  ? new Date().toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "—"}
              </span>
            </div>
            <p className="text-sm text-slate-500 max-w-md">
              Real-time API performance and usage at a glance.
            </p>
          </div>

          <Link
            href="/dashboard/keys"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm font-medium text-white
              hover:bg-white/[0.06] hover:border-white/[0.15] transition-all duration-200 group shrink-0"
          >
            <Key className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
            New API Key
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </Link>
        </motion.header>

        {/* ── Loading / Error States ── */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-40"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-10 h-10">
                  <div className="absolute inset-0 border-2 border-white/5 rounded-full" />
                  <div className="absolute inset-0 border-2 border-transparent border-t-indigo-500 rounded-full animate-spin" />
                </div>
                <p className="text-xs text-slate-500 font-mono uppercase tracking-widest animate-pulse">
                  Synchronizing
                </p>
              </div>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-10 p-5 rounded-2xl bg-red-500/5 border border-red-500/10 flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-red-300 mb-1">
                  Failed to load dashboard data
                </p>
                <p className="text-xs text-red-400/60 font-mono truncate">
                  {error}
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="space-y-10"
            >
              {/* ── Metric Cards ── */}
              <section>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                  {[
                    {
                      title: "Total Requests",
                      value: summary.totalRequests.toLocaleString(),
                      change: "+12.5%",
                      changeType: "positive" as const,
                      icon: Activity,
                      accent: "from-blue-500/30 to-blue-600/10",
                    },
                    {
                      title: "Total Spent",
                      value: `$${(totalCost / 100000).toFixed(2)}`,
                      change: "+8.3%",
                      changeType: "positive" as const,
                      icon: DollarSign,
                      accent:
                        "from-emerald-500/30 to-emerald-600/10",
                    },
                    {
                      title: "Credits Left",
                      value: `$${(creditsRemaining / 100000).toFixed(2)}`,
                      icon: DollarSign,
                      accent:
                        "from-violet-500/30 to-violet-600/10",
                    },
                    {
                      title: "Avg Latency",
                      value: `${avgLatency}ms`,
                      change: "-5.2%",
                      changeType: "positive" as const,
                      icon: Zap,
                      accent:
                        "from-amber-500/30 to-amber-600/10",
                    },
                    {
                      title: "Success Rate",
                      value: `${successRate}%`,
                      change: "+0.3%",
                      changeType: "positive" as const,
                      icon: Gauge,
                      accent:
                        "from-cyan-500/30 to-cyan-600/10",
                    },
                    {
                      title: "Active Keys",
                      value: (keys?.length ?? 0).toString(),
                      icon: Key,
                      accent:
                        "from-fuchsia-500/30 to-fuchsia-600/10",
                    },
                  ].map((m, i) => (
                    <MetricCard key={m.title} {...m} index={i} />
                  ))}
                </div>
              </section>

              {/* ── Charts Row ── */}
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="relative group rounded-2xl border border-white/[0.06] bg-[#0A0A0A] p-5 sm:p-6 overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/10">
                      <Activity className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white tracking-tight">
                        Requests per Hour
                      </h3>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Last 24 hours
                      </p>
                    </div>
                  </div>
                  {hourlyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <AreaChart data={hourlyData}>
                        <defs>
                          <linearGradient
                            id="reqFill2"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#3b82f6"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="100%"
                              stopColor="#3b82f6"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#ffffff08"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="time"
                          stroke="#475569"
                          tick={{ fontSize: 11, fill: "#64748b" }}
                          axisLine={false}
                          tickLine={false}
                          interval={Math.floor(hourlyData.length / 6)}
                        />
                        <YAxis
                          stroke="#475569"
                          tick={{ fontSize: 11, fill: "#64748b" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          content={
                            <CustomTooltip unit=" reqs" />
                          }
                          cursor={{
                            stroke: "#3b82f6",
                            strokeWidth: 1,
                            strokeDasharray: "4 4",
                            strokeOpacity: 0.2,
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="requests"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          fill="url(#reqFill2)"
                          animationDuration={1500}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[240px] text-slate-600 gap-2">
                      <Activity className="w-6 h-6 opacity-40" />
                      <span className="text-sm">No request data yet</span>
                    </div>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="relative group rounded-2xl border border-white/[0.06] bg-[#0A0A0A] p-5 sm:p-6 overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/10">
                      <Clock className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white tracking-tight">
                        Latency Trend
                      </h3>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Daily average
                      </p>
                    </div>
                  </div>
                  {dailyUsage.length > 0 ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <AreaChart data={dailyUsage.slice().reverse()}>
                        <defs>
                          <linearGradient
                            id="latFill2"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#f59e0b"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="100%"
                              stopColor="#f59e0b"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#ffffff08"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="date"
                          stroke="#475569"
                          tick={{ fontSize: 11, fill: "#64748b" }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => {
                            const [y, m, d] = String(v).split("-");
                            return `${Number(m)}/${Number(d)}`;
                          }}
                          interval={Math.floor(dailyUsage.length / 6)}
                        />
                        <YAxis
                          stroke="#475569"
                          tick={{ fontSize: 11, fill: "#64748b" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          content={
                            <CustomTooltip unit="ms" />
                          }
                          cursor={{
                            stroke: "#f59e0b",
                            strokeWidth: 1,
                            strokeDasharray: "4 4",
                            strokeOpacity: 0.2,
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="latency"
                          stroke="#f59e0b"
                          strokeWidth={2}
                          fill="url(#latFill2)"
                          animationDuration={1500}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[240px] text-slate-600 gap-2">
                      <Clock className="w-6 h-6 opacity-40" />
                      <span className="text-sm">No latency data yet</span>
                    </div>
                  )}
                </motion.div>
              </section>

              {/* ── Activity + Models ── */}
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Recent Activity */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="relative rounded-2xl border border-white/[0.06] bg-[#0A0A0A] overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                  <div className="flex items-center justify-between p-5 sm:p-6 pb-0">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/10">
                        <Braces className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white tracking-tight">
                          Recent Activity
                        </h3>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                          Latest requests
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/dashboard/logs"
                      className="text-xs text-slate-500 hover:text-white transition-colors flex items-center gap-1 group/link"
                    >
                      View all
                      <ArrowRight className="w-3 h-3 group-hover/link:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>

                  <div className="p-3 sm:p-4">
                    {recentLogs.slice(0, 5).map((log, i) => (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + i * 0.05 }}
                        className="group flex items-center justify-between py-3 px-3 -mx-3 rounded-xl hover:bg-white/[0.03] transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-white truncate">
                              {log.model}
                            </span>
                            <span className="text-[10px] text-slate-600 font-mono shrink-0 bg-white/[0.03] px-1.5 py-0.5 rounded">
                              {log.provider}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-slate-600" />
                            <span className="text-xs text-slate-500 font-mono">
                              {new Date(log.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-3">
                          <span className="text-xs font-mono text-emerald-400/80">
                            <CostDisplay cost={log.cost} />
                          </span>
                          <StatusBadge
                            status={
                              log.status === "success" ? "success" : "error"
                            }
                            label={log.status}
                            size="sm"
                          />
                        </div>
                      </motion.div>
                    ))}
                    {recentLogs.length === 0 && (
                      <div className="text-center py-12 text-slate-600 text-sm">
                        No recent activity
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Top Models */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="relative rounded-2xl border border-white/[0.06] bg-[#0A0A0A] overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                  <div className="flex items-center justify-between p-5 sm:p-6 pb-0">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/10">
                        <BarChart3 className="w-5 h-5 text-fuchsia-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white tracking-tight">
                          Top Models
                        </h3>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                          Usage distribution
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/dashboard/analytics"
                      className="text-xs text-slate-500 hover:text-white transition-colors flex items-center gap-1 group/link"
                    >
                      View all
                      <ArrowRight className="w-3 h-3 group-hover/link:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>

                  <div className="p-5 sm:p-6">
                    {topModels.length > 0 ? (
                      <div className="space-y-6">
                        {topModels.map((model, index) => (
                          <div key={model.model}>
                            <div className="flex items-center justify-between mb-2.5">
                              <div className="flex items-center gap-3">
                                <span className="text-[11px] font-mono font-bold text-slate-700 w-5">
                                  {String(index + 1).padStart(2, "0")}
                                </span>
                                <span className="text-sm font-medium text-white">
                                  {model.model}
                                </span>
                              </div>
                              <span className="text-xs font-mono text-slate-400">
                                {model.percentage}%
                              </span>
                            </div>
                            <div className="relative h-2 bg-white/[0.04] rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${model.percentage}%` }}
                                transition={{
                                  delay: 0.6 + index * 0.15,
                                  duration: 0.8,
                                  ease: [0.16, 1, 0.3, 1],
                                }}
                                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-fuchsia-500"
                              />
                            </div>
                            <p className="text-[11px] text-slate-600 mt-1.5 font-mono">
                              {model.requests.toLocaleString()} requests
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-slate-600 text-sm">
                        No model usage yet
                      </div>
                    )}
                  </div>
                </motion.div>
              </section>

              {/* ── Quick Actions ── */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  {[
                    {
                      href: "/dashboard/keys",
                      label: "Manage API Keys",
                      desc: "Create and rotate your credentials",
                      icon: Key,
                      accent: "from-violet-500/20 to-violet-500/5",
                      border: "border-violet-500/15",
                      text: "text-violet-400",
                    },
                    {
                      href: "/dashboard/logs",
                      label: "View Logs",
                      desc: "Inspect every request in detail",
                      icon: Braces,
                      accent: "from-blue-500/20 to-blue-500/5",
                      border: "border-blue-500/15",
                      text: "text-blue-400",
                    },
                    {
                      href: "/dashboard/analytics",
                      label: "Analytics",
                      desc: "Track usage patterns and costs",
                      icon: TrendingUp,
                      accent: "from-emerald-500/20 to-emerald-500/5",
                      border: "border-emerald-500/15",
                      text: "text-emerald-400",
                    },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="group relative rounded-2xl border border-white/[0.06] bg-[#0A0A0A] overflow-hidden hover:border-white/[0.12] transition-all duration-300"
                    >
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${item.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                      />
                      <div className="relative p-5 flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.accent} border ${item.border} flex items-center justify-center ${item.text}`}
                        >
                          <item.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-white">
                            {item.label}
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {item.desc}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.section>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
