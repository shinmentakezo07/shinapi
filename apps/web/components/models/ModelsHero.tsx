"use client";

export function ModelsHero() {
  return (
    <section className="relative min-h-[30dvh] flex flex-col items-center justify-center overflow-hidden bg-[#030303]">
      {/* Signal mesh background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 mesh-gradient animate-mesh-shift opacity-60" />
        <div className="absolute top-1/4 left-1/4 w-[700px] h-[700px] bg-indigo-600/[0.04] rounded-full blur-[140px] animate-glow-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-cyan-600/[0.04] rounded-full blur-[140px] animate-glow-pulse"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/[0.03] rounded-full blur-[120px] animate-glow-pulse"
          style={{ animationDelay: "4s" }}
        />
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#030303_80%)]" />
      </div>

      {/* Oscilloscope trace decoration */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <svg
          viewBox="0 0 1200 200"
          fill="none"
          className="w-full max-w-5xl h-auto opacity-[0.08]"
          preserveAspectRatio="none"
        >
          <path
            d="M0 100 Q 50 60, 100 100 T 200 100 T 300 80 T 400 120 T 500 100 T 600 100 T 700 90 T 800 110 T 900 100 T 1000 100 T 1100 100 T 1200 100"
            stroke="url(#trace-gradient)"
            strokeWidth="2"
          />
          <defs>
            <linearGradient id="trace-gradient" x1="0" y1="0" x2="1200" y2="0">
              <stop stopColor="#22d3ee" stopOpacity="0" />
              <stop offset="0.5" stopColor="#22d3ee" />
              <stop offset="1" stopColor="#818cf8" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </section>
  );
}
