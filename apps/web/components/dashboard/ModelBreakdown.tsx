"use client";

import { motion } from "framer-motion";
import type { APILog } from "@/lib/api/sdk";

interface ModelBreakdownProps {
  logs: APILog[];
  maxItems?: number;
}

const barColors = [
  "from-blue-500 to-blue-400",
  "from-indigo-500 to-indigo-400",
  "from-violet-500 to-violet-400",
  "from-fuchsia-500 to-fuchsia-400",
  "from-cyan-500 to-cyan-400",
  "from-emerald-500 to-emerald-400",
  "from-amber-500 to-amber-400",
  "from-rose-500 to-rose-400",
];

export function ModelBreakdown({ logs, maxItems = 7 }: ModelBreakdownProps) {
  const modelCounts = logs.reduce<Record<string, number>>((acc, log) => {
    acc[log.model] = (acc[log.model] || 0) + 1;
    return acc;
  }, {});

  const sorted = Object.entries(modelCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxItems);

  const maxCount = sorted.length > 0 ? sorted[0][1] : 1;
  const total = sorted.reduce((sum, [, count]) => sum + count, 0);

  if (sorted.length === 0) return null;

  return (
    <div className="space-y-4">
      {sorted.map(([model, count], i) => {
        const pct = Math.round((count / maxCount) * 100);
        const share = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={model} className="group">
            <div className="flex items-center justify-between mb-1.5">
              <span
                className="text-xs text-slate-400 font-mono w-32 truncate text-right shrink-0"
                title={model}
              >
                {model}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-600 font-mono">{share}%</span>
                <span className="text-xs text-slate-500 font-mono w-6 text-right tabular-nums">
                  {count}
                </span>
              </div>
            </div>
            <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.7, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] as const }}
                className={`h-full rounded-full bg-gradient-to-r ${barColors[i % barColors.length]} opacity-80 group-hover:opacity-100 transition-opacity`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
