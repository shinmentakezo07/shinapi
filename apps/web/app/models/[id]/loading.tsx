// Shape-matched loading skeleton for /models/[id] — mirrors the bento grid of the
// resolved detail page so users see structure (hero + 4 stats + 2-col bento) before content
// hydrates. Rendered by Next.js as a Suspense boundary while `use(params)` resolves.

export default function Loading() {
  return (
    <div
      className="min-h-screen bg-[#000000] text-white relative pt-16 sm:pt-20 pb-40"
      aria-busy="true"
      aria-live="polite"
    >
      {/* Ambient placeholder — no animation, just a faint radial wash */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(circle at 70% 18%, rgba(99,102,241,0.06) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <div className="mb-10 h-3 w-24 rounded bg-white/[0.04] animate-pulse motion-reduce:animate-none" />

        {/* Provider chip row */}
        <div className="flex items-center gap-3 mb-5">
          <div className="h-2.5 w-20 rounded bg-white/[0.06] animate-pulse motion-reduce:animate-none" />
        </div>

        {/* Hero: name + logo badge */}
        <div className="flex items-start justify-between gap-8 mb-8">
          <div className="flex-1 space-y-3">
            <div className="h-20 sm:h-24 md:h-32 w-3/4 rounded bg-white/[0.04] animate-pulse motion-reduce:animate-none" />
            <div className="h-5 sm:h-6 w-1/2 rounded bg-white/[0.03] animate-pulse motion-reduce:animate-none" />
          </div>
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/[0.04] border border-white/5 shrink-0 mt-1 animate-pulse motion-reduce:animate-none" />
        </div>

        {/* Accent divider */}
        <div className="h-px w-32 bg-white/10 mb-8 animate-pulse motion-reduce:animate-none" />

        {/* ID pill row */}
        <div className="flex flex-wrap items-center gap-2.5 mb-10">
          <div className="h-8 w-48 rounded-lg bg-white/[0.06] animate-pulse motion-reduce:animate-none" />
          <div className="h-8 w-20 rounded-lg bg-white/[0.04] animate-pulse motion-reduce:animate-none" />
          <div className="h-8 w-24 rounded-lg bg-white/[0.03] animate-pulse motion-reduce:animate-none" />
        </div>

        {/* 4-spec stat grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px rounded-2xl overflow-hidden border border-white/5 bg-white/5 mb-20">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-5 bg-[#060608]"
              style={{
                opacity: 1 - i * 0.04,
              }}
            >
              <div className="h-2 w-12 rounded bg-white/[0.06] mb-2 animate-pulse motion-reduce:animate-none" />
              <div className="h-5 w-20 rounded bg-white/[0.08] mb-1.5 animate-pulse motion-reduce:animate-none" />
              <div className="h-2 w-10 rounded bg-white/[0.03] animate-pulse motion-reduce:animate-none" />
            </div>
          ))}
        </div>

        {/* Bento grid mirror — same 12-col layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 auto-rows-min">
          {/* About — 8 cols */}
          <div className="lg:col-span-8">
            <SectionHeader />
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-6 sm:p-8">
              <div className="space-y-2">
                <div className="h-3 w-full rounded bg-white/[0.05] animate-pulse motion-reduce:animate-none" />
                <div className="h-3 w-11/12 rounded bg-white/[0.05] animate-pulse motion-reduce:animate-none" />
                <div className="h-3 w-10/12 rounded bg-white/[0.05] animate-pulse motion-reduce:animate-none" />
                <div className="h-3 w-9/12 rounded bg-white/[0.05] animate-pulse motion-reduce:animate-none" />
                <div className="h-3 w-8/12 rounded bg-white/[0.04] animate-pulse motion-reduce:animate-none" />
              </div>
            </div>
          </div>

          {/* Performance — 4 cols */}
          <div className="lg:col-span-4">
            <SectionHeader />
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-6 space-y-7">
              <div>
                <div className="flex justify-between mb-3">
                  <div className="h-2 w-20 rounded bg-white/[0.06] animate-pulse motion-reduce:animate-none" />
                  <div className="h-5 w-16 rounded bg-white/[0.08] animate-pulse motion-reduce:animate-none" />
                </div>
                <div className="h-1 w-full rounded-full bg-white/[0.04] animate-pulse motion-reduce:animate-none" />
              </div>
              <div>
                <div className="flex justify-between mb-3">
                  <div className="h-2 w-16 rounded bg-white/[0.06] animate-pulse motion-reduce:animate-none" />
                  <div className="h-5 w-20 rounded bg-white/[0.08] animate-pulse motion-reduce:animate-none" />
                </div>
                <div className="h-1 w-3/4 rounded-full bg-white/[0.04] animate-pulse motion-reduce:animate-none" />
              </div>
            </div>
          </div>

          {/* Architecture — 6 cols */}
          <div className="lg:col-span-6">
            <SectionHeader />
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-6 space-y-5">
              <div className="flex flex-wrap gap-1.5">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-7 w-20 rounded-lg bg-white/[0.04] animate-pulse motion-reduce:animate-none"
                    style={{ animationDelay: `${i * 80}ms` }}
                  />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-5 pt-5 border-t border-white/[0.04]">
                <div>
                  <div className="h-2 w-16 rounded bg-white/[0.05] mb-2 animate-pulse motion-reduce:animate-none" />
                  <div className="h-4 w-24 rounded bg-white/[0.06] animate-pulse motion-reduce:animate-none" />
                </div>
                <div>
                  <div className="h-2 w-20 rounded bg-white/[0.05] mb-2 animate-pulse motion-reduce:animate-none" />
                  <div className="h-4 w-28 rounded bg-white/[0.06] animate-pulse motion-reduce:animate-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Pricing — 3 cols */}
          <div className="lg:col-span-3">
            <SectionHeader />
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-5 space-y-px">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between py-2.5">
                  <div className="h-3 w-12 rounded bg-white/[0.06] animate-pulse motion-reduce:animate-none" />
                  <div className="h-4 w-16 rounded bg-white/[0.08] animate-pulse motion-reduce:animate-none" />
                </div>
              ))}
            </div>
          </div>

          {/* Parameters — 3 cols */}
          <div className="lg:col-span-3">
            <SectionHeader />
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-5">
              <div className="flex flex-wrap gap-1.5">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="h-7 w-16 rounded-lg bg-white/[0.04] animate-pulse motion-reduce:animate-none"
                    style={{ animationDelay: `${i * 40}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Quick start — full width */}
          <div className="lg:col-span-12">
            <SectionHeader />
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] overflow-hidden">
              {/* Terminal header */}
              <div className="flex items-center justify-between px-5 py-2.5 border-b border-white/[0.04]">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-white/[0.06]" />
                    <div className="w-2 h-2 rounded-full bg-white/[0.04]" />
                    <div className="w-2 h-2 rounded-full bg-white/[0.06]" />
                  </div>
                  <div className="h-2 w-12 rounded bg-white/[0.05] animate-pulse motion-reduce:animate-none" />
                </div>
                <div className="h-2 w-12 rounded bg-white/[0.05] animate-pulse motion-reduce:animate-none" />
              </div>
              {/* Code lines */}
              <div className="p-5 space-y-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="h-2.5 rounded bg-white/[0.04] animate-pulse motion-reduce:animate-none"
                    style={{
                      width: `${100 - i * 8}%`,
                      animationDelay: `${i * 60}ms`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeader() {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="h-2.5 w-5 rounded bg-white/[0.06] animate-pulse motion-reduce:animate-none" />
      <div className="h-2.5 w-20 rounded bg-white/[0.05] animate-pulse motion-reduce:animate-none" />
      <span className="flex-1 h-px bg-white/[0.04]" />
    </div>
  );
}
