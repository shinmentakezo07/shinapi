"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Zap,
  Activity,
  Calendar,
  AlertCircle,
  Coins,
  Gauge,
  TriangleAlert,
  Radio,
  Cpu,
  Clock,
  Database,
} from "lucide-react";
import { SkeletonChart, SkeletonStats } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { getSDK, AnalyticsData, APILog } from "@/lib/api/sdk";
import { getErrorMessage } from "@/lib/api/errors";

const COLORS = [
  "#8b5cf6",
  "#ec4899",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
];

const tooltipStyle = {
  backgroundColor: "#0A0A0A",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "10px",
  color: "#fff",
  fontSize: "12px",
  padding: "8px 12px",
  boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
};

interface SparklineCardProps {
  title: string;
  value: number;
  unit?: string;
  decimals?: number;
  icon: typeof Activity;
  accent: string;
  spark: number[];
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  index: number;
}

function SparklineCard({
  title,
  value,
  unit = "",
  decimals = 0,
  icon: Icon,
  accent,
  spark,
  change,
  changeType = "neutral",
  index,
}: SparklineCardProps) {
  const changeColors = {
    positive: "text-emerald-400",
    negative: "text-red-400",
    neutral: "text-slate-400",
  };
  const sparkData = spark.map((v, i) => ({ i, v }));
  const max = Math.max(...spark, 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.05,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{ y: -3 }}
      className="group relative"
    >
      <div className="relative h-full flex flex-col justify-between p-5 rounded-2xl border border-white/[0.06] bg-[#0A0A0A] overflow-hidden hover:border-white/[0.14] transition-all duration-300">
        <div
          className="absolute inset-x-0 top-0 h-px opacity-60"
          style={{
            background: `linear-gradient(to right, transparent, ${accent}66, transparent)`,
          }}
        />
        <div className="flex items-start justify-between mb-3">
          <div
            className="p-2.5 rounded-xl border border-white/[0.04]"
            style={{ backgroundColor: `${accent}14` }}
          >
            <Icon className="w-[18px] h-[18px]" style={{ color: accent }} />
          </div>
          {change && (
            <span
              className={`text-[11px] font-mono font-medium ${changeColors[changeType]}`}
            >
              {change}
            </span>
          )}
        </div>
        <div className="mt-auto">
          <div className="text-2xl font-bold text-white tracking-tight font-mono tabular-nums">
            {value.toLocaleString(undefined, {
              minimumFractionDigits: decimals,
              maximumFractionDigits: decimals,
            })}
            {unit && (
              <span className="text-sm font-medium text-slate-500 ml-0.5">
                {unit}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 uppercase tracking-[0.1em] font-medium mt-1">
            {title}
          </p>
        </div>
        <div className="mt-3 -mx-1 h-8">
          {spark.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData}>
                <defs>
                  <linearGradient
                    id={`spark-${title.replace(/\s+/g, "")}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2={max}
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0%" stopColor={accent} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke={accent}
                  strokeWidth={1.75}
                  fill={`url(#spark-${title.replace(/\s+/g, "")})`}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-end gap-px">
              {Array.from({ length: 14 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm"
                  style={{
                    height: `${10 + ((i * 7) % 60)}%`,
                    backgroundColor: `${accent}30`,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ChartCard({
  title,
  subtitle,
  icon: Icon,
  iconColor,
  children,
  action,
  delay = 0,
}: {
  title: string;
  subtitle?: string;
  icon: typeof Activity;
  iconColor: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="bg-[#0A0A0A] border border-white/[0.06] rounded-2xl p-6 hover:border-white/[0.12] transition-colors duration-300"
    >
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div
            className="p-1.5 rounded-lg"
            style={{ backgroundColor: `${iconColor}14` }}
          >
            <Icon className="w-4 h-4" style={{ color: iconColor }} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white leading-tight">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {action}
      </div>
      {children}
    </motion.div>
  );
}

export default function AnalyticsClient() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("7d");

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSDK().getAnalytics();
      setAnalytics(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const summary = analytics?.summary ?? {
    totalRequests: 0,
    successRequests: 0,
    errorRequests: 0,
  };
  const dailyUsage = analytics?.dailyUsage ?? [];
  const modelBreakdown = analytics?.modelBreakdown ?? [];
  const recentLogs = analytics?.recentLogs ?? [];

  // --- Derived metrics (from real SDK data, no mocks) ---
  const totalCost = useMemo(
    () => recentLogs.reduce((s, l) => s + (Number(l.cost) || 0), 0),
    [recentLogs],
  );
  const totalTokens = useMemo(
    () =>
      recentLogs.reduce(
        (s, l) =>
          s + (Number(l.inputTokens) || 0) + (Number(l.outputTokens) || 0),
        0,
      ),
    [recentLogs],
  );
  const inputTokens = useMemo(
    () => recentLogs.reduce((s, l) => s + (Number(l.inputTokens) || 0), 0),
    [recentLogs],
  );
  const outputTokens = useMemo(
    () => recentLogs.reduce((s, l) => s + (Number(l.outputTokens) || 0), 0),
    [recentLogs],
  );
  const avgLatency = useMemo(
    () =>
      recentLogs.length > 0
        ? Math.round(
            recentLogs.reduce((s, l) => s + (Number(l.latency) || 0), 0) /
              recentLogs.length,
          )
        : 0,
    [recentLogs],
  );
  const p95Latency = useMemo(() => {
    if (recentLogs.length === 0) return 0;
    const sorted = recentLogs
      .map((l) => Number(l.latency) || 0)
      .sort((a, b) => a - b);
    return Math.round(sorted[Math.floor(sorted.length * 0.95)] ?? 0);
  }, [recentLogs]);
  const successRate =
    summary.totalRequests > 0
      ? (summary.successRequests / summary.totalRequests) * 100
      : 0;
  const errorRate =
    summary.totalRequests > 0
      ? (summary.errorRequests / summary.totalRequests) * 100
      : 0;

  // Time range filter
  const daysMap: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };
  const days = daysMap[timeRange];
  const filteredDaily = dailyUsage.slice(-days);

  // Sparklines from filtered daily
  const sparkRequests = filteredDaily.map((d) => d.requests ?? 0);
  const sparkCost = filteredDaily.map((d) => d.cost ?? 0);
  const sparkLatency = filteredDaily.map(
    (d) => Number((d as any).latency) || 0,
  );
  const sparkTokens = filteredDaily.map((d) => d.tokens ?? 0);
  const sparkSuccess = filteredDaily.map((_, i) => {
    const slice = filteredDaily.slice(Math.max(0, i - 2), i + 1);
    void slice;
    return successRate;
  });
  const sparkError = filteredDaily.map((d) => {
    void d;
    return errorRate;
  });

  // Aggregate cost delta (last vs first half)
  const costDeltaPct = useMemo(() => {
    if (filteredDaily.length < 2) return 0;
    const half = Math.floor(filteredDaily.length / 2);
    const first = filteredDaily
      .slice(0, half)
      .reduce((s, d) => s + (d.cost ?? 0), 0);
    const second = filteredDaily
      .slice(half)
      .reduce((s, d) => s + (d.cost ?? 0), 0);
    return first > 0 ? Math.round(((second - first) / first) * 100) : 0;
  }, [filteredDaily]);
  const reqDeltaPct = useMemo(() => {
    if (filteredDaily.length < 2) return 0;
    const half = Math.floor(filteredDaily.length / 2);
    const first = filteredDaily
      .slice(0, half)
      .reduce((s, d) => s + (d.requests ?? 0), 0);
    const second = filteredDaily
      .slice(half)
      .reduce((s, d) => s + (d.requests ?? 0), 0);
    return first > 0 ? Math.round(((second - first) / first) * 100) : 0;
  }, [filteredDaily]);

  // Model breakdown chart data
  const totalModelRequests = modelBreakdown.reduce(
    (sum, m) => sum + (m.count ?? 0),
    0,
  );
  const chartModelData = modelBreakdown.map((m, i) => ({
    model: m.model,
    requests: m.count ?? 0,
    cost: m.totalCost ?? 0,
    percentage:
      totalModelRequests > 0
        ? Math.round(((m.count ?? 0) / totalModelRequests) * 100)
        : 0,
    fill: COLORS[i % COLORS.length],
  }));
  const topModel = chartModelData[0];

  // Per-model latency & tokens from recent logs
  const modelPerf = useMemo(() => {
    const map = new Map<
      string,
      {
        count: number;
        cost: number;
        tokens: number;
        latency: number;
        latSum: number;
      }
    >();
    recentLogs.forEach((l) => {
      const cur = map.get(l.model) ?? {
        count: 0,
        cost: 0,
        tokens: 0,
        latency: 0,
        latSum: 0,
      };
      cur.count += 1;
      cur.cost += Number(l.cost) || 0;
      cur.tokens +=
        (Number(l.inputTokens) || 0) + (Number(l.outputTokens) || 0);
      cur.latSum += Number(l.latency) || 0;
      map.set(l.model, cur);
    });
    return Array.from(map.entries())
      .map(([model, v]) => ({
        model,
        count: v.count,
        cost: v.cost,
        tokens: v.tokens,
        avgLatency: v.count > 0 ? Math.round(v.latSum / v.count) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [recentLogs]);

  // Provider mix over time (by provider, from recent logs proxy model->provider)
  const providerSeries = useMemo(() => {
    // Bucket recent logs by day (ISO date) and provider
    const providers = new Set<string>();
    recentLogs.forEach((l) => providers.add(l.provider));
    const provArr = Array.from(providers);
    const buckets = new Map<string, Record<string, number>>();
    filteredDaily.forEach((d) => {
      buckets.set(d.date, {});
      provArr.forEach((p) => (buckets.get(d.date)![p] = 0));
    });
    recentLogs.forEach((l) => {
      const ds = new Date(l.createdAt).toISOString().slice(0, 10);
      if (buckets.has(ds)) {
        const b = buckets.get(ds)!;
        b[l.provider] = (b[l.provider] ?? 0) + 1;
      }
    });
    return {
      data: Array.from(buckets.entries()).map(([date, counts]) => ({
        date,
        ...counts,
      })),
      providers: provArr.map((p, i) => ({
        name: p,
        fill: COLORS[i % COLORS.length],
      })),
    };
  }, [filteredDaily, recentLogs]);

  // Hourly request pattern (3h buckets across 24h)
  const hourlyRequests = useMemo(() => {
    const hourlyMap = new Map<string, number>();
    for (let i = 0; i < 24; i += 3) {
      hourlyMap.set(`${i.toString().padStart(2, "0")}:00`, 0);
    }
    recentLogs.forEach((log) => {
      const hour = new Date(log.createdAt).getHours();
      const bucket = `${Math.floor(hour / 3) * 3}`.padStart(2, "0") + ":00";
      hourlyMap.set(bucket, (hourlyMap.get(bucket) ?? 0) + 1);
    });
    return Array.from(hourlyMap.entries()).map(([hour, requests]) => ({
      hour,
      requests,
    }));
  }, [recentLogs]);

  // Peak hour
  const peakHour = useMemo(() => {
    if (hourlyRequests.length === 0) return null;
    return hourlyRequests.reduce((a, b) => (b.requests > a.requests ? b : a));
  }, [hourlyRequests]);

  // Hourly heat strip — 24 cells (one per real hour)
  const heatStrip = useMemo(() => {
    const cells = new Array(24).fill(0);
    recentLogs.forEach((l) => {
      const h = new Date(l.createdAt).getHours();
      cells[h] += 1;
    });
    const max = Math.max(...cells, 1);
    return cells.map((v) => v / max);
  }, [recentLogs]);

  // Recent activity feed (last 8)
  const recentFeed = useMemo(
    () =>
      [...recentLogs]
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
        .slice(0, 8),
    [recentLogs],
  );

  const tokensPerSec =
    recentLogs.length > 0 && totalTokens > 0
      ? Math.round(totalTokens / Math.max(avgLatency / 1000, 0.001))
      : 0;

  return (
    <div className="min-h-screen pt-6 pb-12 px-4 sm:px-6 lg:px-8 bg-[#050505]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="relative p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <BarChart3 className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Analytics
              </h1>
              <p className="text-sm text-slate-500">
                Gateway traffic, spend, and latency at a glance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-1 rounded-xl bg-[#0A0A0A] border border-white/[0.06]">
            {(["7d", "30d", "90d"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  timeRange === range
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-slate-500 hover:text-white"
                }`}
              >
                {range === "7d"
                  ? "7 Days"
                  : range === "30d"
                    ? "30 Days"
                    : "90 Days"}
              </button>
            ))}
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-400 mb-1">
                Error loading analytics
              </h3>
              <p className="text-xs text-red-300/80">{error}</p>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-8">
            <SkeletonStats
              count={6}
              className="!grid-cols-2 sm:!grid-cols-3 lg:!grid-cols-6"
            />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <SkeletonChart height={320} />
              <SkeletonChart height={320} />
              <SkeletonChart height={320} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <SkeletonChart height={250} />
              <SkeletonChart height={250} />
            </div>
          </div>
        )}

        {!loading && (
          <>
            {/* KPI rail with sparklines — 6 metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
              <SparklineCard
                index={0}
                title="Requests"
                value={summary.totalRequests}
                icon={Activity}
                accent="#3b82f6"
                spark={sparkRequests}
                change={
                  reqDeltaPct !== 0
                    ? `${reqDeltaPct >= 0 ? "+" : ""}${reqDeltaPct}%`
                    : undefined
                }
                changeType={reqDeltaPct >= 0 ? "positive" : "negative"}
              />
              <SparklineCard
                index={1}
                title="Spend"
                value={totalCost / 100000}
                unit="$"
                decimals={2}
                icon={DollarSign}
                accent="#10b981"
                spark={sparkCost}
                change={
                  costDeltaPct !== 0
                    ? `${costDeltaPct >= 0 ? "+" : ""}${costDeltaPct}%`
                    : undefined
                }
                changeType={costDeltaPct >= 0 ? "positive" : "negative"}
              />
              <SparklineCard
                index={2}
                title="Avg Latency"
                value={avgLatency}
                unit="ms"
                icon={Gauge}
                accent="#eab308"
                spark={sparkLatency}
              />
              <SparklineCard
                index={3}
                title="Success Rate"
                value={successRate}
                unit="%"
                decimals={1}
                icon={TrendingUp}
                accent="#22c55e"
                spark={sparkSuccess}
              />
              <SparklineCard
                index={4}
                title="Tokens / sec"
                value={tokensPerSec}
                icon={Coins}
                accent="#06b6d4"
                spark={sparkTokens}
              />
              <SparklineCard
                index={5}
                title="Error Rate"
                value={errorRate}
                unit="%"
                decimals={1}
                icon={TriangleAlert}
                accent="#ef4444"
                spark={sparkError}
              />
            </div>

            {/* Sub-summary stat row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
              {[
                {
                  label: "Peak traffic window",
                  value: peakHour ? peakHour.hour : "—",
                  sub:
                    peakHour && peakHour.requests > 0
                      ? `${peakHour.requests} req`
                      : "no logs",
                  icon: Clock,
                  accent: "#06b6d4",
                },
                {
                  label: "P95 latency",
                  value: `${p95Latency}ms`,
                  sub: `${summary.totalRequests.toLocaleString()} samples`,
                  icon: Zap,
                  accent: "#eab308",
                },
                {
                  label: "Top model",
                  value: topModel
                    ? (topModel.model.split("/").pop() ?? topModel.model)
                    : "—",
                  sub: topModel
                    ? `${topModel.percentage}% of traffic`
                    : "no data",
                  icon: Cpu,
                  accent: "#8b5cf6",
                },
                {
                  label: "Total tokens",
                  value:
                    totalTokens > 1000
                      ? `${(totalTokens / 1000).toFixed(1)}k`
                      : totalTokens.toLocaleString(),
                  sub: `${Math.round((outputTokens / Math.max(totalTokens, 1)) * 100)}% output`,
                  icon: Database,
                  accent: "#10b981",
                },
              ].map((s, i) => {
                const I = s.icon;
                return (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.04 }}
                    className="flex items-center gap-3 p-4 rounded-xl bg-[#0A0A0A] border border-white/[0.06]"
                  >
                    <div
                      className="p-2 rounded-lg shrink-0"
                      style={{ backgroundColor: `${s.accent}14` }}
                    >
                      <I className="w-4 h-4" style={{ color: s.accent }} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] text-slate-500 uppercase tracking-wide truncate">
                        {s.label}
                      </div>
                      <div className="text-sm font-bold text-white font-mono truncate">
                        {s.value}
                      </div>
                      <div className="text-[10px] text-slate-600 truncate">
                        {s.sub}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Row 1: daily volume + provider mix + model donut */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <ChartCard
                title="Request volume & spend"
                subtitle="Daily requests against cost"
                icon={Calendar}
                iconColor="#3b82f6"
                delay={0.15}
              >
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={filteredDaily}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#ffffff08"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      stroke="#475569"
                      style={{ fontSize: "11px" }}
                      tickFormatter={(d: string) => d.slice(5)}
                    />
                    <YAxis
                      yAxisId="left"
                      stroke="#475569"
                      style={{ fontSize: "11px" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#475569"
                      style={{ fontSize: "11px" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      cursor={{ fill: "#ffffff05" }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    <Bar
                      yAxisId="left"
                      dataKey="requests"
                      fill="#3b82f6"
                      name="Requests"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={36}
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="cost"
                      fill="#10b981"
                      name="Cost (units)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={36}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard
                title="Traffic by provider"
                subtitle="Requests streamed per provider"
                icon={Radio}
                iconColor="#06b6d4"
                delay={0.2}
              >
                {providerSeries.data.length > 0 &&
                providerSeries.providers.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={providerSeries.data}>
                      <defs>
                        {providerSeries.providers.map((p) => (
                          <linearGradient
                            key={p.name}
                            id={`prov-${p.name}`}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor={p.fill}
                              stopOpacity={0.5}
                            />
                            <stop
                              offset="95%"
                              stopColor={p.fill}
                              stopOpacity={0}
                            />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#ffffff08"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        stroke="#475569"
                        style={{ fontSize: "11px" }}
                        tickFormatter={(d: string) => d.slice(5)}
                      />
                      <YAxis
                        stroke="#475569"
                        style={{ fontSize: "11px" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        cursor={{ stroke: "#ffffff20" }}
                      />
                      {providerSeries.providers.map((p) => (
                        <Area
                          key={p.name}
                          type="monotone"
                          dataKey={p.name}
                          stackId="1"
                          stroke={p.fill}
                          strokeWidth={1.5}
                          fill={`url(#prov-${p.name})`}
                          isAnimationActive={false}
                        />
                      ))}
                      <Legend wrapperStyle={{ fontSize: "11px" }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-slate-600 text-sm">
                    No provider traffic yet
                  </div>
                )}
              </ChartCard>

              <ChartCard
                title="Usage by model"
                subtitle="Share of total requests"
                icon={BarChart3}
                iconColor="#8b5cf6"
                delay={0.25}
              >
                {chartModelData.length > 0 ? (
                  <div className="relative">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={chartModelData}
                          cx="50%"
                          cy="50%"
                          innerRadius={62}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="requests"
                          stroke="#0A0A0A"
                          strokeWidth={2}
                        >
                          {chartModelData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                        Models
                      </span>
                      <span className="text-2xl font-bold text-white font-mono">
                        {chartModelData.length}
                      </span>
                      <span className="text-[10px] text-slate-600">
                        {totalModelRequests.toLocaleString()} req
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-slate-600 text-sm">
                    No model usage data yet
                  </div>
                )}
                {chartModelData.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {chartModelData.slice(0, 4).map((m) => (
                      <div
                        key={m.model}
                        className="flex items-center gap-1.5 text-[11px] text-slate-400"
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: m.fill }}
                        />
                        <span className="truncate max-w-[96px]">
                          {m.model.split("/").pop()}
                        </span>
                        <span className="text-slate-600">{m.percentage}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </ChartCard>
            </div>

            {/* Hourly heat strip */}
            <div className="mb-6">
              <ChartCard
                title="Request river · 24h"
                subtitle="Hot hours light up — each cell is one hour"
                icon={Activity}
                iconColor="#ec4899"
                delay={0.3}
              >
                <div
                  className="flex gap-1 w-full"
                  style={{
                    gridTemplateColumns: "repeat(24, minmax(0, 1fr))",
                    display: "grid",
                  }}
                >
                  {heatStrip.map((v, i) => {
                    const hour = i.toString().padStart(2, "0");
                    return (
                      <div
                        key={i}
                        title={`${hour}:00`}
                        className="aspect-square rounded-[3px]"
                        style={{
                          backgroundColor:
                            v > 0
                              ? `rgba(236,72,153,${0.12 + v * 0.78})`
                              : "#ffffff06",
                          boxShadow:
                            v > 0.6 ? "0 0 6px rgba(236,72,153,0.35)" : "none",
                        }}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-slate-600 font-mono">
                  <span>00:00</span>
                  <span>06:00</span>
                  <span>12:00</span>
                  <span>18:00</span>
                  <span>23:00</span>
                </div>
              </ChartCard>
            </div>

            {/* Row 2: hourly pattern + latency trend */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <ChartCard
                title="Hourly request pattern"
                subtitle="3-hour buckets across the day"
                icon={Activity}
                iconColor="#06b6d4"
                delay={0.35}
              >
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={hourlyRequests}>
                    <defs>
                      <linearGradient
                        id="colorHourly"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#06b6d4"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#06b6d4"
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
                      dataKey="hour"
                      stroke="#475569"
                      style={{ fontSize: "11px" }}
                    />
                    <YAxis
                      stroke="#475569"
                      style={{ fontSize: "11px" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      cursor={{ stroke: "#ffffff20" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="requests"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorHourly)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard
                title="Latency trend"
                subtitle="Avg latency across the window"
                icon={Zap}
                iconColor="#eab308"
                delay={0.4}
              >
                {filteredDaily.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={filteredDaily}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#ffffff08"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        stroke="#475569"
                        style={{ fontSize: "11px" }}
                        tickFormatter={(d: string) => d.slice(5)}
                      />
                      <YAxis
                        stroke="#475569"
                        style={{ fontSize: "11px" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        cursor={{ stroke: "#ffffff20" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="latency"
                        stroke="#eab308"
                        strokeWidth={2.5}
                        dot={{ fill: "#eab308", r: 3 }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[250px] text-slate-600 text-sm">
                    No latency data yet
                  </div>
                )}
              </ChartCard>
            </div>

            {/* Row 3: tokens in/out + top models leaderboard */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <ChartCard
                title="Tokens · input vs output"
                subtitle={`Total ${totalTokens.toLocaleString()} processed`}
                icon={Coins}
                iconColor="#10b981"
                delay={0.45}
              >
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={[
                      { kind: "Input", tokens: inputTokens, fill: "#3b82f6" },
                      { kind: "Output", tokens: outputTokens, fill: "#10b981" },
                    ]}
                    layout="vertical"
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#ffffff08"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      stroke="#475569"
                      style={{ fontSize: "11px" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) =>
                        v > 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`
                      }
                    />
                    <YAxis
                      type="category"
                      dataKey="kind"
                      stroke="#94a3b8"
                      style={{ fontSize: "12px", fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                      width={70}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      cursor={{ fill: "#ffffff05" }}
                      formatter={(value) => [
                        `${Number(value).toLocaleString()} tok`,
                        "",
                      ]}
                    />
                    <Bar dataKey="tokens" radius={[0, 6, 6, 0]} maxBarSize={48}>
                      <Cell fill="#3b82f6" />
                      <Cell fill="#10b981" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex items-center justify-around mt-1 pt-3 border-t border-white/[0.06]">
                  <div className="text-center">
                    <div className="text-xs text-slate-500">In / Out ratio</div>
                    <div className="text-sm font-mono font-bold text-white mt-0.5">
                      {outputTokens > 0
                        ? `${(inputTokens / outputTokens).toFixed(2)} : 1`
                        : "—"}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-slate-500">
                      Avg tokens / req
                    </div>
                    <div className="text-sm font-mono font-bold text-white mt-0.5">
                      {recentLogs.length > 0
                        ? Math.round(
                            totalTokens / recentLogs.length,
                          ).toLocaleString()
                        : "0"}
                    </div>
                  </div>
                </div>
              </ChartCard>

              <ChartCard
                title="Top models leaderboard"
                subtitle="Ranked by request count"
                icon={Cpu}
                iconColor="#8b5cf6"
                delay={0.5}
              >
                {modelPerf.length > 0 ? (
                  <div className="space-y-1">
                    {modelPerf.slice(0, 6).map((m, i) => {
                      const maxCount = modelPerf[0].count || 1;
                      const share = Math.round((m.count / maxCount) * 100);
                      return (
                        <motion.div
                          key={m.model}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + i * 0.05 }}
                          className="relative flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.03] transition-colors"
                        >
                          <span className="text-xs font-mono text-slate-600 w-5 text-right">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm text-white font-medium truncate">
                                {m.model.split("/").pop()}
                              </span>
                              <span className="text-xs font-mono text-slate-400 shrink-0">
                                {m.count.toLocaleString()} req
                              </span>
                            </div>
                            <div className="mt-1 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${share}%`,
                                  background: `linear-gradient(to right, ${COLORS[i % COLORS.length]}, ${COLORS[(i + 1) % COLORS.length]})`,
                                }}
                              />
                            </div>
                          </div>
                          <div className="flex flex-col items-end shrink-0 w-20">
                            <span className="text-[10px] text-slate-600">
                              latency
                            </span>
                            <span className="text-xs font-mono text-yellow-400">
                              {m.avgLatency}ms
                            </span>
                          </div>
                          <div className="flex flex-col items-end shrink-0 w-16">
                            <span className="text-[10px] text-slate-600">
                              cost
                            </span>
                            <span className="text-xs font-mono text-emerald-400">
                              ${(m.cost / 100000).toFixed(2)}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[250px] text-slate-600 text-sm">
                    No model performance data yet
                  </div>
                )}
              </ChartCard>
            </div>

            {/* Row 4: live recent requests feed */}
            <div className="mb-6">
              <ChartCard
                title="Recent requests"
                subtitle="Latest gateway traffic, newest first"
                icon={Radio}
                iconColor="#22c55e"
                delay={0.55}
                action={
                  <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                    </span>
                    LIVE
                  </span>
                }
              >
                {recentFeed.length > 0 ? (
                  <div className="overflow-x-auto -mx-2">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-[10px] font-mono text-slate-600 uppercase tracking-wider">
                          <th className="px-4 py-2 text-left font-bold">
                            Status
                          </th>
                          <th className="px-4 py-2 text-left font-bold">
                            Model
                          </th>
                          <th className="px-4 py-2 text-left font-bold">
                            Provider
                          </th>
                          <th className="px-4 py-2 text-right font-bold">
                            Tokens
                          </th>
                          <th className="px-4 py-2 text-right font-bold">
                            Latency
                          </th>
                          <th className="px-4 py-2 text-right font-bold">
                            Cost
                          </th>
                          <th className="px-4 py-2 text-right font-bold">
                            When
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {recentFeed.map((log, i) => {
                          const ok =
                            log.status === "success" || log.status === "200";
                          const toks =
                            (Number(log.inputTokens) || 0) +
                            (Number(log.outputTokens) || 0);
                          const when = new Date(log.createdAt);
                          const ago = Math.round(
                            (Date.now() - when.getTime()) / 60000,
                          );
                          return (
                            <motion.tr
                              key={log.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.55 + i * 0.03 }}
                              className="hover:bg-white/[0.03] transition-colors"
                            >
                              <td className="px-4 py-2.5">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-medium ${
                                    ok
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                                  }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${ok ? "bg-emerald-400" : "bg-red-400"}`}
                                  />
                                  {ok ? "OK" : log.status?.slice(0, 4) || "ERR"}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-slate-300 font-mono text-xs truncate max-w-[160px]">
                                {log.model?.split("/").pop() ?? log.model}
                              </td>
                              <td className="px-4 py-2.5 text-slate-400 font-mono text-xs">
                                {log.provider}
                              </td>
                              <td className="px-4 py-2.5 text-right text-slate-300 font-mono text-xs">
                                {toks.toLocaleString()}
                              </td>
                              <td className="px-4 py-2.5 text-right text-yellow-400 font-mono text-xs">
                                {Number(log.latency) || 0}ms
                              </td>
                              <td className="px-4 py-2.5 text-right text-emerald-400 font-mono text-xs">
                                ${((Number(log.cost) || 0) / 100000).toFixed(4)}
                              </td>
                              <td className="px-4 py-2.5 text-right text-slate-500 font-mono text-xs">
                                {ago >= 60
                                  ? `${Math.floor(ago / 60)}h ago`
                                  : ago > 0
                                    ? `${ago}m ago`
                                    : "just now"}
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[200px] text-slate-600 text-sm gap-2">
                    <Radio className="w-6 h-6 opacity-40" />
                    No recent traffic — send a request to see it appear here
                  </div>
                )}
              </ChartCard>
            </div>

            {/* Row 5: model breakdown table */}
            {chartModelData.length > 0 && (
              <ChartCard
                title="Model performance breakdown"
                subtitle="Per-model request volume, spend, and share"
                icon={BarChart3}
                iconColor="#8b5cf6"
                delay={0.6}
              >
                <div className="overflow-x-auto -mx-2">
                  <table className="w-full">
                    <thead className="border-b border-white/[0.06]">
                      <tr>
                        {["Model", "Requests", "Cost", "Share"].map((h) => (
                          <th
                            key={h}
                            className="px-6 py-3 text-left text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {chartModelData.map((model, index) => (
                        <motion.tr
                          key={model.model}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.6 + index * 0.06 }}
                          className="hover:bg-white/[0.03] transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: model.fill }}
                              />
                              <span className="text-white font-medium text-sm">
                                {model.model}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-300 font-mono text-sm">
                            {model.requests.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-emerald-400 font-mono text-sm">
                            ${(model.cost / 100000).toFixed(2)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-2 bg-white/[0.04] rounded-full overflow-hidden relative max-w-[200px]">
                                <div
                                  className="h-full rounded-full transition-all duration-700"
                                  style={{
                                    width: `${model.percentage}%`,
                                    background: `linear-gradient(to right, ${model.fill}, ${model.fill}cc)`,
                                    boxShadow: `0 0 8px ${model.fill}40`,
                                  }}
                                />
                              </div>
                              <span className="text-slate-400 text-xs font-mono w-8 text-right">
                                {model.percentage}%
                              </span>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ChartCard>
            )}
          </>
        )}
      </div>
    </div>
  );
}
