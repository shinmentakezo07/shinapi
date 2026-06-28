"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Coins, Zap, Calculator } from "lucide-react";
import type { OpenRouterModelData } from "@/types/model";
import { formatPricePerM } from "@/lib/model-utils";

interface CostCalculatorProps {
  model: OpenRouterModelData;
  accent: string;
}

const ease = [0.16, 1, 0.3, 1] as const;

// Preset chips to give common real-world anchors
const PRESETS: { label: string; input: number; output: number }[] = [
  { label: "Tweet", input: 80, output: 60 },
  { label: "Email", input: 350, output: 220 },
  { label: "Page", input: 1800, output: 900 },
  { label: "Doc", input: 8000, output: 3500 },
  { label: "Report", input: 25000, output: 12000 },
];

function toFixedTrim(n: number, digits = 4): string {
  return n.toFixed(digits).replace(/0+$/, "").replace(/\.$/, "");
}

export function CostCalculator({ model, accent }: CostCalculatorProps) {
  const prefersReduced = useReducedMotion();
  const inputPrice = parseFloat(formatPricePerM(model, "prompt"));
  const outputPrice = parseFloat(formatPricePerM(model, "completion"));
  const isFree = inputPrice === 0 && outputPrice === 0;

  const max =
    model.context_length && model.context_length > 0
      ? Math.min(model.context_length, 200_000)
      : 32_000;

  const [total, setTotal] = useState<number>(4096); // default ~ page+doc
  const split = 0.45; // typical output:input ratio

  const { inputTokens, outputTokens, cost } = useMemo(() => {
    const t = Math.min(total, max);
    const out = Math.round(t * split);
    const inT = t - out;
    const c =
      (inT / 1_000_000) * inputPrice + (out / 1_000_000) * outputPrice;
    return { inputTokens: inT, outputTokens: out, cost: c };
  }, [total, split, inputPrice, outputPrice, max]);

  const sliderPct = max === 0 ? 0 : (total / max) * 100;

  if (isFree) {
    return (
      <div
        className="rounded-xl border px-4 py-3 flex items-center gap-3"
        style={{
          borderColor: `${accent}12`,
          backgroundColor: `${accent}06`,
        }}
      >
        <Coins className="w-3.5 h-3.5 shrink-0" style={{ color: accent }} />
        <div className="flex-1 min-w-0">
          <div className="font-mono text-xs font-bold text-white">
            Free tier — no cost calculation needed
          </div>
          <div className="font-mono text-[10px] text-gray-500 mt-0.5">
            Yapapa absorbs compute for this model
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={prefersReduced ? undefined : { opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease }}
      className="rounded-xl border relative overflow-hidden"
      style={{
        borderColor: `${accent}12`,
        backgroundColor: `${accent}04`,
      }}
    >
      {/* Top highlight */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(90deg, ${accent}30, transparent)`,
        }}
        aria-hidden="true"
      />

      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <Calculator className="w-3 h-3" style={{ color: `${accent}70` }} />
            <span className="text-[9px] font-mono text-gray-500 uppercase tracking-[0.16em]">
              Cost Calculator
            </span>
          </div>
          <span className="text-[9px] font-mono text-gray-600">
            drag to explore
          </span>
        </div>

        {/* Preset chips */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {PRESETS.map((p) => {
            const chipTotal = p.input + p.output;
            const active = Math.abs(total - chipTotal) < 50;
            return (
              <button
                key={p.label}
                onClick={() => setTotal(chipTotal)}
                className="px-2.5 py-1 rounded-md text-[10px] font-mono font-semibold border transition-all cursor-pointer"
                style={{
                  backgroundColor: active ? `${accent}12` : "rgba(255,255,255,0.02)",
                  borderColor: active ? `${accent}30` : "rgba(255,255,255,0.05)",
                  color: active ? "#fff" : "rgba(255,255,255,0.55)",
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Slider control */}
        <div className="relative">
          {/* Track */}
          <div
            className="h-1.5 rounded-full"
            style={{ backgroundColor: `${accent}15` }}
            aria-hidden="true"
          />
          <div
            className="absolute inset-y-0 left-0 h-1.5 rounded-full pointer-events-none"
            style={{
              width: `${sliderPct}%`,
              backgroundColor: accent,
              boxShadow: `0 0 12px ${accent}50`,
            }}
            aria-hidden="true"
          />
          {/* Native input — invisible, but interactive */}
          <input
            type="range"
            min={256}
            max={max}
            step={128}
            value={total}
            onChange={(e) => setTotal(parseInt(e.target.value, 10))}
            className="absolute inset-0 w-full h-1.5 opacity-0 cursor-grab active:cursor-grabbing"
            aria-label="Adjust token count"
            aria-valuemin={256}
            aria-valuemax={max}
            aria-valuenow={total}
          />
          {/* Thumb */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 pointer-events-none"
            style={{
              borderColor: accent,
              backgroundColor: "#000",
              boxShadow: `0 0 16px ${accent}60`,
            }}
            animate={{
              left: `calc(${sliderPct}% - 8px)`,
            }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            aria-hidden="true"
          />
        </div>

        {/* Hidden helper for keyboard users — show value as numeric input */}
        <div className="flex items-center justify-between mt-2 mb-4 font-mono text-[9px]">
          <span className="text-gray-600">0</span>
          <span className="text-gray-500">{(total / 1000).toFixed(1)}K tokens</span>
          <span className="text-gray-600">{(max / 1000).toFixed(0)}K</span>
        </div>

        {/* Output triplet */}
        <div
          className="grid grid-cols-3 gap-2 pt-4 border-t"
          style={{ borderColor: `${accent}10` }}
        >
          <Stat
            label="Input"
            value={inputTokens.toLocaleString()}
            sub="tokens"
          />
          <Stat
            label="Output"
            value={outputTokens.toLocaleString()}
            sub="tokens"
          />
          <Stat
            label="Cost"
            value={cost === 0 ? "$0" : `$${toFixedTrim(cost, 4)}`}
            sub={cost === 0 ? "free" : "~ per call"}
            highlight
            color={cost === 0 ? "#34d399" : accent}
            flash={total}
          />
        </div>

        {/* Throughput hint */}
        <div className="flex items-center gap-1.5 mt-3">
          <Zap className="w-3 h-3 shrink-0" style={{ color: `${accent}70` }} />
          <span className="font-mono text-[10px] text-gray-500 leading-snug">
            Standard 1:1 ratio; output ≈ {Math.round(split * 100)}% of total.
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function Stat({
  label,
  value,
  sub,
  highlight,
  color,
  flash,
}: {
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
  color?: string;
  flash?: number;
}) {
  const prefersReduced = useReducedMotion();
  return (
    <motion.div
      key={`${label}-${flash}`}
      initial={prefersReduced || highlight ? undefined : { opacity: 0.5 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="px-2"
    >
      <div className="text-[8px] font-mono text-gray-500 uppercase tracking-[0.14em] mb-1">
        {label}
      </div>
      <div
        className={`font-mono font-bold tracking-tight text-[14px] ${highlight ? "text-base" : ""}`}
        style={{
          color: color || "#fff",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      <div className="font-mono text-[9px] text-gray-600 mt-0.5">{sub}</div>
    </motion.div>
  );
}

