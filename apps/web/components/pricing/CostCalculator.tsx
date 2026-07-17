"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator,
  RotateCcw,
  ArrowRight,
  Zap,
  Cpu,
  TrendingUp,
} from "lucide-react";
import Image from "next/image";
import { calculatorModels, calculatorPresets } from "@/lib/pricing-data";

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return `${n}`;
}

function formatCurrency(n: number): string {
  if (n < 0.01) return `$${n.toFixed(4)}`;
  if (n < 1) return `$${n.toFixed(3)}`;
  return `$${n.toFixed(2)}`;
}

// Quick-jump token stops shown beneath each slider for fast, precise input.
const INPUT_STOPS = [1_000, 10_000, 100_000, 500_000, 1_000_000];
const OUTPUT_STOPS = [1_000, 5_000, 50_000, 250_000, 500_000];

function CustomSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  accentColor,
  stops,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  accentColor: string;
  stops: number[];
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const percentage = ((value - min) / (max - min)) * 100;
  const isInput = label.includes("Input");

  const handlePointer = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const raw = min + pct * (max - min);
      const stepped = Math.round(raw / step) * step;
      onChange(Math.max(min, Math.min(max, stepped)));
    },
    [min, max, step, onChange],
  );

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: PointerEvent) => handlePointer(e.clientX);
    const onUp = () => setIsDragging(false);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [isDragging, handlePointer]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowUp")
      onChange(Math.min(max, value + step));
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown")
      onChange(Math.max(min, value - step));
    else if (e.key === "Home") onChange(min);
    else if (e.key === "End") onChange(max);
  };

  const gradientStyle = isInput
    ? "linear-gradient(90deg, rgba(59,130,246,0.95), rgba(96,165,250,0.75), rgba(125,211,252,0.6))"
    : "linear-gradient(90deg, rgba(139,92,246,0.95), rgba(192,132,252,0.75), rgba(216,180,254,0.6))";

  const thumbShadow = isInput
    ? "0 0 0 4px rgba(59,130,246,0.18), 0 0 22px rgba(59,130,246,0.55)"
    : "0 0 0 4px rgba(139,92,246,0.18), 0 0 22px rgba(139,92,246,0.55)";

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-1 h-4 rounded-full ${isInput ? "bg-blue-500" : "bg-violet-500"}`}
          />
          <span className="text-[11px] font-mono tracking-[0.15em] uppercase text-gray-400">
            {label}
          </span>
        </div>
        <motion.span
          key={value}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-sm font-mono font-bold tabular-nums ${isInput ? "text-blue-300" : "text-violet-300"}`}
        >
          {formatTokens(value)}
        </motion.span>
      </div>
      <div
        ref={trackRef}
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={label}
        tabIndex={0}
        onPointerDown={(e) => {
          setIsDragging(true);
          handlePointer(e.clientX);
        }}
        onKeyDown={handleKeyDown}
        className="relative h-2.5 rounded-full bg-white/[0.05] cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-150"
          style={{ width: `${percentage}%`, background: gradientStyle }}
        />
        <div className="absolute inset-0 flex items-center justify-between px-1 pointer-events-none">
          {[0, 0.25, 0.5, 0.75, 1].map((tick, i) => (
            <div key={i} className="w-px h-1 bg-white/10 rounded-full" />
          ))}
        </div>
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-2 border-white/30"
          style={{
            left: `${percentage}%`,
            x: "-50%",
            boxShadow: isDragging
              ? thumbShadow
              : "0 0 10px rgba(255,255,255,0.15)",
          }}
          animate={{ scale: isDragging ? 1.25 : 1 }}
          transition={{ duration: 0.15 }}
        />
        <div
          className={`absolute top-1/2 -translate-y-1/2 h-10 w-10 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${
            isInput ? "bg-blue-500/25" : "bg-violet-500/25"
          }`}
          style={{ left: `${percentage}%`, x: "-50%" }}
        />
      </div>
      <div className="flex items-center justify-between">
        {stops.map((s) => {
          const active = value === s;
          return (
            <button
              key={s}
              onClick={() => onChange(s)}
              className={`text-[10px] font-mono tabular-nums transition-colors ${
                active
                  ? isInput
                    ? "text-blue-300"
                    : "text-violet-300"
                  : "text-gray-600 hover:text-gray-400"
              }`}
            >
              {formatTokens(s)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AnimatedCost({ value }: { value: number }) {
  const [text, setText] = useState(formatCurrency(0));
  const prevValue = useRef(0);

  useEffect(() => {
    const duration = Math.abs(value - prevValue.current) < 0.001 ? 150 : 450;
    const start = prevValue.current;
    const startTime = performance.now();
    let rafId: number;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (value - start) * eased;
      setText(formatCurrency(current));
      if (progress < 1) rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    prevValue.current = value;
    return () => cancelAnimationFrame(rafId);
  }, [value]);

  return <span>{text}</span>;
}

export function CostCalculator() {
  const [selectedModelIndex, setSelectedModelIndex] = useState(0);
  const [inputTokens, setInputTokens] = useState(4000);
  const [outputTokens, setOutputTokens] = useState(1000);
  const [activePreset, setActivePreset] = useState<string | null>("Chat");

  const model = calculatorModels[selectedModelIndex];

  const inputCost = (inputTokens / 1000) * model.inputPricePer1k;
  const outputCost = (outputTokens / 1000) * model.outputPricePer1k;
  const totalCost = inputCost + outputCost;

  const inputPct = totalCost > 0 ? (inputCost / totalCost) * 100 : 50;
  const outputPct = 100 - inputPct;

  const handlePreset = (preset: (typeof calculatorPresets)[0]) => {
    setInputTokens(preset.inputTokens);
    setOutputTokens(preset.outputTokens);
    setActivePreset(preset.label);
  };

  const handleReset = () => {
    setInputTokens(4000);
    setOutputTokens(1000);
    setActivePreset("Chat");
  };

  return (
    <section className="relative w-full py-24 md:py-32 px-4 bg-[#030303] overflow-hidden">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 perspective-1000">
          <motion.div
            animate={{ backgroundPosition: ["0px 0px", "0px 40px"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 bg-grid-white opacity-[0.06] transform-gpu rotate-x-12 scale-150 origin-top"
          />
        </div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[300px] bg-violet-600/5 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#030303_80%)]" />
      </div>

      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden hidden lg:block">
        <div className="absolute top-10 left-10 w-16 h-16 border-l-2 border-t-2 border-blue-500/15 rounded-tl-2xl" />
        <div className="absolute top-10 right-10 w-16 h-16 border-r-2 border-t-2 border-blue-500/15 rounded-tr-2xl" />
        <div className="absolute bottom-10 left-10 w-16 h-16 border-l-2 border-b-2 border-violet-500/15 rounded-bl-2xl" />
        <div className="absolute bottom-10 right-10 w-16 h-16 border-r-2 border-b-2 border-violet-500/15 rounded-br-2xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/25 backdrop-blur-sm mb-6"
          >
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <Calculator className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-blue-400">
              Cost Calculator
            </span>
            <div
              className="w-2 h-2 rounded-full bg-violet-400 animate-pulse"
              style={{ animationDelay: "0.5s" }}
            />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-4 leading-[0.95]"
          >
            Estimate Your{" "}
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-purple-500 bg-clip-text text-transparent">
              Costs
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 max-w-lg mx-auto text-lg font-light"
          >
            Select a model and token count to see exactly what you will pay.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
          {/* LEFT: selectors + sliders */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-3"
          >
            <div className="glass-card rounded-[28px] p-1 relative overflow-hidden group">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-blue-500/[0.08] via-transparent to-violet-500/[0.08]" />

              <div className="relative bg-[#0A0A0A] rounded-[24px] p-6 md:p-8 border border-white/5 z-10">
                <div className="absolute top-0 left-0 w-16 h-px bg-gradient-to-r from-blue-500/40 to-transparent" />
                <div className="absolute top-0 left-0 w-px h-16 bg-gradient-to-b from-blue-500/40 to-transparent" />
                <div className="absolute bottom-0 right-0 w-16 h-px bg-gradient-to-l from-violet-500/40 to-transparent" />
                <div className="absolute bottom-0 right-0 w-px h-16 bg-gradient-to-t from-violet-500/40 to-transparent" />

                {/* Model selector */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-xs font-mono tracking-wide uppercase text-gray-500 flex items-center gap-2">
                      <Cpu className="w-3 h-3" />
                      Model
                    </label>
                    <span className="text-[10px] font-mono text-gray-600">
                      {calculatorModels.length} providers
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {calculatorModels.map((m, i) => (
                      <motion.button
                        key={m.id}
                        onClick={() => setSelectedModelIndex(i)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-300 group/btn ${
                          selectedModelIndex === i
                            ? "bg-white/[0.05] border-blue-500/40 shadow-[0_0_28px_rgba(59,130,246,0.15)]"
                            : "bg-transparent border-white/[0.06] hover:border-white/15 hover:bg-white/[0.02]"
                        }`}
                      >
                        {selectedModelIndex === i && (
                          <motion.div
                            layoutId="model-indicator"
                            className="absolute -top-px left-3 right-3 h-0.5 rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
                            transition={{
                              type: "spring",
                              stiffness: 300,
                              damping: 30,
                            }}
                          />
                        )}
                        <div
                          className={`relative w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 ${
                            selectedModelIndex === i
                              ? "bg-white/10 border border-white/20 shadow-inner"
                              : "bg-white/[0.04] border border-white/[0.06]"
                          }`}
                        >
                          {m.logo ? (
                            <Image
                              src={m.logo}
                              alt={m.provider}
                              width={24}
                              height={24}
                              className="object-contain"
                              unoptimized
                            />
                          ) : (
                            <m.icon className={`w-5 h-5 ${m.color}`} />
                          )}
                        </div>
                        <span
                          className={`text-[10px] font-mono font-bold tracking-wide ${
                            selectedModelIndex === i
                              ? "text-white"
                              : "text-gray-500 group-hover/btn:text-gray-300"
                          }`}
                        >
                          {m.name}
                        </span>
                        <span className="text-[9px] text-gray-600 font-mono">
                          {m.provider}
                        </span>
                        {selectedModelIndex === i && (
                          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Sliders */}
                <div className="space-y-7 mb-8">
                  <CustomSlider
                    label="Input Tokens"
                    value={inputTokens}
                    min={1000}
                    max={1_000_000}
                    step={1000}
                    onChange={setInputTokens}
                    accentColor="blue"
                    stops={INPUT_STOPS}
                  />
                  <CustomSlider
                    label="Output Tokens"
                    value={outputTokens}
                    min={1000}
                    max={500_000}
                    step={1000}
                    onChange={setOutputTokens}
                    accentColor="violet"
                    stops={OUTPUT_STOPS}
                  />
                </div>

                {/* Presets */}
                <div>
                  <label className="text-xs font-mono tracking-wide uppercase text-gray-500 mb-4 block">
                    Use Case Presets
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {calculatorPresets.map((preset) => (
                      <motion.button
                        key={preset.label}
                        onClick={() => handlePreset(preset)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-medium transition-all duration-200 ${
                          activePreset === preset.label
                            ? "bg-blue-500/15 text-blue-300 border border-blue-500/30 shadow-[0_0_16px_rgba(59,130,246,0.1)]"
                            : "bg-white/[0.03] text-gray-400 border border-white/[0.06] hover:border-white/15 hover:text-gray-300 hover:bg-white/[0.05]"
                        }`}
                      >
                        <preset.icon className="w-3.5 h-3.5" />
                        {preset.label}
                      </motion.button>
                    ))}
                    <motion.button
                      onClick={handleReset}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-medium text-gray-500 border border-white/[0.06] hover:border-white/15 hover:text-gray-300 hover:bg-white/[0.03] transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* RIGHT: cost output */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="lg:col-span-2"
          >
            <div className="glass-card rounded-[28px] p-1 relative overflow-hidden group h-full">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-violet-500/[0.08] via-transparent to-blue-500/[0.08]" />

              <div className="relative h-full bg-[#0A0A0A] rounded-[24px] p-6 md:p-8 flex flex-col border border-white/5 z-10 overflow-hidden">
                <div className="absolute -top-32 -right-32 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px]" />
                <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-violet-500/10 rounded-full blur-[80px]" />

                <div className="relative flex-1 flex flex-col">
                  {/* Eyebrow + big cost */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-gray-500">
                        Estimated Cost
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-400/80">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      live
                    </div>
                  </div>

                  <motion.div
                    key={totalCost}
                    initial={{ scale: 0.97, opacity: 0.7 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="text-5xl md:text-6xl font-black tracking-tighter mb-1"
                  >
                    <span className="bg-gradient-to-br from-white via-white to-gray-400 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(255,255,255,0.15)]">
                      <AnimatedCost value={totalCost} />
                    </span>
                  </motion.div>

                  <p className="text-xs text-gray-500 font-mono mb-6">
                    for {formatTokens(inputTokens)} input +{" "}
                    {formatTokens(outputTokens)} output
                  </p>

                  {/* Proportional cost bar — visual anchor */}
                  <div className="mb-6">
                    <div className="flex h-2.5 rounded-full overflow-hidden bg-white/[0.04] shadow-inner">
                      <motion.div
                        className="bg-gradient-to-r from-blue-500 via-blue-400 to-sky-300 relative"
                        animate={{ width: `${inputPct}%` }}
                        transition={{
                          type: "spring",
                          stiffness: 200,
                          damping: 25,
                        }}
                      >
                        {inputPct > 12 && (
                          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-60" />
                        )}
                      </motion.div>
                      <motion.div
                        className="bg-gradient-to-r from-violet-500 via-violet-400 to-fuchsia-300 relative"
                        animate={{ width: `${outputPct}%` }}
                        transition={{
                          type: "spring",
                          stiffness: 200,
                          damping: 25,
                        }}
                      >
                        {outputPct > 12 && (
                          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-60" />
                        )}
                      </motion.div>
                    </div>
                    <div className="flex justify-between mt-2.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                        <span className="text-[10px] text-gray-400 font-mono">
                          Input {inputPct.toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
                        <span className="text-[10px] text-gray-400 font-mono">
                          Output {outputPct.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cost breakdown */}
                  <div className="space-y-1.5 flex-1">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`input-${selectedModelIndex}-${inputTokens}`}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        className="flex items-center justify-between py-3 px-3.5 rounded-lg bg-blue-500/[0.04] border border-blue-500/10"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_6px_rgba(59,130,246,0.5)]" />
                          <span className="text-xs text-gray-400">
                            Input cost
                          </span>
                          <span className="text-[9px] font-mono text-gray-600">
                            {formatTokens(inputTokens)}
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-blue-300 tabular-nums">
                          {formatCurrency(inputCost)}
                        </span>
                      </motion.div>
                    </AnimatePresence>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`output-${selectedModelIndex}-${outputTokens}`}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        className="flex items-center justify-between py-3 px-3.5 rounded-lg bg-violet-500/[0.04] border border-violet-500/10"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_6px_rgba(139,92,246,0.5)]" />
                          <span className="text-xs text-gray-400">
                            Output cost
                          </span>
                          <span className="text-[9px] font-mono text-gray-600">
                            {formatTokens(outputTokens)}
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-violet-300 tabular-nums">
                          {formatCurrency(outputCost)}
                        </span>
                      </motion.div>
                    </AnimatePresence>

                    {/* Model rate card */}
                    <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-white/[0.03] to-transparent border border-white/[0.06]">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-mono uppercase text-gray-500 tracking-wide flex items-center gap-1.5">
                          <TrendingUp className="w-3 h-3" />
                          Model Rate
                        </span>
                        <div className="flex items-center gap-1.5">
                          {model.logo ? (
                            <Image
                              src={model.logo}
                              alt={model.provider}
                              width={14}
                              height={14}
                              className="object-contain"
                              unoptimized
                            />
                          ) : (
                            <model.icon className={`w-3 h-3 ${model.color}`} />
                          )}
                          <span className="text-[10px] font-mono text-gray-400">
                            {model.name}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                        <div className="text-center">
                          <div className="text-[9px] text-gray-600 font-mono uppercase tracking-wide">
                            Input
                          </div>
                          <div className="text-sm font-mono font-bold text-blue-300 mt-0.5">
                            {model.inputPricePer1k}
                          </div>
                          <div className="text-[9px] text-gray-600 font-mono">
                            /1K tokens
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-700" />
                        <div className="text-center">
                          <div className="text-[9px] text-gray-600 font-mono uppercase tracking-wide">
                            Output
                          </div>
                          <div className="text-sm font-mono font-bold text-violet-300 mt-0.5">
                            {model.outputPricePer1k}
                          </div>
                          <div className="text-[9px] text-gray-600 font-mono">
                            /1K tokens
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2 text-[10px] font-mono text-gray-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(34,197,94,0.4)] animate-pulse" />
                      Credits deducted in real-time
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
