"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Search,
  Zap,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Filter,
  RefreshCw,
  Eye,
  Hash,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { LogDetailDrawer } from "@/components/dashboard/LogDetailDrawer";
import { ModelBreakdown } from "@/components/dashboard/ModelBreakdown";
import { useLogs } from "@/lib/api/hooks";
import { getErrorMessage } from "@/lib/api/errors";
import { getSDK } from "@/lib/api/sdk";
import type { APILog } from "@/lib/api/sdk";

/* ------------------------------------------------------------------ */
/*  Utilities                                                          */
/* ------------------------------------------------------------------ */

function formatCost(cents: number): string {
  return `$${(cents / 100000).toFixed(4)}`;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

function latencyColor(ms: number): string {
  if (ms < 400) return "text-emerald-400";
  if (ms < 1200) return "text-amber-400";
  return "text-red-400";
}

/* ------------------------------------------------------------------ */
/*  Motion variants                                                    */
/* ------------------------------------------------------------------ */

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const tableRow = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.025,
      duration: 0.35,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  }),
};

/* ------------------------------------------------------------------ */
/*  Skeletons                                                          */
/* ------------------------------------------------------------------ */

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0A0A0A] p-5">
      <div className="h-3 w-20 bg-white/[0.05] rounded animate-pulse mb-4" />
      <div className="h-8 w-24 bg-white/[0.05] rounded animate-pulse mb-2" />
      <div className="h-2.5 w-16 bg-white/[0.05] rounded animate-pulse" />
    </div>
  );
}

function SkeletonBar() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-3 w-24 bg-white/[0.05] rounded animate-pulse shrink-0" />
      <div className="flex-1 h-5 bg-white/[0.04] rounded-full" />
      <div className="h-3 w-6 bg-white/[0.05] rounded animate-pulse shrink-0" />
    </div>
  );
}

function SkeletonTableRow() {
  return (
    <div className="flex items-center gap-4 px-6 py-3.5 border-b border-white/[0.04]">
      <div className="h-3.5 w-20 bg-white/[0.05] rounded animate-pulse shrink-0" />
      <div className="h-3.5 w-32 bg-white/[0.05] rounded animate-pulse shrink-0" />
      <div className="h-3.5 flex-1 bg-white/[0.05] rounded animate-pulse" />
      <div className="h-3.5 w-16 bg-white/[0.05] rounded animate-pulse shrink-0" />
      <div className="h-3.5 w-12 bg-white/[0.05] rounded animate-pulse shrink-0" />
      <div className="h-3.5 w-16 bg-white/[0.05] rounded animate-pulse shrink-0" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function LogsClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "success" | "error">(
    "all",
  );
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<APILog | null>(null);
  const limit = 20;
  const searchRef = useRef<HTMLInputElement>(null);

  const { data: logsData, isLoading, error, refetch } = useLogs(page, limit);
  const sdk = getSDK();

  const allLogs = logsData?.data ?? [];

  /* Keyboard shortcut: / to focus search */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  /* Client-side filtering */
  const filteredLogs = useMemo(() => {
    if (!searchQuery && statusFilter === "all") return allLogs;
    return allLogs.filter((log) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        log.model.toLowerCase().includes(q) ||
        log.provider.toLowerCase().includes(q) ||
        log.id.toLowerCase().includes(q) ||
        log.status.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "all" || log.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [allLogs, searchQuery, statusFilter]);

  const totalPages = logsData?.totalPages ?? 1;
  const displayLogs =
    searchQuery || statusFilter !== "all" ? filteredLogs : allLogs;

  /* Derived metrics */
  const successCount = allLogs.filter((l) => l.status === "success").length;
  const errorCount = allLogs.filter((l) => l.status === "error").length;
  const avgLatency =
    allLogs.length > 0
      ? Math.round(
          allLogs.reduce((sum, log) => sum + log.latency, 0) / allLogs.length,
        )
      : 0;
  const totalTokens = allLogs.reduce(
    (sum, log) => sum + log.inputTokens + log.outputTokens,
    0,
  );
  const totalCost = allLogs.reduce((sum, log) => sum + log.cost, 0);
  const successRate =
    allLogs.length > 0
      ? ((successCount / allLogs.length) * 100).toFixed(1)
      : "—";

  const handleRowClick = useCallback((row: APILog) => setSelectedLog(row), []);
  const handleCloseDrawer = useCallback(() => setSelectedLog(null), []);

  const filters = [
    {
      key: "all" as const,
      label: "All",
      icon: Activity,
      count: allLogs.length,
    },
    {
      key: "success" as const,
      label: "Success",
      icon: CheckCircle2,
      count: successCount,
    },
    {
      key: "error" as const,
      label: "Errors",
      icon: AlertCircle,
      count: errorCount,
    },
  ];

  /* Pagination */
  const generatePages = () => {
    const pages: (number | "...")[] = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="min-h-screen bg-[#050505] relative isolate">
      {/* ── Ambient atmosphere ── */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-500/[0.03] rounded-full blur-[120px] animate-mesh-shift" />
        <div
          className="absolute -top-40 right-1/4 w-[500px] h-[500px] bg-violet-500/[0.02] rounded-full blur-[100px] animate-mesh-shift"
          style={{ animationDelay: "-5s" }}
        />
        <div
          className="absolute inset-0 opacity-[0.012]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative px-4 sm:px-6 lg:px-8 pt-10 pb-20 max-w-[88rem] mx-auto">
        <motion.div variants={stagger} initial="hidden" animate="visible">
          {/* ── Header ── */}
          <motion.div variants={item} className="mb-10">
            <div className="flex items-end justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-3xl font-bold text-white tracking-tight">
                    Request Logs
                  </h1>
                  {logsData?.total != null && (
                    <span className="text-[11px] text-slate-500 font-mono tracking-wider uppercase -mb-1">
                      {logsData.total.toLocaleString()} total
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 max-w-md mt-1">
                  Inspect every API request in detail — latency, cost, model,
                  and status.
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => refetch()}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm font-medium text-slate-300 hover:text-white hover:border-white/[0.15] transition-all disabled:opacity-30"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </motion.button>
            </div>
          </motion.div>

          {/* ── Error Banner ── */}
          <AnimatePresence>
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                className="mb-8 p-5 rounded-2xl bg-red-500/5 border border-red-500/10 flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-red-300 mb-0.5">
                    Error loading logs
                  </p>
                  <p className="text-xs text-red-400/60 font-mono">
                    {getErrorMessage(error)}
                  </p>
                  {sdk.lastRequestId() && (
                    <p className="text-[11px] text-red-400/40 mt-1.5 font-mono">
                      Request ID: {sdk.lastRequestId()}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Metric Cards ── */}
          <motion.div
            variants={item}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-10"
          >
            {isLoading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : (
              <>
                <MetricCard
                  title="Total Requests"
                  value={logsData?.total ?? 0}
                  icon={Activity}
                  iconColor="text-blue-400"
                  iconBg="bg-blue-500/10"
                  index={0}
                />
                <MetricCard
                  title="Successful"
                  value={successCount}
                  change={allLogs.length > 0 ? `${successRate}%` : undefined}
                  changeType="positive"
                  icon={CheckCircle2}
                  iconColor="text-emerald-400"
                  iconBg="bg-emerald-500/10"
                  index={1}
                />
                <MetricCard
                  title="Errors"
                  value={errorCount}
                  change={
                    allLogs.length > 0
                      ? `${((errorCount / allLogs.length) * 100).toFixed(0)}%`
                      : undefined
                  }
                  changeType={errorCount > 0 ? "negative" : "neutral"}
                  icon={AlertCircle}
                  iconColor="text-red-400"
                  iconBg="bg-red-500/10"
                  index={2}
                />
                <MetricCard
                  title="Avg Latency"
                  value={`${avgLatency}ms`}
                  icon={Zap}
                  iconColor="text-amber-400"
                  iconBg="bg-amber-500/10"
                  index={3}
                />
              </>
            )}
          </motion.div>

          {/* ── Secondary stats ribbon ── */}
          {!isLoading && allLogs.length > 0 && (
            <motion.div variants={item} className="mb-8">
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 px-5 py-3 rounded-xl border border-white/[0.05] bg-white/[0.015]">
                <StatItem
                  icon={Hash}
                  label="Tokens"
                  value={totalTokens.toLocaleString()}
                  color="text-purple-400"
                />
                <StatItem
                  icon={Zap}
                  label="Cost"
                  value={formatCost(totalCost)}
                  color="text-emerald-400"
                />
                <StatItem
                  icon={Eye}
                  label="Showing"
                  value={`${displayLogs.length} of ${logsData?.total ?? 0}`}
                  color="text-slate-300"
                />
              </div>
            </motion.div>
          )}

          {/* ── Search + Filters ── */}
          <motion.div variants={item} className="mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1 group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-blue-400 transition-colors" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search model, provider, ID or status…"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-white placeholder:text-slate-600
                    focus:outline-none focus:border-blue-500/30 focus:bg-white/[0.05] transition-all"
                />
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 items-center px-1.5 rounded border border-white/[0.06] bg-white/[0.02] text-[10px] font-mono text-slate-600">
                  /
                </kbd>
              </div>

              {/* Filter tabs */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                {filters.map(({ key, label, icon: Icon, count }) => {
                  const isActive = statusFilter === key;
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        setStatusFilter(key);
                        setPage(1);
                      }}
                      className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? "text-white"
                          : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="log-filter-pill"
                          className="absolute inset-0 bg-white/[0.06] border border-white/[0.08] rounded-lg"
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 28,
                          }}
                        />
                      )}
                      <Icon className="w-3.5 h-3.5 relative z-10" />
                      <span className="relative z-10">{label}</span>
                      <span
                        className={`relative z-10 text-[10px] font-mono ml-0.5 ${isActive ? "text-slate-400" : "text-slate-700"}`}
                      >
                        {count.toLocaleString()}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* ── Table + Sidebar ── */}
          <motion.div
            variants={item}
            className="grid grid-cols-1 lg:grid-cols-[1fr_18rem] gap-6 mb-6"
          >
            <div>
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="rounded-2xl border border-white/[0.06] bg-[#0A0A0A] overflow-hidden">
                      <div className="px-6 py-3.5 border-b border-white/[0.05] flex gap-6 bg-white/[0.015]">
                        {[
                          "Timestamp",
                          "Model",
                          "Tokens",
                          "Cost",
                          "Latency",
                          "Status",
                        ].map((h) => (
                          <div
                            key={h}
                            className="h-3 w-16 bg-white/[0.05] rounded animate-pulse"
                          />
                        ))}
                      </div>
                      {Array.from({ length: 8 }).map((_, i) => (
                        <SkeletonTableRow key={i} />
                      ))}
                    </div>
                  </motion.div>
                ) : displayLogs.length > 0 ? (
                  <motion.div
                    key="table"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="rounded-2xl border border-white/[0.06] bg-[#0A0A0A] overflow-hidden">
                      {/* Table top edge sheen */}
                      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent pointer-events-none" />

                      <div className="overflow-x-auto hero-scroll">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b border-white/[0.05] bg-white/[0.015]">
                              {[
                                "Timestamp",
                                "Model",
                                "Tokens",
                                "Cost",
                                "Latency",
                                "Status",
                              ].map((h) => (
                                <th
                                  key={h}
                                  className="px-5 py-3.5 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.12em]"
                                >
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/[0.03]">
                            {displayLogs.map((log, i) => (
                              <motion.tr
                                key={log.id}
                                custom={i}
                                variants={tableRow}
                                initial="hidden"
                                animate="visible"
                                onClick={() => handleRowClick(log)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    handleRowClick(log);
                                  }
                                }}
                                role="button"
                                tabIndex={0}
                                aria-label={`View details for ${log.model} request ${log.id}`}
                                className="group relative cursor-pointer transition-all duration-200 hover:bg-white/[0.03] focus:outline-none focus:bg-white/[0.03]"
                              >
                                {/* Left border glow on hover */}
                                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-blue-400 via-violet-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-l" />

                                <td className="px-5 py-3.5 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-3 h-3 text-slate-700 shrink-0" />
                                    <div className="flex flex-col">
                                      <span className="text-sm font-mono text-slate-300 tabular-nums">
                                        {formatTime(log.createdAt)}
                                      </span>
                                      <span className="text-[10px] font-mono text-slate-700">
                                        {formatDateShort(log.createdAt)}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-5 py-3.5 whitespace-nowrap">
                                  <div>
                                    <div className="text-sm font-medium text-white tracking-tight">
                                      {log.model}
                                    </div>
                                    <div className="text-[11px] text-slate-600 font-mono mt-0.5">
                                      {log.provider}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-5 py-3.5 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 min-w-[60px]">
                                      <div className="flex items-center gap-1 text-xs font-mono">
                                        <span className="text-emerald-400">
                                          {log.inputTokens.toLocaleString()}
                                        </span>
                                        <span className="text-slate-700">
                                          /
                                        </span>
                                        <span className="text-cyan-400">
                                          {log.outputTokens.toLocaleString()}
                                        </span>
                                      </div>
                                      {/* Token ratio bar */}
                                      <div className="mt-1.5 h-1 bg-white/[0.04] rounded-full overflow-hidden flex">
                                        {log.inputTokens + log.outputTokens >
                                          0 && (
                                          <>
                                            <div
                                              className="h-full bg-emerald-500/60"
                                              style={{
                                                width: `${(log.inputTokens / (log.inputTokens + log.outputTokens)) * 100}%`,
                                              }}
                                            />
                                            <div
                                              className="h-full bg-cyan-500/60"
                                              style={{
                                                width: `${(log.outputTokens / (log.inputTokens + log.outputTokens)) * 100}%`,
                                              }}
                                            />
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-5 py-3.5 whitespace-nowrap">
                                  <span className="text-sm font-mono text-emerald-400/90 tabular-nums">
                                    {formatCost(log.cost)}
                                  </span>
                                </td>
                                <td className="px-5 py-3.5 whitespace-nowrap">
                                  <div
                                    className={`flex items-center gap-1.5 text-sm font-mono tabular-nums ${latencyColor(log.latency)}`}
                                  >
                                    <Zap className="w-3.5 h-3.5 shrink-0 opacity-60" />
                                    {log.latency}ms
                                  </div>
                                </td>
                                <td className="px-5 py-3.5 whitespace-nowrap">
                                  <StatusBadge
                                    status={
                                      log.status === "success"
                                        ? "success"
                                        : "error"
                                    }
                                    label={log.status}
                                    size="sm"
                                  />
                                </td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-slate-600 font-mono">
                      <Eye className="w-3.5 h-3.5" />
                      Click any row to inspect details
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-24 rounded-2xl border border-white/[0.06] bg-[#0A0A0A]"
                  >
                    <motion.div
                      animate={{ y: [0, -6, 0] }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="inline-block mb-6"
                    >
                      <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                        <Hash className="w-10 h-10 text-slate-700" />
                      </div>
                    </motion.div>
                    <h3 className="text-lg font-semibold text-slate-300 mb-1.5">
                      No logs found
                    </h3>
                    <p className="text-sm text-slate-600 max-w-sm mx-auto">
                      {searchQuery || statusFilter !== "all"
                        ? "Try adjusting your filters or search query."
                        : "Logs will appear here once API requests are made."}
                    </p>
                    {(searchQuery || statusFilter !== "all") && (
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setStatusFilter("all");
                          setPage(1);
                        }}
                        className="mt-5 px-5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-slate-400 hover:text-white hover:border-white/[0.15] transition-all"
                      >
                        Clear filters
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Model Breakdown Sidebar ── */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="relative rounded-2xl border border-white/[0.06] bg-[#0A0A0A] p-5 h-fit overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/10">
                  <Activity className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white tracking-tight">
                    Top Models
                  </h3>
                  <p className="text-[11px] text-slate-600 font-mono mt-0.5">
                    Usage distribution
                  </p>
                </div>
              </div>

              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonBar key={i} />
                  ))}
                </div>
              ) : allLogs.length > 0 ? (
                <ModelBreakdown logs={allLogs} maxItems={7} />
              ) : (
                <EmptySidebar />
              )}
            </motion.div>
          </motion.div>

          {/* ── Pagination ── */}
          {!isLoading && logsData && totalPages > 1 && (
            <motion.div
              variants={item}
              className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-[#0A0A0A] px-5 py-3.5"
            >
              <div className="text-sm text-slate-500 font-mono">
                Page{" "}
                <span className="text-white font-semibold">
                  {logsData.page}
                </span>{" "}
                of{" "}
                <span className="text-white font-semibold">{totalPages}</span>
                <span className="text-slate-700 ml-2">
                  · {displayLogs.length} results
                </span>
              </div>
              <div className="flex items-center gap-2">
                <NavBtn
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </NavBtn>
                <div className="flex gap-1">
                  {generatePages().map((p, i) =>
                    p === "..." ? (
                      <span
                        key={`e-${i}`}
                        className="text-slate-700 text-sm px-2"
                      >
                        ···
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className={`w-8 h-8 rounded-lg text-sm font-mono font-medium transition-all ${
                          p === page
                            ? "bg-white/[0.08] text-white border border-white/[0.1]"
                            : "text-slate-500 hover:text-white hover:bg-white/[0.04] border border-transparent"
                        }`}
                      >
                        {p}
                      </button>
                    ),
                  )}
                </div>
                <NavBtn
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </NavBtn>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      <LogDetailDrawer log={selectedLog} onClose={handleCloseDrawer} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function StatItem({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className={`w-4 h-4 ${color} opacity-60`} />
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`text-sm font-mono font-medium ${color}`}>{value}</span>
    </div>
  );
}

function NavBtn({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="p-2 rounded-lg border border-white/[0.06] text-slate-500 hover:text-white hover:border-white/[0.12] hover:bg-white/[0.03] disabled:opacity-20 disabled:cursor-not-allowed transition-all"
    >
      {children}
    </button>
  );
}

function EmptySidebar() {
  return (
    <div className="text-center py-8">
      <p className="text-sm text-slate-600">No model data</p>
    </div>
  );
}
