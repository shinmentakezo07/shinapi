# Hero — "Layered Glow" Visual Polish

**Date**: 2026-07-19
**Status**: Approved (design phase)
**Affects**: `apps/web/components/Hero.tsx`, `apps/web/app/globals.css`
**Direction**: Bold & vibrant (user-selected). Approach A per brainstorm — surgical layer-by-layer polish, no refactor.

## Context

The current hero (`apps/web/components/Hero.tsx`, ~1,131 lines) renders well but reads as a default "AI startup" landing page when fresh-loaded — the gradient orbs are a soft pastel, the aurora sweep is restrained, the headline text lacks a drawn-in shimmer, the buttons hover without feeling "powered up," and the terminal glow sits at a single layer. We've repeatedly shipped visual upgrades to docs/playground/models but the landing hero hasn't been revisited. The user flagged this on 2026-07-19 and asked for a bold, vibrant upgrade across four specific areas: background, terminal, headline, buttons.

User-selected direction: **Bold & vibrant**. Approach: **A — Layered Glow**. User confirmed all four areas on 2026-07-19.

## Concept

Layer depth into every dimension that already exists rather than introducing new visual concepts. The hero keeps its current commit (hacker-aesthetic + tech showcase + scroll parallax + typewriter + 3D terminal + floating-language billboard + HUD overlay), but each visual layer gets richer color saturation, more layers per effect, stronger glow halos, and slightly snappier motion. Result: a hero that feels "powered up" from frame one — deeper indigo/violet/fuchsia/cyan palette, glow halos everywhere, drawn-in text shimmer, hovering pulse on the CTA, and ambient particle field that makes the dark space feel alive.

The frame reads as the same product — not a redesign. Specifically: no new components, no new sections, no changes to typography hierarchy or layout grid.

## Palette

Add these inline to the existing Tailwind utility surface (no `@theme` changes — the palette is consumed via existing arbitrary-value syntax and `style={{...}}` where static gradients apply):

- Indigos: `indigo-500/600/700` — primary cool tone
- Violets: `violet-400/500/600` — bridge tone
- Fuchsias: `fuchsia-400/500` — accent warmth
- Cyans: `cyan-300/400` — pointer/highlight tone

Existing utilities (`from-purple-600`, `to-pink-600`, etc.) get replaced with the richer palette where they appear in the hero.

## Area 1 — Background Effects

**`HeroBackground` (lines 753-812), `Hero` section bg, `FloatingLogos` (unchanged).**

- **Three gradient orbs — richer colors, stronger blur, slightly larger**:
  - Orb A (top-left): `bg-indigo-500/35` → `bg-violet-500/25`, size `[36rem]` square, blur `160px` (was `indigo-500/20` @ `34rem` / `120px`). Drift animation unchanged (already 18s ease-in-out).
  - Orb B (right): `bg-violet-600/32` → `bg-fuchsia-500/20`, `32rem` square, `150px` blur (was `violet-500/18` @ `30rem` / `120px`).
  - Orb C (bottom-left): `bg-cyan-400/28` → `bg-indigo-500/20` gradient via stacked divs, `30rem` square, `140px` blur (was `cyan-400/12` @ `28rem` / `110px`).
  - Implementation: keep the three single-color `bg-*` rounded divs (Tailwind utility compat), increase opacity and size. We accept the higher saturation; the existing `mix-blend` with grid + noise still softens the look.
- **Particle field — new layer, ~40 dots, GPU-friendly**:
  - Position: rendered inside `HeroBackground` as siblings of the orbs (after orbs, before grid).
  - Each dot is `w-1 h-1 rounded-full bg-white/40` (varying via per-dot `opacity` inline-style between 0.25-0.7).
  - Position: pseudo-random absolute coordinates, generated once via `useMemo` (seeded from `Math.random()` — shape doesn't need to be deterministic). 40 dots total, scattered across the visible 100vw×100vh.
  - Animation: each dot gets its own `--twinkle-delay` (0-4s) and `--twinkle-dur` (3-6s) inline CSS variables, plus class `hero-twinkle` (already exists in CSS). Pure opacity + scale transforms — GPU-composited.
  - Performance: 40 dots × 1 transform each = trivially under paint/stripe budget. `will-change: opacity, transform` already set on `.hero-twinkle`.
- **Aurora sweep — wider, with a secondary cyan band**:
  - Current: a single `.hero-aurora` class band (defined in CSS, 9s sweep). Keep it; widen the gradient's blur and increase peak opacity from 0.5 → 0.7.
  - New: add a secondary `<div>` with class `hero-aurora hero-aurora-b` (cyan-tinted, narrower ~200px, animation-duration 11s, animation-delay -3s). Phase-shifted via `animation-delay` so the two bands staggered visually.
  - `mix-blend-screen` on both bands so they brighten the background rather than overlay it.
- **Hero-conic-spin (decorative behind headline)** — `.hero-conic-spin` already exists in CSS. Add a single `div.hero-conic-spin` behind the headline at 700×700px, 240px blur, indigo→violet conic, very subtle (`opacity-20`). Already keyed for rotation; just add the element.
- **Mouse spotlight** (lines 757-776, `requestAnimationFrame` listener):
  - Increase radius from `820px` → `1100px`. Increase center stop opacity from `0.13` → `0.18`. Color stays indigo (`99,102,241`). Add a secondary inner spotlight stop at 320px radius with `rgba(167,139,250,0.10)` for a hot core. The mouse still gets a halo.
- **Vignette** — strengthen slightly: outer stop `rgba(0,0,0,0.42)` instead of `0.38`.
- **Section bg color** — `bg-[#050505]` → `bg-[#04030a]` (subtly bluer-dark, makes the indigo orbs pop more). Also update the outer `app/page.tsx` wrapper if it conflicts (it sets `bg-[#000000]` — leave as-is so the transition is clean).

## Area 2 — Terminal Glow & Polish

**`InteractiveTerminal` (lines 435-599).**

- **Stacked ambient halo behind terminal** (line 466):
  - Replace single `<div class="absolute -inset-10 bg-gradient-to-r from-blue-600/30 via-purple-600/30 to-pink-600/30 rounded-[40px] blur-3xl opacity-40 group-hover:opacity-60 ...">` with two stacked halos:
    - Outer halo: `-inset-16`, `bg-gradient-to-r from-indigo-600/45 via-violet-600/40 to-fuchsia-500/35`, `blur-[180px]`, `opacity-50 group-hover:opacity-75`, `animate-pulse-slow` (already used elsewhere).
    - Inner accent halo: `-inset-4`, `bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.18),transparent_70%)]`, `blur-[100px]`, `opacity-60`.
  - Both rendered as siblings so they composite correctly.
- **Glass shine sweep on hover** — new `<div>` inside the terminal root (after existing ambient outer halo, before the motion div). Default `opacity-0 group-hover:opacity-100`, transition `300ms`. Style: `bg-[linear-gradient(110deg,transparent_30%,rgba(255,255,255,0.08)_50%,transparent_70%)]` + `translate-x-[-100%]` → `translate-x-[100%]` transition on hover via `group-hover:translate-x-[100%]`, duration 700ms ease-out. Subtle — not a replacement of the existing shimmer, just another layer that travels on hover.
- **Scanline overlay** — new `<div>` positioned absolute over the code area (line 506 onwards). Default opacity 0.18, scales up to 0.28 on group-hover. Style: `absolute inset-0 pointer-events-none [background-image:repeating-linear-gradient(0deg,transparent_0px,transparent_2px,rgba(255,255,255,0.06)_2px,rgba(255,255,255,0.06)_3px)]`. No animation needed.
- **Tab transitions** — change the existing tab buttons (lines 489-503):
  - Wrap each tab in `motion.button` with `layout` and `whileTap={{y: 1}}`.
  - The active state underline (currently `border-t-2 border-primary`) gets replaced with an animated underline via Framer Motion `<motion.div layoutId="tab-underline" />` absolute-positioned at the bottom of the active tab. Smoothly slides between tabs.
  - Inactive tab `transition-all duration-200`, active changes color/background instantly but the underline animates.
- **Cursor color** (line 523) — change `bg-primary` (currently maps to a default blue) → inline `bg-gradient-to-b from-indigo-300 to-violet-400` for a richer cursor.
- **Status indicator dot** (line 544) — bump the green READY dot: `bg-green-500 shadow-[0_0_8px_#22c55e] shadow-[0_0_18px_rgba(34,197,94,0.5)]` (double shadow for halo).
- **`BUILD SUCCESSFUL` badge** (lines 552-569) — wrap the existing badge in a larger soft glow: `shadow-[0_0_30px_rgba(34,197,94,0.25)]` instead of `0.2`, plus a subtle outer ring `ring-1 ring-green-500/20`.

## Area 3 — Headline Text Effects

**`Hero` exports — animated headline block (lines 974-1006).**

- **"LLM GATEWAY" shimmer gradient**:
  - Current (lines 977-987): `bg-gradient-to-br from-white via-indigo-100 to-indigo-400 bg-clip-text text-transparent drop-shadow-[0_0_44px_rgba(99,102,241,0.22)]`.
  - New: `bg-gradient-to-r from-indigo-300 via-violet-300 to-cyan-300 bg-[length:200%_auto] bg-clip-text text-transparent animate-[hero-shimmer_5s_linear_infinite] [filter:drop-shadow(0_0_18px_rgba(139,92,246,0.45))_drop-shadow(0_0_36px_rgba(99,102,241,0.25))]`.
  - The `hero-shimmer` keyframe already exists in CSS — it animates `background-position` from `-200% center` to `200% center` over 6s. We override its duration to 5s for a tighter feel.
  - Replacement is done inline; no keyframe change needed.
- **`Universal` gradient** (line 985 area / the "Universal" `<TypewriterText>` line):
  - Add a subtle scale pulse via Framer Motion: `animate={{scale: [1, 1.02, 1]}} transition={{repeat: Infinity, duration: 4, ease: "easeInOut"}}`. Wrap the existing motion span.
  - Add a soft drop-shadow on the typewriter container: `drop-shadow-[0_0_14px_rgba(255,255,255,0.18)]`.
- **Typewriter spring tightening** (lines 374-385, `TypewriterText`):
  - `damping: 12` → `18`, `stiffness: 200` → `240`. Per-letter delay `0.03` → `0.022`. Snappier without losing the spring feel.
- **Decorative SVG underline swoosh** (lines 990-1005) — already animates `pathLength` 0→1 over 0.9s. Add a second `motion.circle` element near the right tip with opacity 0→1 fade-in + scale 0→1 over 350ms at delay 1.7s, color indigo `-400`, r=2. Looks like a "pen tip touching the page."
- **TypewriterText** — add a subtle wrap-class for the shimmer so the container has `inline-block` (already has it) and runs the shimmer on its own gradient if `text="Universal"`. Implementation: rather than bake harder, leave `Universal` uniform-white, rely on the new framing pulse/drop-shadow above.

## Area 4 — Button Hover States

**`CyberButton` (lines 314-352).**

- **Glowing border pulse**:
  - Add `::before` pseudo-element to the button: absolute, inset-0, 1.5px effective ring via `box-shadow` + `border-radius` masking. Use a `conic-gradient(from_0deg,rgba(99,102,241,0.5),rgba(168,85,247,0.4),rgba(34,211,238,0.45),rgba(99,102,241,0.5))` background, mask `mask-composite: exclude` + `padding: 1.5px` border-box trick.
  - Resting state: `opacity-0`. Hover state: `opacity-100` + `animate-[hero-conic-spin_6s_linear_infinite]` (rotates slowly).
  - Alternative fallback (kept simple): instead of pseudo-element, render an absolute `<span>` sibling inside the button that does the same — easier than fighting Tailwind v4 pseudo-element layer rules. Implementation: a `<span>` with `before:` styles converted to a real element.
- **Soft idle glow (always on, primary only)**:
  - Add a primary-only `::before`-equivalent element: `absolute -inset-1 rounded-2xl bg-gradient-to-r from-indigo-500/30 via-violet-500/30 to-fuchsia-500/30 blur-md -z-10` opacity not affected by hover. Subtle — gives the button a "powered" look at rest. `z-[-1]` so it sits behind button (raise button z-context if needed).
- **Arrow nudge** — `ArrowRight` already gets a small `group-hover:translate-x-1` on motion plans but here it's just inline. Update the existing code (lines 1064-1066): wrap `<ArrowRight>` in `motion.span` with `whileHover={{x: [0, 6, 4]}} transition={{duration: 0.35}}`. Since motion doesn't have a "nearby" hover parent, this will need a parent `motion.div` wrapping the children with `whileHover` triggered off button focus or arrow group-hover — fallback is to use a CSS `@keyframes` for the nudge that triggers on `group-hover`.
  - Concrete: CSS-only nudge is more reliable. Add `@keyframes arrow-nudge` to globals.css and apply via `group-hover:animate-[arrow-nudge_0.5s_ease-out]`.
- **Click ripple** — add a simple per-click ripple on the button surface. Implementation: a `<motion.span>` inside the button that starts at the click position (`onClick={(e) => setRipple({x: e.clientX - rect.left, y: e.clientY - rect.top})}`), renders a circle from `scale:0 opacity:0.6` → `scale:3 opacity:0` over 450ms. State lives in `useState`. Multiple ripples stack via key.
- **Existing shimmer** — keep; nothing removed.

## globals.css additions

Drop into the existing `@keyframes` section, near the existing hero keyframes (around line 600):

```css
@keyframes arrow-nudge {
  0% { transform: translateX(0); }
  40% { transform: translateX(8px); }
  70% { transform: translateX(3px); }
  100% { transform: translateX(6px); }
}

/* Secondary aurora band — cyan hue, phase-shifted */
.hero-aurora-b {
  animation: hero-aurora 11s ease-in-out infinite;
  animation-delay: -3s;
}
```

Add to the `@media (prefers-reduced-motion: reduce)` block (line 607-625):

```css
.hero-aurora-b { animation: none; }
.hero-arrow-nudge { animation: none; }
```

## Performance budget

- Existing paint cost: 3 blurred orbs + 1 grid layer + 1 noise + 1 vignette + mouse spotlight + 15 floating logos + 1 conic beam (already present in CSS, just not used) + LiveTicker badge.
- New paint cost:
  - Particle field: 40 dots × 1 transform. ~0.6ms per frame budget on M-class hardware. Below threshold.
  - 2nd aurora band: 1 transform/opacity layer.
  - CyberButton pseudo glow: composited transform on a rounded layer.
  - Terminal shine sweep: 1 transform.
  - Status badge halo: shadow-stack only (no paint).
  - Total new layers ≤ 6 GPU composited layers. Within budget.
- JS cost: ripple state per button. 1 useState per click. Negligible.

## Out of scope

- `FloatingLogos` (15 language icons) — user did not select this area. Unchanged.
- `GlitchText` — unused dead code. Leave as-is (cleanup is a separate task).
- `LiveTicker` — fixed-position UI; risky to touch. Unchanged.
- Scroll parallax (`useTransform`) — untouched.
- HUD overlay corner brackets and data lines — untouched.
- `VideoModal` — untouched.
- Section 02 (IntegrationFlow) — separate scope.
- Section 03 (GatewayFeatures) — separate scope.

## Accessibility

- All new animations are CSS keyframe or Framer Motion springs. The existing `@media (prefers-reduced-motion: reduce)` overrides already handle the hero CSS keyframes — we add two more selectors to disable the new `hero-aurora-b` and `arrow-nudge` shimmer.
- Mouse spotlight is decorative (`pointer-events-none` already on the parent).
- New particle field uses opacity/scale only — no flashing or strobing. Safe for vestibular-sensitive users under the existing reduced-motion override (already disables `.hero-twinkle`).
- New button border glow is decorative; the button is still keyboard-focusable and has the existing focus ring (`focus-visible:ring-indigo-300/70`).

## Risk

- **Terminal tab transition** — switching from CSS border switch to Framer Motion `layoutId` adds JS cost. Acceptable on desktop; mobile falls back via CSS transition for tabs that aren't `motion.button`-wrapped.
- **Particle field at 40 dots** — could become visible in dev tools as a perf overlay hit. Each dot is `will-change: opacity, transform`. We can drop to 28 dots if perf review flags it
- **`arrow-nudge` keyframe** — runs only on hover, so play cost is one cycle per hover. Fine.
- **Secondary aurora band** — adds one extra `mix-blend-screen` layer. Tested for little visual cost in adjacent Yapapa sections.

## Verification plan

1. `npm run lint` — passes (no new lint rules).
2. `tsc --noEmit` — passes (existing `ignoreBuildErrors: true` masks strict CI; we want strict here).
3. `npm run build` — succeeds.
4. Manual smoke: open `http://localhost:3000`, observe:
   - Background orbs visibly richer; particle field visible as small twinkling dots.
   - Terminal halo multi-layered and pulsing; tab transitions smooth.
   - "LLM GATEWAY" shimmers gently with cyan tail; "Universal" has subtle pulse.
   - Primary button has a soft outer glow even at rest, hover glow pulse strong.
   - Ripple on click.
5. Reduced-motion: toggle OS reduced-motion, re-open hero — all new effects frozen, baseline hero elements still readable.
6. `scripts/smoke-test.sh` — wiring test should still pass (no SDK or mock data touched).

## Files to change

| File | Lines | Change |
| --- | --- | --- |
| `apps/web/components/Hero.tsx` | 314-352 | `CyberButton`: ripple state, idle glow, animated border, nudge CSS |
| `apps/web/components/Hero.tsx` | 374-385 | `TypewriterText`: tighter spring + per-letter delay |
| `apps/web/components/Hero.tsx` | 435-599 | `InteractiveTerminal`: stacked halo, scanline, glass shine, motion tab underline |
| `apps/web/components/Hero.tsx` | 753-812 | `HeroBackground`: richer orbs, particle field, secondary aurora, conic-spin behind headline, brighter spotlight |
| `apps/web/components/Hero.tsx` | 974-1006 | Headline block: shimmer gradient on headline, pulse on Universal, swoosh tip dot |
| `apps/web/components/Hero.tsx` | 1064-1075 | Buttons: motion.span arrow wrap + ripple wiring |
| `apps/web/app/globals.css` | 530-650 | Add `arrow-nudge` keyframe + `hero-aurora-b` reduced motion override |

## Exit criteria

- Hero visually more vibrant, no regressions on existing flow.
- All four areas (background, terminal, headline, buttons) show measurable change.
- UPDATE.md entry added.
- Conventional commit on `feature/hero-layered-glow` branch, fast-forwarded into master, pushed.
