"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Coins, Sparkles, Crown, ArrowUpRight } from "lucide-react";
import type { OpenRouterModelData } from "@/types/model";
import { formatPricePerM } from "@/lib/model-utils";
import { getProviderTheme } from "@/lib/model-utils";
import { CostCalculator } from "./CostCalculator";

interface PricingPanelProps {
  model: OpenRouterModelData;
}

const ease = [0.16, 1, 0.3, 1] as const;

function PriceRow({
  label,
  value,
  sub,
  accent,
  delay,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: string;
  delay?: number;
}) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      initial={prefersReduced ? undefined : { opacity: 0, x: -8 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, ease, delay: delay ?? 0 }}
      className="flex items-baseline justify-between py-2.5 first:pt-0 last:pb-0"
    >
      <span className="text-[11px] font-mono text-gray-500">{label}</span>
      <div className="text-right">
        <span
          className="text-base font-bold font-mono tracking-tight"
          style={{
            color: accent || "#fff",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          ${value}
        </span>
        <span className="text-[10px] font-mono text-gray-700 ml-1.5">
          {sub}
        </span>
      </div>
    </motion.div>
  );
}

function TierBadge({ tier, accent }: { tier: Tier; accent: string }) {
  const config = TIER_STYLES[tier];
  const Icon = config.icon;
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.1, ease }}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-mono font-bold tracking-[0.18em] uppercase border"
      style={{
        backgroundColor: `${accent}${config.bgAlpha}`,
        borderColor: `${accent}${config.borderAlpha}`,
        color: accent,
      }}
    >
      <Icon className="w-2.5 h-2.5" />
      {config.label}
    </motion.span>
  );
}

type Tier = "free" | "standard" | "premium" | "experimental";

const TIER_STYLES: Record<
  Tier,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    bgAlpha: string;
    borderAlpha: string;
  }
> = {
  free: {
    label: "Free",
    icon: Sparkles,
    bgAlpha: "15",
    borderAlpha: "30",
  },
  standard: {
    label: "Standard",
    icon: ArrowUpRight,
    bgAlpha: "10",
    borderAlpha: "20",
  },
  premium: {
    label: "Premium",
    icon: Crown,
    bgAlpha: "15",
    borderAlpha: "30",
  },
  experimental: {
    label: "Experimental",
    icon: Sparkles,
    bgAlpha: "10",
    borderAlpha: "20",
  },
};

function classifyTier(model: OpenRouterModelData): Tier {
  const input = parseFloat(formatPricePerM(model, "prompt"));
  const output = parseFloat(formatPricePerM(model, "completion"));
  const blended = (input + output) / 2;
  if (blended === 0) return "free";
  // Premium detection thresholds: blended ≥ $10, or known premium tier model IDs.
  const premiumRegex = /opus|gpt-5|o1-pro|claude.*opus/i;
  if (blended >= 10 || premiumRegex.test(model.id)) return "premium";
  // Experimental is for newer / preview / research models in the $3+ range.
  if (blended >= 3 || /\b(preview|exp|beta|preview-)/i.test(model.id))
    return "experimental";
  return "standard";
}

export function PricingPanel({ model }: PricingPanelProps) {
  const inputPrice = parseFloat(formatPricePerM(model, "prompt"));
  const outputPrice = parseFloat(formatPricePerM(model, "completion"));
  const isFree = inputPrice === 0 && outputPrice === 0;
  const cacheRead = model.pricing?.input_cache_read;
  const cacheWrite = model.pricing?.input_cache_write;
  const hasCache = !!cacheRead || !!cacheWrite;
  const theme = getProviderTheme(model.id);
  const accent = theme?.accent || "#6366f1";
  const prefersReduced = useReducedMotion();
  const tier = classifyTier(model);

  return (
    <motion.section
      initial={prefersReduced ? undefined : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease }}
      aria-label="Pricing"
      id="pricing"
    >
      <div className="flex items-center gap-3 mb-5">
        <span
          className="text-[10px] font-mono font-bold tracking-wider"
          style={{ color: accent }}
        >
          04
        </span>
        <h2 className="text-[10px] font-mono tracking-[0.25em] uppercase text-gray-500">
          Pricing
        </h2>
        <TierBadge tier={tier} accent={accent} />
        <span
          className="flex-1 h-px"
          style={{ backgroundColor: `${accent}12` }}
        />
      </div>

      <div
        className="rounded-2xl border relative overflow-hidden"
        style={{ borderColor: `${accent}12`, backgroundColor: `${accent}04` }}
      >
        {/* Top highlight */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: `linear-gradient(90deg, ${accent}30, transparent)`,
          }}
        />

        {isFree ? null : (
          <div
            className="px-5 py-3 flex items-center gap-2 border-b"
            style={{
              backgroundColor: `${accent}0a`,
              borderColor: `${accent}10`,
            }}
          >
            <Coins className="w-3 h-3" style={{ color: accent }} />
            <span
              className="font-mono text-xs font-bold"
              style={{ color: accent }}
            >
              Yapapa unified billing
            </span>
            <span
              className="font-mono text-[10px] ml-auto"
              style={{ color: `${accent}60` }}
            >
              same price as upstream
            </span>
          </div>
        )}

        <div className="p-5 space-y-px">
          <PriceRow
            label="Input"
            value={formatPricePerM(model, "prompt")}
            sub="/1M tokens"
            accent={accent}
            delay={0}
          />
          <PriceRow
            label="Output"
            value={formatPricePerM(model, "completion")}
            sub="/1M tokens"
            accent={shiftBrightness(accent, 30)}
            delay={0.05}
          />
        </div>

        {hasCache && (
          <div className="px-5 pb-5">
            <div
              className="pt-4"
              style={{ borderTopColor: `${accent}08`, borderTopWidth: 1 }}
            >
              <div className="flex items-center gap-1.5 mb-3">
                <Coins className="w-3 h-3" style={{ color: `${accent}50` }} />
                <span className="text-[9px] font-mono text-gray-600 uppercase tracking-[0.15em]">
                  Context Caching
                </span>
              </div>
              <div className="space-y-px">
                {cacheRead && (
                  <PriceRow
                    label="Cache Read"
                    value={(parseFloat(cacheRead) * 1000000).toFixed(2)}
                    sub="/1M tokens"
                    accent={`${accent}aa`}
                    delay={0.1}
                  />
                )}
                {cacheWrite && (
                  <PriceRow
                    label="Cache Write"
                    value={(parseFloat(cacheWrite) * 1000000).toFixed(2)}
                    sub="/1M tokens"
                    accent={`${accent}aa`}
                    delay={0.15}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {model.pricing?.web_search && (
          <div className="px-5 pb-5">
            <div
              className="pt-4"
              style={{ borderTopColor: `${accent}08`, borderTopWidth: 1 }}
            >
              <PriceRow
                label="Web Search"
                value={(parseFloat(model.pricing.web_search) * 1000).toFixed(2)}
                sub="/1K searches"
                accent={`${accent}aa`}
                delay={0.2}
              />
            </div>
          </div>
        )}

        {!isFree && (
          <div
            className="px-5 py-3"
            style={{
              backgroundColor: `${accent}06`,
              borderTopColor: `${accent}08`,
              borderTopWidth: 1,
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-gray-500">
                Est. 1K tokens
              </span>
              <span
                className="font-mono text-sm font-bold text-white"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                ${((inputPrice + outputPrice) / 1000).toFixed(4)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* NEW — Cost Calculator */}
      <div className="mt-4">
        <CostCalculator model={model} accent={accent} />
      </div>

      {/* NEW — Compare rail hint */}
      {!isFree && (
        <motion.div
          initial={prefersReduced ? undefined : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-3 flex items-center justify-between px-3"
        >
          <span className="text-[9px] font-mono text-gray-600 tracking-wider">
            vs direct upstream
          </span>
          <span
            className="inline-flex items-center gap-1 text-[9px] font-mono font-bold tracking-widest uppercase"
            style={{ color: "#34d399" }}
          >
            <span className="w-1 h-1 rounded-full bg-emerald-400" />
            zero markup
          </span>
        </motion.div>
      )}

      {model.knowledge_cutoff && (
        <div className="mt-5">
          <div className="flex items-center gap-3 mb-3">
            <span
              className="flex-1 h-px"
              style={{ backgroundColor: `${accent}08` }}
            />
            <span className="text-[8px] font-mono text-gray-600 uppercase tracking-[0.15em]">
              Knowledge Cutoff
            </span>
          </div>
          <div
            className="rounded-2xl border px-5 py-3"
            style={{
              borderColor: `${accent}08`,
              backgroundColor: `${accent}02`,
            }}
          >
            <span className="text-white font-mono text-sm tracking-tight">
              {model.knowledge_cutoff}
            </span>
          </div>
        </div>
      )}
    </motion.section>
  );
}

function shiftBrightness(hex: string, amount: number): string {
  const r = Math.min(255, Math.max(0, parseInt(hex.slice(1, 3), 16) + amount));
  const g = Math.min(255, Math.max(0, parseInt(hex.slice(3, 5), 16) + amount));
  const b = Math.min(255, Math.max(0, parseInt(hex.slice(5, 7), 16) + amount));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}
