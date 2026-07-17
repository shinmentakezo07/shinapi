"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Search,
  Check,
  Bot,
  ChevronRight,
  ArrowRight,
  Cpu,
  DollarSign,
  Plus,
  Sparkles,
  Layers,
  LayoutGrid,
} from "lucide-react";
import Image from "next/image";
import { EnrichedModel } from "./types";
import { getProviderColor, getAllProviders } from "./ProviderColors";

interface ModelSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  models: EnrichedModel[];
  selectedModels: EnrichedModel[];
  onConfirm: (models: EnrichedModel[]) => void;
}

const MAX_MODELS = 4;

function formatPrice(p?: string): string {
  if (!p) return "—";
  const n = Number(p);
  if (Number.isNaN(n)) return "—";
  if (n === 0) return "free";
  if (n >= 0.01) return `$${n.toFixed(3)}`;
  if (n >= 0.0001) return `$${n.toFixed(4)}`;
  return `$${n.toExponential(1)}`;
}

function formatContext(ctx?: number): string {
  if (!ctx || ctx <= 0) return "—";
  if (ctx >= 1_000_000)
    return `${(ctx / 1_000_000).toFixed(ctx % 1_000_000 ? 1 : 0)}M`;
  if (ctx >= 1000) return `${Math.round(ctx / 1000)}K`;
  return String(ctx);
}

function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text;
  const q = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${q})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="bg-white/20 text-white rounded-sm px-0.5">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

const categoryFilters = [
  { id: null as string | null, label: "All Models", icon: LayoutGrid },
  { id: "latest" as string | null, label: "Latest", icon: Sparkles },
] as const;

/* ───────────────────── Provider Sidebar ───────────────────── */

function ProviderSidebar({
  providers,
  models,
  active,
  onSelect,
  modelCount,
}: {
  providers: string[];
  models: EnrichedModel[];
  active: string | null;
  onSelect: (p: string | null) => void;
  modelCount: number;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 px-2 pb-2">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="relative w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center border border-white/[0.06]">
            <Layers className="w-3.5 h-3.5 text-white/40" />
          </div>
          <div>
            <h2 className="text-[10px] font-bold text-white/70 tracking-[0.15em] uppercase leading-tight">
              Providers
            </h2>
            <p className="text-[9px] text-white/30 font-mono leading-tight">
              {modelCount} models
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto playground-scroll min-h-0 space-y-0.5">
        <button
          onClick={() => onSelect(null)}
          className="relative w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors group hover:bg-white/[0.03]"
        >
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold transition-colors ${
              active === null
                ? "bg-white/[0.1] text-white"
                : "bg-white/[0.03] text-gray-500 group-hover:bg-white/[0.06]"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-white/80 leading-tight">
              All Models
            </div>
            <div className="text-[9px] text-white/30 font-mono">
              {models.length} available
            </div>
          </div>
          {active === null && (
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
          )}
        </button>

        <div className="h-px bg-white/[0.04] mx-2 my-1.5" />

        {providers.map((provider) => {
          const count = models.filter(
            (m) => m.provider.toLowerCase() === provider,
          ).length;
          const color = getProviderColor(`${provider}/model`);
          const isActive = active === provider;

          return (
            <button
              key={provider}
              onClick={() => onSelect(isActive ? null : provider)}
              className="relative w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors group hover:bg-white/[0.03]"
              style={isActive ? { backgroundColor: `${color}14` } : undefined}
            >
              <div
                className="relative w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                style={{
                  backgroundColor: isActive
                    ? `${color}25`
                    : "rgba(255,255,255,0.03)",
                }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium capitalize truncate text-white/80 leading-tight">
                  {provider}
                </div>
                <div
                  className="text-[9px] font-mono leading-tight"
                  style={{
                    color: isActive ? color : "rgba(255,255,255,0.3)",
                  }}
                >
                  {count} model{count !== 1 ? "s" : ""}
                </div>
              </div>

              {isActive && (
                <ChevronRight className="w-3 h-3" style={{ color }} />
              )}
            </button>
          );
        })}

        {providers.length === 0 && (
          <div className="text-center py-6 text-gray-600">
            <p className="text-[11px] font-mono">No providers</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────────────────── Model Card ───────────────────── */

const ModelCard = memo(function ModelCard({
  model,
  isSelected,
  isAtLimit,
  onToggle,
  query,
}: {
  model: EnrichedModel;
  isSelected: boolean;
  isAtLimit: boolean;
  onToggle: () => void;
  query: string;
}) {
  const color = getProviderColor(model.id);
  const ctx = formatContext(model.context_length);

  return (
    <button
      onClick={() => !isAtLimit && onToggle()}
      disabled={isAtLimit}
      className={`group relative w-full text-left rounded-xl p-4 transition-colors ${
        isAtLimit && !isSelected
          ? "cursor-not-allowed opacity-30"
          : "cursor-pointer"
      } ${
        isSelected
          ? "bg-white/[0.04] border border-white/[0.1]"
          : "bg-transparent border border-white/[0.04] hover:border-white/[0.1] hover:bg-white/[0.02]"
      }`}
    >
      <div className="relative space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="relative w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden shrink-0"
              style={{
                backgroundColor: isSelected
                  ? `${color}18`
                  : "rgba(255,255,255,0.03)",
              }}
            >
              {model.logo ? (
                <Image
                  src={model.logo}
                  alt=""
                  width={22}
                  height={22}
                  className="object-contain"
                  unoptimized
                />
              ) : (
                <Bot className="w-4 h-4 text-gray-500" />
              )}
            </div>

            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-white/90 truncate leading-tight">
                {highlightMatch(model.name, query)}
              </div>
              <div
                className="text-[9px] font-mono uppercase tracking-[0.1em] mt-1"
                style={{
                  color: isSelected ? color : "rgba(255,255,255,0.3)",
                }}
              >
                {model.provider}
              </div>
            </div>
          </div>

          <div
            className={`shrink-0 w-6 h-6 rounded-md flex items-center justify-center transition-opacity ${
              isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
            style={{
              backgroundColor: isSelected
                ? `${color}25`
                : "rgba(255,255,255,0.04)",
            }}
          >
            {isSelected ? (
              <Check
                className="w-3.5 h-3.5"
                style={{ color }}
                strokeWidth={3}
              />
            ) : (
              <Plus className="w-3 h-3 text-gray-500" />
            )}
          </div>
        </div>

        {model.description && (
          <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2">
            {model.description}
          </p>
        )}

        <div className="flex items-center gap-4 pt-2.5 border-t border-white/[0.04]">
          <div className="flex items-center gap-1.5 text-white/40">
            <Cpu className="w-3 h-3 opacity-60" />
            <span className="text-[10px] font-mono tracking-tight tabular-nums">
              {ctx}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-white/30">
            <DollarSign className="w-3 h-3 opacity-50" />
            <span className="text-[10px] font-mono tracking-tight tabular-nums">
              {formatPrice(model.pricing?.prompt)}
            </span>
          </div>

          {isSelected && (
            <div
              className="ml-auto text-[9px] font-mono uppercase tracking-widest"
              style={{ color: `${color}cc` }}
            >
              Selected
            </div>
          )}
        </div>
      </div>
    </button>
  );
});

/* ───────────────────── Main Modal ───────────────────── */

export default function ModelSelector({
  isOpen,
  onClose,
  models,
  selectedModels,
  onConfirm,
}: ModelSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [pending, setPending] = useState<EnrichedModel[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPending(selectedModels);
      setSearchQuery("");
      setActiveFilter(null);
      setCategoryFilter(null);
    }
  }, [isOpen, selectedModels]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => searchRef.current?.focus(), 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // Escape key closes
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const providers = useMemo(() => getAllProviders(models), [models]);

  const filteredModels = useMemo(() => {
    let filtered = models;

    if (activeFilter) {
      filtered = filtered.filter(
        (m) => m.provider.toLowerCase() === activeFilter,
      );
    }

    if (categoryFilter === "latest") {
      filtered = [...filtered].sort((a, b) => {
        const dateA = parseInt(String(a?.created || "0"), 10);
        const dateB = parseInt(String(b?.created || "0"), 10);
        return dateB - dateA;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.id.toLowerCase().includes(q) ||
          m.provider.toLowerCase().includes(q) ||
          (m.description || "").toLowerCase().includes(q),
      );
    }

    return filtered;
  }, [models, activeFilter, categoryFilter, searchQuery]);

  const toggleModel = useCallback((model: EnrichedModel) => {
    setPending((prev) => {
      const exists = prev.find((m) => m.id === model.id);
      if (exists) return prev.filter((m) => m.id !== model.id);
      if (prev.length >= MAX_MODELS) return prev;
      return [...prev, model];
    });
  }, []);

  const handleConfirm = useCallback(() => {
    onConfirm(pending);
    onClose();
  }, [pending, onConfirm, onClose]);

  const selectedCount = pending.length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 bg-black/70"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-3 sm:inset-6 lg:inset-10 z-50 flex flex-col rounded-2xl overflow-hidden border border-white/[0.08] bg-[#0a0a0b]"
            role="dialog"
            aria-modal="true"
            aria-label="Select models to compare"
          >
            {/* Header / Search */}
            <div className="shrink-0 border-b border-white/[0.06] bg-[#0d0d0f]">
              <div className="px-5 py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    <input
                      ref={searchRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCategoryFilter(null);
                      }}
                      placeholder="Search models..."
                      className="w-full bg-white/[0.03] border border-white/[0.06] focus:border-white/[0.16] rounded-lg pl-10 pr-10 py-2.5 text-[13px] text-white/90 placeholder:text-gray-600 outline-none transition-colors focus:bg-white/[0.05]"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-500 hover:text-white transition-colors"
                        aria-label="Clear search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {selectedCount > 0 && (
                    <div
                      className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border"
                      style={{
                        backgroundColor: `${getProviderColor(pending[0]?.id || "")}14`,
                        borderColor: `${getProviderColor(pending[0]?.id || "")}33`,
                      }}
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full animate-pulse"
                        style={{
                          backgroundColor: getProviderColor(
                            pending[0]?.id || "",
                          ),
                        }}
                      />
                      <span className="text-[11px] font-medium font-mono tabular-nums text-white/80">
                        {selectedCount}/{MAX_MODELS}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {selectedCount > 0 && (
                    <button
                      onClick={handleConfirm}
                      className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black hover:bg-white/90 text-xs font-semibold transition-colors"
                    >
                      Compare
                      <ArrowRight className="w-3 h-3 opacity-60" />
                    </button>
                  )}

                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors group"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                  </button>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 flex overflow-hidden min-h-0">
              {/* Provider sidebar (desktop) */}
              <div className="hidden lg:flex flex-col w-[220px] min-w-0 shrink-0 border-r border-white/[0.06] bg-[#0a0a0b] p-2 min-h-0">
                <ProviderSidebar
                  providers={providers}
                  models={models}
                  active={activeFilter}
                  onSelect={setActiveFilter}
                  modelCount={filteredModels.length}
                />
              </div>

              <div className="flex-1 flex flex-col min-w-0">
                {/* Filter bar */}
                <div className="shrink-0 px-4 sm:px-5 py-2.5 border-b border-white/[0.04] bg-[#0a0a0b]">
                  <div className="flex items-center gap-2 overflow-x-auto playground-scroll">
                    {categoryFilters.map((cat) => {
                      const Icon = cat.icon;
                      const isActive =
                        categoryFilter === cat.id && !activeFilter;
                      return (
                        <button
                          key={cat.label}
                          onClick={() => {
                            setCategoryFilter(cat.id);
                            setActiveFilter(null);
                            setSearchQuery("");
                          }}
                          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                            isActive
                              ? "bg-white/[0.08] text-white/90"
                              : "text-white/40 hover:text-white/70 hover:bg-white/[0.03]"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {cat.label}
                        </button>
                      );
                    })}

                    <div className="w-px h-5 bg-white/[0.06]" />

                    {/* Mobile provider pills */}
                    <div className="flex lg:hidden items-center gap-1.5">
                      <button
                        onClick={() => setActiveFilter(null)}
                        className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                          activeFilter === null && categoryFilter === null
                            ? "bg-white/[0.08] text-white"
                            : "text-gray-500 hover:text-gray-300"
                        }`}
                      >
                        All
                      </button>
                      {providers.slice(0, 8).map((p) => {
                        const color = getProviderColor(`${p}/model`);
                        const isActive = activeFilter === p;
                        return (
                          <button
                            key={p}
                            onClick={() => {
                              setActiveFilter(isActive ? null : p);
                              setCategoryFilter(null);
                            }}
                            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                              isActive
                                ? "text-white"
                                : "text-gray-500 hover:text-gray-300"
                            }`}
                            style={
                              isActive
                                ? { backgroundColor: `${color}25` }
                                : undefined
                            }
                          >
                            <div
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: color }}
                            />
                            <span className="capitalize">{p}</span>
                          </button>
                        );
                      })}
                      {providers.length > 8 && (
                        <span className="text-[10px] text-gray-600 font-mono px-1">
                          +{providers.length - 8}
                        </span>
                      )}
                    </div>

                    <div className="hidden lg:flex items-center ml-auto text-[10px] text-gray-600 font-mono">
                      {filteredModels.length} result
                      {filteredModels.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto playground-scroll">
                  <div className="px-4 sm:px-5 py-4">
                    {filteredModels.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
                        {filteredModels.map((model) => (
                          <ModelCard
                            key={model.id}
                            model={model}
                            isSelected={pending.some((m) => m.id === model.id)}
                            isAtLimit={
                              pending.length >= MAX_MODELS &&
                              !pending.some((m) => m.id === model.id)
                            }
                            onToggle={() => toggleModel(model)}
                            query={searchQuery}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 bg-white/[0.03] border border-white/[0.06]">
                          <Search className="w-6 h-6 text-white/20" />
                        </div>
                        <p className="text-sm text-gray-400 font-medium mb-1">
                          No models found
                        </p>
                        <p className="text-[12px] text-gray-600 max-w-xs leading-relaxed">
                          {searchQuery
                            ? `No models match "${searchQuery}". Try a different search term.`
                            : "Try adjusting your filters."}
                        </p>
                        {(searchQuery || activeFilter || categoryFilter) && (
                          <button
                            onClick={() => {
                              setSearchQuery("");
                              setActiveFilter(null);
                              setCategoryFilter(null);
                            }}
                            className="mt-4 text-[11px] text-white/60 hover:text-white font-medium transition-colors"
                          >
                            Clear all filters
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer: selected chips + confirm */}
            <div className="shrink-0 border-t border-white/[0.06] bg-[#0d0d0f]">
              <div className="px-4 sm:px-5 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 overflow-x-auto playground-scroll flex-1 min-w-0">
                  {pending.length === 0 ? (
                    <div className="flex items-center gap-2.5 text-white/30">
                      <div className="w-5 h-5 rounded-md border border-dashed border-white/[0.08] flex items-center justify-center">
                        <Plus className="w-3 h-3 opacity-60" />
                      </div>
                      <span className="text-[11px] font-mono">
                        Select up to {MAX_MODELS} models to compare
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {pending.map((model, idx) => {
                        const color = getProviderColor(model.id);
                        return (
                          <div
                            key={model.id}
                            className="group relative flex items-center gap-2 pl-1.5 pr-1 py-1 rounded-lg shrink-0 border"
                            style={{
                              backgroundColor: `${color}10`,
                              borderColor: `${color}33`,
                            }}
                          >
                            <div
                              className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold font-mono"
                              style={{
                                backgroundColor: `${color}30`,
                                color: color,
                              }}
                            >
                              {idx + 1}
                            </div>

                            <div className="relative w-5 h-5 rounded-md bg-white/[0.04] overflow-hidden flex items-center justify-center">
                              {model.logo ? (
                                <Image
                                  src={model.logo}
                                  alt=""
                                  width={12}
                                  height={12}
                                  className="object-contain"
                                  unoptimized
                                />
                              ) : (
                                <Bot className="w-3 h-3 text-gray-500" />
                              )}
                            </div>

                            <span className="text-[11px] font-medium text-white/80 truncate max-w-[90px]">
                              {model.name.split(":")[0]}
                            </span>

                            <button
                              onClick={() =>
                                setPending((prev) =>
                                  prev.filter((m) => m.id !== model.id),
                                )
                              }
                              className="p-0.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-white/10 text-gray-500 hover:text-white transition-opacity"
                              aria-label="Remove model"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}

                      {pending.length < MAX_MODELS && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-dashed border-white/[0.08] text-gray-600">
                          <Plus className="w-3 h-3" />
                          <span className="text-[10px] font-mono">
                            {MAX_MODELS - pending.length} slot
                            {MAX_MODELS - pending.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleConfirm}
                  disabled={pending.length === 0}
                  className="relative flex items-center gap-2.5 px-5 sm:px-6 py-2.5 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-[13px] font-semibold shrink-0 bg-white text-black hover:bg-white/90 transition-colors"
                >
                  <span className="whitespace-nowrap">
                    {pending.length > 0
                      ? `Compare ${pending.length} Model${pending.length > 1 ? "s" : ""}`
                      : "Select Models"}
                  </span>
                  {pending.length > 0 && (
                    <ArrowRight className="w-4 h-4 opacity-60" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
