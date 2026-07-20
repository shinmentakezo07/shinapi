"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  CheckCircle,
  ArrowRight,
  TrendingUp,
  Cpu,
  Sparkles,
  Zap,
  Star,
  Brain,
  Activity,
  SlidersHorizontal,
} from "lucide-react";
import { useState, useMemo, useDeferredValue } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ModelCard } from "./ModelCard";
import { getProviderLogo } from "@/lib/provider-logos";
import type { OpenRouterModelData } from "@/types/model";
import { useModelCatalog } from "@/lib/api/hooks";
import { mapCatalogToOpenRouter } from "@/lib/api/model-catalog";

interface Model {
  id: string;
  name: string;
  provider: string;
  inputPrice: string;
  outputPrice: string;
  context: string;
  logo: string | null;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  gradient: string;
  popular: boolean;
  speed: string;
  description?: string | null;
}

const providerConfig: Record<
  string,
  { icon: typeof Cpu; color: string; gradient: string }
> = {
  openai: {
    icon: Sparkles,
    color: "text-emerald-400",
    gradient: "from-emerald-500/20 to-teal-500/20",
  },
  anthropic: {
    icon: Zap,
    color: "text-amber-400",
    gradient: "from-amber-500/20 to-orange-500/20",
  },
  google: {
    icon: Star,
    color: "text-blue-400",
    gradient: "from-blue-500/20 to-cyan-500/20",
  },
  moonshot: {
    icon: Brain,
    color: "text-violet-400",
    gradient: "from-violet-500/20 to-fuchsia-500/20",
  },
  moonshotai: {
    icon: Brain,
    color: "text-violet-400",
    gradient: "from-violet-500/20 to-fuchsia-500/20",
  },
  zhipu: {
    icon: Activity,
    color: "text-cyan-400",
    gradient: "from-cyan-500/20 to-teal-500/20",
  },
  zhipuai: {
    icon: Activity,
    color: "text-cyan-400",
    gradient: "from-cyan-500/20 to-teal-500/20",
  },
  meta: {
    icon: Cpu,
    color: "text-indigo-400",
    gradient: "from-indigo-500/20 to-blue-500/20",
  },
  mistral: {
    icon: Activity,
    color: "text-rose-400",
    gradient: "from-rose-500/20 to-orange-500/20",
  },
  mistralai: {
    icon: Activity,
    color: "text-rose-400",
    gradient: "from-rose-500/20 to-orange-500/20",
  },
  deepseek: {
    icon: Cpu,
    color: "text-teal-400",
    gradient: "from-teal-500/20 to-emerald-500/20",
  },
  "deepseek-ai": {
    icon: Cpu,
    color: "text-teal-400",
    gradient: "from-teal-500/20 to-emerald-500/20",
  },
  xai: {
    icon: Cpu,
    color: "text-red-400",
    gradient: "from-red-500/20 to-orange-500/20",
  },
  alibaba: {
    icon: Cpu,
    color: "text-orange-400",
    gradient: "from-orange-500/20 to-red-500/20",
  },
  qwen: {
    icon: Cpu,
    color: "text-orange-400",
    gradient: "from-orange-500/20 to-red-500/20",
  },
  qw: {
    icon: Brain,
    color: "text-violet-400",
    gradient: "from-violet-500/20 to-fuchsia-500/20",
  },
  gpt: {
    icon: Sparkles,
    color: "text-emerald-400",
    gradient: "from-emerald-500/20 to-teal-500/20",
  },
  claude: {
    icon: Zap,
    color: "text-amber-400",
    gradient: "from-amber-500/20 to-orange-500/20",
  },
  gemini: {
    icon: Star,
    color: "text-blue-400",
    gradient: "from-blue-500/20 to-cyan-500/20",
  },
  llama: {
    icon: Cpu,
    color: "text-indigo-400",
    gradient: "from-indigo-500/20 to-blue-500/20",
  },
  minimax: {
    icon: Activity,
    color: "text-pink-400",
    gradient: "from-pink-500/20 to-rose-500/20",
  },
  minimaxai: {
    icon: Activity,
    color: "text-pink-400",
    gradient: "from-pink-500/20 to-rose-500/20",
  },
  glm: {
    icon: Activity,
    color: "text-cyan-400",
    gradient: "from-cyan-500/20 to-teal-500/20",
  },
};

function getProviderFromId(modelId: string): string {
  return modelId.split("/")[0].toLowerCase();
}

function getProviderDisplayName(providerId: string): string {
  const map: Record<string, string> = {
    openai: "OpenAI",
    anthropic: "Anthropic",
    google: "Google",
    moonshotai: "Moonshot",
    moonshot: "Moonshot",
    meta: "Meta",
    mistralai: "Mistral",
    mistral: "Mistral",
    deepseek: "DeepSeek",
    "deepseek-ai": "DeepSeek",
    xai: "xAI",
    alibaba: "Alibaba",
    qwen: "Qwen",
    zhipuai: "Zhipu",
    zhipu: "Zhipu",
    qw: "Moonshot",
    minimax: "MiniMax",
    minimaxai: "MiniMax",
    glm: "GLM",
  };
  return (
    map[providerId] || providerId.charAt(0).toUpperCase() + providerId.slice(1)
  );
}

const providers = [
  "All",
  "OpenAI",
  "Anthropic",
  "Google",
  "Moonshot",
  "Meta",
  "Mistral",
  "DeepSeek",
  "xAI",
];

const providerLogoUrls: Record<string, string> = {
  OpenAI: "/logos/openai.svg",
  Anthropic: "/logos/anthropic.svg",
  Google: "/logos/google.svg",
  Moonshot: "/logos/moonshot.png",
  Meta: "/logos/meta.svg",
  Mistral: "/logos/mistral.svg",
  DeepSeek: "/logos/deepseek.svg",
  xAI: "/logos/xai.svg",
};

type SortMode = "popular" | "price-input" | "price-output" | "context";

interface ModelsExplorerProps {
  /** Optional SSR/seed models; live catalog is preferred. */
  initialModels?: OpenRouterModelData[];
}

export function ModelsExplorer({ initialModels }: ModelsExplorerProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("All");
  const [sortMode, setSortMode] = useState<SortMode>("popular");

  const deferredQuery = useDeferredValue(searchQuery);
  const deferredProvider = useDeferredValue(selectedProvider);
  const isSearchStale = searchQuery !== deferredQuery;

  const {
    data: catalog,
    isLoading: catalogLoading,
    isError: catalogError,
    error: catalogErr,
    refetch: refetchCatalog,
  } = useModelCatalog();

  const sourceModels = useMemo(() => {
    if (catalog != null) {
      return mapCatalogToOpenRouter(catalog);
    }
    return initialModels ?? [];
  }, [catalog, initialModels]);

  const models = useMemo(() => {
    return sourceModels.map((model) => {
      const providerId = getProviderFromId(model.id);
      const config = providerConfig[providerId] || {
        icon: Cpu,
        color: "text-gray-400",
        gradient: "from-gray-500/20 to-gray-500/20",
      };

      const inputPrice = model.pricing?.prompt
        ? `$${(parseFloat(model.pricing.prompt) * 1000000).toFixed(2)}`
        : "$0.00";
      const outputPrice = model.pricing?.completion
        ? `$${(parseFloat(model.pricing.completion) * 1000000).toFixed(2)}`
        : "$0.00";
      const context = model.context_length
        ? `${(model.context_length / 1000).toFixed(0)}K`
        : "N/A";
      const logo = getProviderLogo(model.id);

      return {
        ...model,
        id: model.id,
        name: model.name,
        provider: getProviderDisplayName(providerId),
        inputPrice,
        outputPrice,
        context,
        icon: config.icon,
        color: config.color,
        gradient: config.gradient,
        logo,
        description: model.description ?? undefined,
        popular: model.created > 1743465600,
        speed: (model.context_length ?? 0) > 500000 ? "Fast" : "Very Fast",
      };
    });
  }, [sourceModels]);

  const filteredModels = useMemo(() => {
    const result = models.filter((model) => {
      const q = deferredQuery.toLowerCase();
      const matchesSearch =
        model.name.toLowerCase().includes(q) ||
        model.provider.toLowerCase().includes(q) ||
        model.id.toLowerCase().includes(q);
      const matchesProvider =
        deferredProvider === "All" ||
        model.provider.toLowerCase().includes(deferredProvider.toLowerCase());
      return matchesSearch && matchesProvider;
    });

    return [...result].sort((a, b) => {
      switch (sortMode) {
        case "popular":
          return (b.popular ? 1 : 0) - (a.popular ? 1 : 0);
        case "price-input":
          return (
            parseFloat(a.inputPrice.slice(1)) -
            parseFloat(b.inputPrice.slice(1))
          );
        case "price-output":
          return (
            parseFloat(a.outputPrice.slice(1)) -
            parseFloat(b.outputPrice.slice(1))
          );
        case "context":
          return parseInt(b.context) - parseInt(a.context);
        default:
          return 0;
      }
    });
  }, [models, deferredQuery, deferredProvider, sortMode]);

  const featuredModels = useMemo(() => {
    return models.filter((m) => m.popular).slice(0, 3);
  }, [models]);

  const hasActiveFilters = searchQuery !== "" || selectedProvider !== "All";

  const handleModelClick = (modelId: string) => {
    router.push(`/models/${encodeURIComponent(modelId)}`);
  };

  const uniqueProviders = new Set(models.map((m) => m.provider)).size;

  return (
    <section className="relative w-full pt-20 pb-24 md:pt-24 md:pb-32 px-4 bg-[#030303] overflow-hidden">
      {/* Background atmosphere */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-500/[0.04] rounded-full blur-[140px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-cyan-500/[0.03] rounded-full blur-[140px]" />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {catalogLoading && !sourceModels.length && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
            <p className="text-sm text-gray-500 font-mono">
              Loading model catalog…
            </p>
          </div>
        )}
        {catalogError && (
          <div className="mb-8 p-4 rounded-2xl border border-red-500/20 bg-red-500/5 text-center">
            <p className="text-sm text-red-400 mb-2">
              Failed to load models
              {catalogErr instanceof Error ? `: ${catalogErr.message}` : ""}
            </p>
            <button
              type="button"
              onClick={() => refetchCatalog()}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 underline"
            >
              Retry
            </button>
          </div>
        )}
        {!catalogLoading && !catalogError && sourceModels.length === 0 && (
          <div className="mb-12 p-8 rounded-2xl border border-white/10 bg-white/[0.02] text-center">
            <p className="text-white font-semibold mb-2">
              No models configured
            </p>
            <p className="text-sm text-gray-400 max-w-md mx-auto">
              An admin can add a provider (endpoint, API key, and model IDs)
              under Admin → Providers. Models appear here and in the playground
              automatically.
            </p>
          </div>
        )}

        {/* Page Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-3 mb-6"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
            </span>
            <span className="text-[11px] font-mono font-bold tracking-[0.2em] uppercase text-gray-500">
              Model Registry
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-4 leading-[1.1]"
          >
            Every Model,{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-indigo-300 to-violet-300 bg-clip-text text-transparent">
              One Bill
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto font-light leading-relaxed"
          >
            Browse{" "}
            <span className="text-white font-medium">
              {sourceModels.length || "your"} AI model
              {sourceModels.length === 1 ? "" : "s"}
            </span>{" "}
            across {uniqueProviders} providers. Compare pricing, context
            windows, and capabilities.
          </motion.p>
        </div>

        {/* Sticky Control Rail */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          className="sticky top-4 z-30 mb-12"
        >
          <div className="rounded-2xl border border-white/[0.07] bg-[#06060A]/95 backdrop-blur-xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            <div className="flex flex-col lg:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1 group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/10 via-indigo-500/10 to-cyan-500/10 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 blur-md" />
                <div className="relative flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] focus-within:border-cyan-500/25 transition-all">
                  <Search className="w-4 h-4 text-gray-500 group-focus-within:text-cyan-400 transition-colors shrink-0" />
                  <input
                    type="text"
                    placeholder="Search by name, provider, or model ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-gray-600 font-mono text-sm min-w-0"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="text-gray-500 hover:text-gray-300"
                      aria-label="Clear search"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                      >
                        <path
                          d="M3 3L11 11M11 3L3 11"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  )}
                  {(searchQuery || isSearchStale) && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={`px-2 py-0.5 text-xs font-mono font-bold rounded-md border shrink-0 ${
                        isSearchStale
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                      }`}
                    >
                      {isSearchStale ? "..." : filteredModels.length}
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                  <SlidersHorizontal className="w-4 h-4 text-gray-500" />
                  <select
                    value={sortMode}
                    onChange={(e) => setSortMode(e.target.value as SortMode)}
                    className="bg-transparent text-sm text-gray-300 font-mono outline-none cursor-pointer appearance-none pr-4"
                    style={{
                      backgroundImage:
                        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2371717a' stroke-width='1.5' fill='none'/%3E%3C/svg%3E\")",
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right center",
                    }}
                  >
                    <option value="popular" className="bg-[#111]">
                      Sort: Popular
                    </option>
                    <option value="price-input" className="bg-[#111]">
                      Sort: Input Price
                    </option>
                    <option value="price-output" className="bg-[#111]">
                      Sort: Output Price
                    </option>
                    <option value="context" className="bg-[#111]">
                      Sort: Context
                    </option>
                  </select>
                </div>
              </div>
            </div>

            {/* Provider tabs */}
            <div className="relative mt-3">
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                {providers.map((provider) => {
                  const isActive = selectedProvider === provider;
                  const logoUrl =
                    provider !== "All" ? providerLogoUrls[provider] : null;
                  return (
                    <button
                      key={provider}
                      onClick={() => setSelectedProvider(provider)}
                      className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold tracking-wider uppercase transition-all whitespace-nowrap ${
                        isActive
                          ? "text-black"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="provider-pill"
                          className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-lg"
                          transition={{
                            type: "spring",
                            bounce: 0.2,
                            duration: 0.5,
                          }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-2">
                        {isActive && <CheckCircle className="w-3.5 h-3.5" />}
                        {logoUrl && (
                          <Image
                            src={logoUrl}
                            alt={`${provider} logo`}
                            width={14}
                            height={14}
                            className="object-contain"
                            unoptimized
                          />
                        )}
                        {provider}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Featured Section */}
        <AnimatePresence>
          {!hasActiveFilters && featuredModels.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-16"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold tracking-tight text-white">
                  Signal Picks
                </h2>
                <span className="text-[10px] font-mono text-gray-600 uppercase tracking-wider bg-white/[0.03] px-2 py-0.5 rounded-md border border-white/[0.05]">
                  Popular
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-white/[0.08] to-transparent" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {featuredModels.map((model, i) => (
                  <ModelCard
                    key={model.id}
                    model={model}
                    index={i}
                    onClick={() => handleModelClick(model.id)}
                    featured={i === 0}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* All Models Grid */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Cpu className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold tracking-tight text-white">
                {hasActiveFilters ? "Results" : "All Models"}
              </h2>
            </div>
            <span className="text-xs font-mono text-gray-500 tabular-nums">
              {filteredModels.length} model
              {filteredModels.length !== 1 ? "s" : ""}
            </span>
          </div>

          {filteredModels.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredModels.map((model, i) => (
                <ModelCard
                  key={model.id}
                  model={model}
                  index={i}
                  onClick={() => handleModelClick(model.id)}
                />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-24"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-6">
                <Search className="w-6 h-6 text-gray-600" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                No models found
              </h3>
              <p className="text-gray-500 font-mono text-sm mb-8">
                Try adjusting your search or filters.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedProvider("All");
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/[0.08] hover:border-white/[0.15] rounded-xl text-sm font-mono transition-all"
              >
                Clear Filters
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </div>

        {/* Bottom Stats */}
        {filteredModels.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-20 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10"
          >
            {[
              { label: "Total Models", value: models.length },
              { label: "Providers", value: uniqueProviders },
              {
                label: "Popular",
                value: models.filter((m) => m.popular).length,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-2.5 text-xs text-gray-500 font-mono"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_6px_rgba(34,211,238,0.4)]" />
                {stat.label}{" "}
                <span className="text-white font-bold tabular-nums">
                  {stat.value}
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
