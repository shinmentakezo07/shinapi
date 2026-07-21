"use client";

import { useState, useMemo, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Key,
  Plus,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Loader2,
  Search,
  Clock,
  Activity,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useKeys, useCreateKey, useDeleteKey } from "@/lib/api/hooks";
import { getErrorMessage } from "@/lib/api/errors";
import { getSDK } from "@/lib/api/sdk";
import { SkeletonList } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
/* ─────────────────────────── Animation Variants ─────────────────────────── */

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 140, damping: 24 },
  },
};

/* ─────────────────────────── Toast (lightweight) ─────────────────────────── */

interface ToastState {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  description?: string;
}

function ToastRegion({
  toasts,
  onDismiss,
}: {
  toasts: ToastState[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)] sm:w-auto"
      role="region"
      aria-label="Notifications"
    >
      <AnimatePresence>
        {toasts.map((t) => {
          const tone =
            t.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
              : t.type === "error"
                ? "border-red-500/30 bg-red-500/10 text-red-100"
                : "border-white/15 bg-white/[0.06] text-white";
          const Icon =
            t.type === "success"
              ? Check
              : t.type === "error"
                ? AlertCircle
                : Sparkles;
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 220, damping: 22 }}
              className={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 backdrop-blur-xl shadow-[0_8px_30px_rgb(0_0_0/0.45)] ${tone}`}
            >
              <span className="mt-0.5 shrink-0">
                <Icon className="w-4 h-4" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-5">{t.title}</p>
                {t.description && (
                  <p className="text-xs opacity-80 mt-0.5 leading-4">
                    {t.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => onDismiss(t.id)}
                className="opacity-60 hover:opacity-100 transition-opacity"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────── Page ─────────────────────────── */

export default function KeysClient() {
  const { data: keys, isLoading, error } = useKeys();
  const createKey = useCreateKey();
  const deleteKey = useDeleteKey();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  /* Resolve SDK once so callers below always go through the typed client. */
  const sdk = getSDK();
  const queryClient = useQueryClient();

  /* Manual refresh via SDK (complements React Query cache invalidations). */
  const refreshKeys = async () => {
    try {
      await sdk.listKeys();
      await queryClient.invalidateQueries({ queryKey: ["keys"] });
      pushToast({ type: "info", title: "Refreshed" });
    } catch (err) {
      pushToast({
        type: "error",
        title: "Refresh failed",
        description: getErrorMessage(err),
      });
    }
  };

  /* Auto-dismiss toasts */
  useEffect(() => {
    if (toasts.length === 0) return;
    const id = toasts[0].id;
    const timer = window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [toasts]);

  const pushToast = (toast: Omit<ToastState, "id">) => {
    setToasts((prev) => [
      ...prev,
      {
        ...toast,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      },
    ]);
  };

  const filteredKeys = useMemo(() => {
    const list = keys ?? [];
    if (!search.trim()) return list;
    const q = search.trim().toLowerCase();
    return list.filter(
      (k) =>
        k.name.toLowerCase().includes(q) ||
        k.id.toLowerCase().includes(q) ||
        (k.key ?? "").toLowerCase().includes(q),
    );
  }, [keys, search]);

  /* Quick stats */
  const stats = useMemo(() => {
    const list = keys ?? [];
    const total = list.length;
    const active = list.filter((k) => !k.revokedAt).length;
    const recentlyUsed = list.filter((k) => {
      if (!k.lastUsed) return false;
      const days = (Date.now() - new Date(k.lastUsed).getTime()) / 86_400_000;
      return days <= 7;
    }).length;
    return { total, active, recentlyUsed };
  }, [keys]);

  /* ─────────────────────────── Handlers ─────────────────────────── */

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(keyId)) newSet.delete(keyId);
      else newSet.add(keyId);
      return newSet;
    });
  };

  const copyToClipboard = async (keyId: string, keyValue: string) => {
    if (!keyValue) {
      pushToast({
        type: "error",
        title: "Nothing to copy",
        description: "Key value is not available.",
      });
      return;
    }
    try {
      await navigator.clipboard.writeText(keyValue);
      setCopiedKey(keyId);
      window.setTimeout(() => setCopiedKey(null), 1800);
      pushToast({ type: "success", title: "Copied to clipboard" });
    } catch {
      pushToast({
        type: "error",
        title: "Copy failed",
        description: "Clipboard access was denied.",
      });
    }
  };

  const maskKey = (key: string | undefined, fallbackId?: string) => {
    if (key) return `${key.slice(0, 12)}${"•".repeat(28)}${key.slice(-4)}`;
    if (fallbackId) {
      const prefix = "dra_";
      const hash = fallbackId.replace(/-/g, "").slice(0, 32).padEnd(32, "x");
      return `${prefix}${hash.slice(0, 8)}${"•".repeat(24)}${hash.slice(24, 28)}`;
    }
    return "dra_••••••••••••••••••••••••••••••••";
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;
    try {
      const created = await createKey.mutateAsync({ name: newKeyName.trim() });
      setNewKeyName("");
      setShowCreateModal(false);
      if (created.key) {
        setNewlyCreatedKey(created.id);
        setVisibleKeys((prev) => new Set(prev).add(created.id));
        window.setTimeout(() => setNewlyCreatedKey(null), 6000);
        pushToast({
          type: "success",
          title: "Key created",
          description: `“${created.name}” is live. Copy it now; it won't be shown again.`,
        });
      } else {
        pushToast({
          type: "info",
          title: "Key created",
          description: created.name,
        });
      }
    } catch {
      // Mutation error surfaces via state below
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    setConfirmDeleteId(null);
    try {
      await deleteKey.mutateAsync(keyId);
      pushToast({ type: "success", title: "Key revoked" });
    } catch {
      // Mutation error surfaces via state below
    }
  };

  const errorMessage = error
    ? getErrorMessage(error)
    : createKey.error
      ? getErrorMessage(createKey.error)
      : deleteKey.error
        ? getErrorMessage(deleteKey.error)
        : null;

  /* ─────────────────────────── Render ─────────────────────────── */

  const deletingId = deleteKey.isPending ? deleteKey.variables : null;

  return (
    <div className="relative min-h-screen pt-6 pb-12 px-4 sm:px-6 lg:px-8 bg-[#050505] overflow-hidden">
      {/* Ambient aurora backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-0"
      >
        <div className="absolute -top-40 -left-32 w-[36rem] h-[36rem] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute top-1/3 -right-32 w-[28rem] h-[28rem] rounded-full bg-fuchsia-500/10 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 w-[24rem] h-[24rem] rounded-full bg-cyan-500/[0.08] blur-[120px]" />
      </div>

      {/* Animated grid overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage:
            "radial-gradient(ellipse at top, rgba(0,0,0,0.6), transparent 70%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at top, rgba(0,0,0,0.6), transparent 70%)",
        }}
      />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="relative max-w-7xl mx-auto space-y-8"
      >
        {/* ───── Header ───── */}
        <motion.header variants={fadeUp} className="relative">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="relative">
                  <div className="absolute inset-0 rounded-xl bg-indigo-500/40 blur-md opacity-70" />
                  <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 via-fuchsia-500/15 to-cyan-500/20 border border-white/10 text-indigo-300">
                    <Key className="w-6 h-6" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-fuchsia-200 bg-clip-text text-transparent">
                    API Keys
                  </h1>
                  <p className="text-sm text-gray-400 mt-1">
                    Manage credentials that authenticate requests to Yapapa.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={refreshKeys}
                aria-label="Refresh keys"
                title="Refresh"
                className="inline-flex items-center justify-center h-10 w-10 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 hover:text-white transition-colors"
              >
                <Activity className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 hover:from-indigo-400 hover:via-violet-400 hover:to-fuchsia-400 shadow-[0_10px_30px_-10px_rgba(124,58,237,0.65)] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 focus-visible:ring-offset-0"
              >
                <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/10" />
                <Plus className="w-4 h-4 relative" />
                <span className="relative">Create New Key</span>
              </button>
            </div>
          </div>

          {/* Hairline accent */}
          <div
            aria-hidden="true"
            className="mt-6 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
          />
        </motion.header>

        {/* ───── Error Banner ───── */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="p-4 rounded-2xl border border-red-500/20 bg-red-500/[0.07] backdrop-blur-md flex items-start gap-3 shadow-[0_8px_30px_-12px_rgba(239,68,68,0.35)]"
            >
              <div className="shrink-0 mt-0.5 p-1.5 rounded-lg bg-red-500/15">
                <AlertCircle className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-red-200 mb-0.5">
                  Something went wrong
                </h3>
                <p className="text-xs text-red-300/80 leading-relaxed">
                  {errorMessage}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ───── Stat Strip ───── */}
        <motion.div
          variants={fadeUp}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <StatTile
            label="Total"
            value={stats.total}
            icon={<Key className="w-4 h-4" />}
            accent="from-indigo-500/30 to-indigo-500/0"
          />
          <StatTile
            label="Active"
            value={stats.active}
            icon={<ShieldCheck className="w-4 h-4" />}
            accent="from-emerald-500/30 to-emerald-500/0"
            status={stats.active > 0 ? "success" : "info"}
            statusLabel={stats.active > 0 ? "Healthy" : "Idle"}
          />
          <StatTile
            label="Used (7d)"
            value={stats.recentlyUsed}
            icon={<Activity className="w-4 h-4" />}
            accent="from-fuchsia-500/30 to-fuchsia-500/0"
          />
        </motion.div>

        {/* ───── Toolbar (Search) ───── */}
        <motion.div
          variants={fadeUp}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
        >
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, ID or key prefix…"
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-indigo-400/40 focus:ring-2 focus:ring-indigo-400/20 transition-all"
              aria-label="Search API keys"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/5"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </motion.div>

        {/* ───── Loading ───── */}
        {isLoading && (
          <SkeletonList
            rows={3}
            className="!space-y-4 [&>*]:!bg-[#0A0A0A] [&>*]:!border [&>*]:!border-white/10 [&>*]:!p-6 [&>*]:!rounded-xl"
          />
        )}

        {/* ───── Empty State ───── */}
        {!isLoading && keys?.length === 0 && (
          <motion.div
            variants={fadeUp}
            className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#0A0A0A] to-[#080808] p-12 text-center"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] rounded-full bg-indigo-500/10 blur-[120px]"
            />
            <div className="relative">
              <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-indigo-500/15 to-fuchsia-500/15 border border-white/10">
                <Key className="w-10 h-10 text-indigo-300" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-white">
                No API keys yet
              </h3>
              <p className="mt-2 text-sm text-gray-400 max-w-md mx-auto">
                Create your first key to start authenticating requests against
                the Yapapa gateway.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 hover:from-indigo-400 hover:via-violet-400 hover:to-fuchsia-400 shadow-[0_10px_30px_-10px_rgba(124,58,237,0.65)] transition-all"
              >
                <Plus className="w-4 h-4" />
                Create your first API key
              </button>
            </div>
          </motion.div>
        )}

        {/* ───── Empty After Filter ───── */}
        {!isLoading && (keys?.length ?? 0) > 0 && filteredKeys.length === 0 && (
          <motion.div
            variants={fadeUp}
            className="p-8 rounded-2xl border border-white/10 bg-white/[0.03] text-center"
          >
            <p className="text-sm text-gray-400">
              No keys match{" "}
              <span className="text-white font-mono">“{search}”</span>.
            </p>
            <button
              onClick={() => setSearch("")}
              className="mt-3 text-xs text-indigo-300 hover:text-indigo-200 underline underline-offset-4"
            >
              Clear search
            </button>
          </motion.div>
        )}

        {/* ───── Key List ───── */}
        {!isLoading && filteredKeys.length > 0 && (
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            <AnimatePresence mode="popLayout">
              {filteredKeys.map((apiKey) => {
                const isNew = newlyCreatedKey === apiKey.id;
                const isDeleting = deletingId === apiKey.id;
                const isRevoked = !!apiKey.revokedAt;
                const visible = visibleKeys.has(apiKey.id);
                const justRevealed = visible && isNew;

                return (
                  <motion.article
                    key={apiKey.id}
                    layout
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, x: 20, scale: 0.98 }}
                    whileHover={{ y: -2 }}
                    transition={{ type: "spring", stiffness: 220, damping: 24 }}
                    className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-b from-[#0C0C0C] to-[#080808] p-5 sm:p-6 transition-all duration-300 ${
                      isNew
                        ? "border-indigo-400/60 shadow-[0_0_0_1px_rgba(99,102,241,0.4),0_18px_60px_-20px_rgba(99,102,241,0.6)]"
                        : "border-white/10 hover:border-white/20"
                    } ${isRevoked ? "opacity-60" : ""}`}
                  >
                    {/* Hover glow */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{
                        background:
                          "radial-gradient(600px circle at var(--mx,50%) var(--my,50%), rgba(99,102,241,0.12), transparent 40%)",
                      }}
                      onMouseMove={(e) => {
                        const r = (
                          e.currentTarget as HTMLDivElement
                        ).getBoundingClientRect();
                        e.currentTarget.style.setProperty(
                          "--mx",
                          `${e.clientX - r.left}px`,
                        );
                        e.currentTarget.style.setProperty(
                          "--my",
                          `${e.clientY - r.top}px`,
                        );
                      }}
                    />

                    {/* Deleting overlay */}
                    {isDeleting && (
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] rounded-2xl flex items-center justify-center z-10"
                      >
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Revoking…
                        </div>
                      </div>
                    )}

                    <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="inline-block w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.7)]" />
                            <h3 className="text-base sm:text-lg font-semibold text-white truncate">
                              {apiKey.name}
                            </h3>
                          </div>
                          <StatusBadge
                            status={isRevoked ? "error" : "success"}
                            label={isRevoked ? "Revoked" : "Active"}
                            size="sm"
                          />
                          {isNew && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-fuchsia-500/10 text-fuchsia-300 text-[10px] font-mono uppercase tracking-wider border border-fuchsia-500/20">
                              <Sparkles className="w-3 h-3" />
                              New
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 mb-3">
                          <div
                            className={`relative flex-1 min-w-0 px-3.5 py-2 rounded-lg border ${
                              justRevealed
                                ? "border-indigo-400/40 bg-indigo-500/[0.06]"
                                : "border-white/10 bg-black/40"
                            } font-mono text-xs sm:text-sm text-gray-200 transition-colors`}
                          >
                            <span className="block truncate select-all">
                              {visible && apiKey.key
                                ? apiKey.key
                                : maskKey(apiKey.key, apiKey.id)}
                            </span>
                            {justRevealed && (
                              <span
                                aria-hidden="true"
                                className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-indigo-400/40 animate-pulse"
                              />
                            )}
                          </div>
                          <IconButton
                            onClick={() => toggleKeyVisibility(apiKey.id)}
                            label={visible ? "Hide key" : "Show key"}
                            disabled={!apiKey.key}
                          >
                            {visible ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </IconButton>
                          <IconButton
                            onClick={() =>
                              copyToClipboard(apiKey.id, apiKey.key || "")
                            }
                            label="Copy to clipboard"
                            disabled={!apiKey.key}
                            highlight={copiedKey === apiKey.id}
                          >
                            {copiedKey === apiKey.id ? (
                              <Check className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </IconButton>
                        </div>

                        <Meta apiKey={apiKey} />
                      </div>

                      <div className="flex items-center gap-1 lg:flex-col lg:items-end">
                        <IconButton
                          onClick={() => setConfirmDeleteId(apiKey.id)}
                          label="Revoke key"
                          tone="danger"
                          className="lg:order-2"
                          disabled={isRevoked}
                        >
                          <Trash2 className="w-4 h-4" />
                        </IconButton>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ───── Info Banner ───── */}
        {!isLoading && (keys?.length ?? 0) > 0 && (
          <motion.aside
            variants={fadeUp}
            className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] backdrop-blur-md flex items-start gap-3"
          >
            <div className="shrink-0 mt-0.5 p-1.5 rounded-lg bg-amber-500/15">
              <AlertCircle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xs leading-relaxed">
              <p className="font-semibold text-amber-200 mb-0.5">
                Keep your keys secure
              </p>
              <p className="text-amber-300/80">
                Treat API keys like passwords. Never commit them to version
                control or share them publicly. The full key value is shown once
                at creation and cannot be retrieved afterwards.
              </p>
            </div>
          </motion.aside>
        )}
      </motion.div>

      {/* ───── Create Modal ───── */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
            onClick={() => !createKey.isPending && setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 14 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 8 }}
              transition={{ type: "spring", stiffness: 240, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#0A0A0A] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.75)]"
            >
              {/* Modal aurora */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[28rem] h-[28rem] rounded-full bg-indigo-500/30 blur-[100px]"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-24 -right-24 w-[20rem] h-[20rem] rounded-full bg-fuchsia-500/20 blur-[100px]"
              />

              <div className="relative p-6 sm:p-7">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <div className="inline-flex p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 via-violet-500/15 to-fuchsia-500/20 border border-white/10 mb-3">
                      <Key className="w-5 h-5 text-indigo-300" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-fuchsia-200 bg-clip-text text-transparent">
                      Create New API Key
                    </h2>
                    <p className="text-sm text-gray-400 mt-1.5 leading-relaxed">
                      Give your key a descriptive name so you can identify it
                      later. The full value is shown <strong>once</strong>.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    disabled={createKey.isPending}
                    aria-label="Close"
                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-40"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1.5 mb-6">
                  <label
                    htmlFor="key-name"
                    className="block text-xs font-mono uppercase tracking-wider text-gray-400"
                  >
                    Key Name
                  </label>
                  <input
                    id="key-name"
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g., Production API, Mobile App"
                    className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder:text-gray-500 text-sm focus:outline-none focus:border-indigo-400/40 focus:ring-2 focus:ring-indigo-400/20 transition-all"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateKey();
                      if (e.key === "Escape") setShowCreateModal(false);
                    }}
                    maxLength={64}
                  />
                  <p className="text-[11px] text-gray-500 pt-1">
                    Letters, numbers, hyphens and spaces. Up to 64 chars.
                  </p>
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-2.5">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    disabled={createKey.isPending}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 text-white text-sm font-medium transition-colors disabled:opacity-40"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateKey}
                    disabled={!newKeyName.trim() || createKey.isPending}
                    className="flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 hover:from-indigo-400 hover:via-violet-400 hover:to-fuchsia-400 shadow-[0_10px_30px_-10px_rgba(124,58,237,0.65)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {createKey.isPending && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    {createKey.isPending ? "Creating…" : "Create Key"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ───── Confirm Delete Inline ───── */}
      <AnimatePresence>
        {confirmDeleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
            onClick={() => setConfirmDeleteId(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ type: "spring", stiffness: 240, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-red-500/20 bg-[#0A0A0A] p-6 shadow-[0_30px_80px_-20px_rgba(239,68,68,0.4)]"
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-[20rem] h-[20rem] rounded-full bg-red-500/20 blur-[80px]"
              />
              <div className="relative">
                <div className="inline-flex p-2 rounded-xl bg-red-500/15 border border-red-500/20 mb-3">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  Revoke this key?
                </h3>
                <p className="text-sm text-gray-400 mt-1.5 leading-relaxed">
                  Any application using this key will lose access immediately.
                  This action cannot be undone.
                </p>
                <div className="flex flex-col-reverse sm:flex-row gap-2.5 mt-5">
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 text-white text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteKey(confirmDeleteId)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-200 text-sm font-semibold transition-colors"
                  >
                    Revoke key
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ───── Toasts ───── */}
      <ToastRegion
        toasts={toasts}
        onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />
    </div>
  );
}

/* ─────────────────────── Sub-components ─────────────────────── */

function StatTile({
  label,
  value,
  icon,
  accent,
  status,
  statusLabel,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
  status?: "success" | "error" | "warning" | "info";
  statusLabel?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0A0A0A]/80 backdrop-blur-md p-4">
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br ${accent} blur-2xl opacity-70`}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-wider text-gray-500">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-bold text-white tabular-nums">
            {value}
          </p>
          {status && statusLabel && (
            <div className="mt-2">
              <StatusBadge status={status} label={statusLabel} size="sm" />
            </div>
          )}
        </div>
        <div className="p-2 rounded-lg bg-white/[0.04] border border-white/10 text-gray-300">
          {icon}
        </div>
      </div>
    </div>
  );
}

function IconButton({
  children,
  onClick,
  label,
  tone = "default",
  highlight = false,
  disabled = false,
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  tone?: "default" | "danger";
  highlight?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const base =
    "p-2 rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed";
  const toneCls =
    tone === "danger"
      ? "text-gray-400 hover:text-red-300 hover:bg-red-500/10"
      : highlight
        ? "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/30"
        : "text-gray-400 hover:text-white hover:bg-white/[0.06]";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      disabled={disabled}
      className={`${base} ${toneCls} ${className ?? ""}`}
    >
      {children}
    </button>
  );
}

function Meta({
  apiKey,
}: {
  apiKey: { createdAt: string; lastUsed?: string };
}) {
  const created = new Date(apiKey.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const lastUsedLabel = apiKey.lastUsed
    ? new Date(apiKey.lastUsed).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Never";
  return (
    <div className="flex flex-wrap items-center gap-4 text-[11px] text-gray-500">
      <span className="inline-flex items-center gap-1.5">
        <Clock className="w-3 h-3 opacity-60" />
        <span>
          Created <span className="text-gray-300 font-medium">{created}</span>
        </span>
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Activity className="w-3 h-3 opacity-60" />
        <span>
          Last used{" "}
          <span className="text-gray-300 font-medium">{lastUsedLabel}</span>
        </span>
      </span>
    </div>
  );
}
