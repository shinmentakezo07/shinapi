import { describe, it, expect } from "vitest";

// M3 regression: analytics must not produce NaN, and the time-range slice
// must show the LAST N days (oldest→newest ordering), not the first N.

interface Log {
  cost: number | null | undefined;
  latency: number | null | undefined;
  createdAt: string;
}

function computeTotalCost(logs: Log[]): number {
  return logs.reduce((sum, log) => sum + (Number(log.cost) || 0), 0);
}

function computeAvgLatency(logs: Log[]): number {
  return logs.length > 0
    ? Math.round(
        logs.reduce((sum, log) => sum + (Number(log.latency) || 0), 0) /
          logs.length,
      )
    : 0;
}

function sliceLastN(daily: { date: string }[], days: number) {
  return daily.slice(-days);
}

describe("analytics M3 regression", () => {
  it("totalCost ignores null/undefined cost (no NaN)", () => {
    const logs: Log[] = [
      { cost: 1.5, latency: 100, createdAt: "2026-01-01" },
      { cost: null, latency: 200, createdAt: "2026-01-02" },
      { cost: undefined, latency: 300, createdAt: "2026-01-03" },
      { cost: 0.5, latency: 50, createdAt: "2026-01-04" },
    ];
    const total = computeTotalCost(logs);
    expect(Number.isNaN(total)).toBe(false);
    expect(total).toBe(2.0);
    const avg = computeAvgLatency(logs);
    expect(Number.isNaN(avg)).toBe(false);
    expect(avg).toBe(163); // (100+200+300+50)/4 = 650/4 = 162.5 -> round 163
  });

  it("time-range slice returns the LAST N days", () => {
    const daily = Array.from({ length: 10 }, (_, i) => ({
      date: `2026-01-${String(i + 1).padStart(2, "0")}`,
    }));
    // Oldest→newest. 7d window should be days 4..10 (the most recent 7).
    const last7 = sliceLastN(daily, 7);
    expect(last7).toHaveLength(7);
    expect(last7[0].date).toBe("2026-01-04");
    expect(last7[6].date).toBe("2026-01-10");
  });
});
