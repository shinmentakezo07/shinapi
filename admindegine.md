# Admin Visual Design System

Use this document as a portable reference for recreating the `http://localhost:3000/admin/` look in another product. The admin UI is a dark, minimal, command-center interface: near-black surfaces, very low-contrast borders, blue/violet accent light, compact typography, mono numeric data, and subtle motion.

## 1. Overall visual direction

- **Mood:** premium infrastructure console, quiet cyber, operational command center.
- **Density:** compact but breathable; avoid oversized enterprise dashboard spacing.
- **Contrast style:** black-on-black layering with thin translucent white borders.
- **Accent behavior:** blue is primary; violet/purple is secondary. Accents should feel like ambient light, not heavy color blocks.
- **Texture:** soft radial glows, faint grid, tiny noise overlays, and 1px gradient highlights.
- **Motion:** short, smooth, spring-like entrance animations and micro hover states.

## 2. Core color palette

Define these tokens on the admin root container, e.g. `[data-admin]`.

```css
[data-admin] {
  --admin-bg: #050505;
  --admin-surface: #0A0A0A;
  --admin-surface-elevated: #0e0e0e;
  --admin-border: rgba(255, 255, 255, 0.04);
  --admin-border-hover: rgba(255, 255, 255, 0.08);

  --admin-text: #ffffff;
  --admin-text-muted: #9ca3af;
  --admin-text-dim: #6b7280;

  --admin-accent: #3b82f6;
  --admin-accent-soft: rgba(59, 130, 246, 0.10);
  --admin-accent-glow: rgba(59, 130, 246, 0.2);
  --admin-accent-gradient: linear-gradient(135deg, #3b82f6, #7c3aed);
  --admin-accent-purple: #a855f7;
  --admin-accent-violet: #7c3aed;

  --admin-success: #34d399;
  --admin-warning: #fbbf24;
  --admin-danger: #f87171;

  --admin-radius: 14px;
  --admin-radius-sm: 8px;
  --admin-radius-lg: 20px;
}
```

### Color usage rules

| Role | Color | Usage |
| --- | --- | --- |
| Page background | `#050505` | Full admin shell background |
| Sidebar/cards | `#0A0A0A` | Main surfaces |
| Dropdowns/popovers | `#0e0e0e` | Elevated surfaces |
| Hairline borders | `rgba(255,255,255,0.04)` | Default card/input/table borders |
| Hover borders | `rgba(255,255,255,0.08)` | Interactive hover state |
| Primary text | `#ffffff` | Titles and important values |
| Muted text | `#9ca3af` | Labels and normal secondary text |
| Dim text | `#6b7280` | Metadata, helper text, timestamps |
| Primary accent | `#3b82f6` | Active nav, live dots, links, focus |
| Violet accent | `#7c3aed` / `#a855f7` | Ambient glow, gradients, secondary metrics |
| Success | `#34d399` | Healthy states |
| Warning | `#fbbf24` | Degraded states |
| Danger | `#f87171` | Error/destructive states |

Keep colored fills extremely transparent: usually `0.04` to `0.10` alpha. The design should not have saturated blue panels.

## 3. Background and visual atmosphere

The page shell is fixed-height and uses an ambient background behind the content.

```css
.admin-shell {
  min-height: 100vh;
  background: var(--admin-bg);
  position: relative;
  overflow: hidden;
}
```

Recommended atmosphere layers:

```css
.admin-grid {
  position: fixed;
  inset: 0;
  pointer-events: none;
  opacity: 0.02;
  background-image:
    linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px);
  background-size: 64px 64px;
}

.admin-blue-orb {
  position: fixed;
  top: -160px;
  left: -160px;
  width: 600px;
  height: 600px;
  border-radius: 9999px;
  pointer-events: none;
  background: radial-gradient(circle, rgba(59,130,246,0.04) 0%, transparent 60%);
}

.admin-violet-orb {
  position: fixed;
  right: -160px;
  bottom: -160px;
  width: 500px;
  height: 500px;
  border-radius: 9999px;
  pointer-events: none;
  background: radial-gradient(circle, rgba(124,58,237,0.03) 0%, transparent 60%);
}

.admin-purple-orb {
  position: fixed;
  top: 50%;
  left: 33%;
  width: 400px;
  height: 400px;
  border-radius: 9999px;
  pointer-events: none;
  transform: translateY(-50%);
  background: radial-gradient(circle, rgba(168,85,247,0.02) 0%, transparent 60%);
}
```

### Noise overlay

Use noise very lightly. It should be barely visible.

```css
.admin-noise::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.015'/%3E%3C/svg%3E");
  pointer-events: none;
  opacity: 0.5;
  border-radius: inherit;
}
```

## 4. Layout structure

### Shell

- Sidebar fixed on the left.
- Top bar fixed from sidebar edge to right side.
- Main content scrolls independently.
- Content has a max width of about `1400px` and padding of `32px`.

```text
┌────────────── sidebar 260px ──────────────┬──────── topbar 64px ────────┐
│                                           │                             │
│ logo                                      │ page title + quick nav      │
│ nav sections                              ├─────────────────────────────┤
│                                           │ content scroll area          │
│ profile/collapse                          │ max-width 1400px, p-8       │
└───────────────────────────────────────────┴─────────────────────────────┘
```

### Dimensions

| Element | Size |
| --- | --- |
| Expanded sidebar | `260px` |
| Collapsed sidebar | `72px` |
| Topbar height | `64px` plus 1px gradient border |
| Content top padding | `65px` to clear topbar |
| Main content padding | `32px` |
| Main max width | `1400px` |
| Sidebar logo area | `72px` high |

## 5. Typography

The visual system uses a sans font for interface text and a mono font for operational data.

- **Sans:** Inter-style UI font.
- **Mono:** Space Mono-style font for timestamps, IDs, metrics, labels, numeric values.
- **Display/serif:** not used heavily in admin; keep admin utilitarian.

### Type scale

| Use | Size | Weight | Tracking |
| --- | --- | --- | --- |
| Topbar page title | `17px` | `600` | `-0.02em` |
| Page heading | `22px` to `24px` | `600` | `-0.025em` |
| Section heading | `14px` | `600` | `-0.01em` |
| Body / row text | `12px` to `13px` | `400–500` | normal to `-0.01em` |
| Section labels | `9px` to `10px` | `600` | `0.12em–0.18em`, uppercase |
| Metadata | `9px` to `11px` | `400–600` | mono, wide |
| Hero metric | `42px` | `700` | `-0.035em`, tabular nums |
| Compact stat | `22px` | `700` | `-0.02em`, mono |

### Text color hierarchy

```css
.admin-title { color: var(--admin-text); }
.admin-label { color: var(--admin-text-muted); text-transform: uppercase; letter-spacing: 0.14em; }
.admin-meta { color: var(--admin-text-dim); font-family: var(--font-mono); }
```

## 6. Cards and panels

Cards are nearly black surfaces with faint borders, not bright glass panels.

```css
.admin-card {
  background: var(--admin-surface);
  border: 1px solid var(--admin-border);
  border-radius: var(--admin-radius);
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.admin-card:hover {
  border-color: var(--admin-border-hover);
  box-shadow:
    0 0 40px -12px rgba(59, 130, 246, 0.06),
    inset 0 1px 0 0 rgba(255, 255, 255, 0.02);
}

.admin-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(59,130,246,0.08), rgba(124,58,237,0.05), transparent);
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
}

.admin-card:hover::before {
  opacity: 1;
}
```

### Card padding

| Card type | Padding |
| --- | --- |
| Hero metric | `32px` |
| Standard card | `24px` |
| Compact stat | `20px` |
| Strip/status card | `16px` |
| Table wrapper | no inner padding; rows own padding |

## 7. Sidebar style

The sidebar is a fixed black surface with no obvious right border. It relies on spacing, active pills, and ambient glow.

### Sidebar rules

- Background: `var(--admin-surface)`.
- Expanded width: `260px`; collapsed width: `72px`.
- Nav sections separated by vertical spacing, not horizontal rules.
- Section labels: 10px uppercase, muted gray, wide tracking.
- Nav items: 13px, medium weight, 12px radius.
- Active item: blue text, transparent blue background, thin blue vertical bar at left.
- Icons are dim by default (`white/20`), active blue, hover `white/40`.

```css
.admin-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 12px;
  border-radius: 12px;
  font-size: 13px;
  color: var(--admin-text-muted);
  transition: all 0.2s ease;
}

.admin-nav-item:hover {
  color: var(--admin-text);
  background: rgba(255,255,255,0.02);
}

.admin-nav-item-active {
  color: rgb(191, 219, 254);
  background: rgba(59,130,246,0.06);
}

.admin-nav-active-bar {
  width: 3px;
  height: 20px;
  border-radius: 0 9999px 9999px 0;
  background: #60a5fa;
}
```

### Sidebar glow

```css
.admin-sidebar::before {
  content: "";
  position: absolute;
  top: -96px;
  left: -96px;
  width: 256px;
  height: 256px;
  border-radius: 9999px;
  background: radial-gradient(circle, rgba(59,130,246,0.05) 0%, rgba(124,58,237,0.02) 50%, transparent 70%);
  pointer-events: none;
}
```

## 8. Topbar style

The topbar is translucent black with blur and a 1px gradient underline.

```css
.admin-topbar {
  backdrop-filter: blur(12px) saturate(1.2);
  background: rgba(5, 5, 5, 0.75);
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.admin-topbar-border {
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(59, 130, 246, 0.06) 20%,
    rgba(124, 58, 237, 0.04) 50%,
    rgba(59, 130, 246, 0.06) 80%,
    transparent 100%
  );
}
```

Topbar content:

- Left: section eyebrow at 9px uppercase blue with 60% opacity; page title at 17px.
- Center: quick nav pills on large screens.
- Right: search trigger, divider, live clock, notifications, user menu.
- Dividers are `1px` wide and `20px` high using `rgba(255,255,255,0.04)`.

## 9. Buttons, inputs, and controls

### Buttons

```css
.admin-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 18px;
  border-radius: var(--admin-radius-sm);
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
  cursor: pointer;
}

.admin-btn-primary {
  background: var(--admin-accent-soft);
  color: var(--admin-accent);
  border: 1px solid rgba(99, 102, 241, 0.15);
}

.admin-btn-primary:hover {
  background: rgba(99, 102, 241, 0.18);
  border-color: rgba(99, 102, 241, 0.25);
  box-shadow: 0 0 20px -6px rgba(99, 102, 241, 0.2);
}

.admin-btn-ghost {
  background: transparent;
  color: var(--admin-text-muted);
  border: 1px solid var(--admin-border);
}

.admin-btn-ghost:hover {
  color: var(--admin-text);
  border-color: var(--admin-border-hover);
  background: rgba(255,255,255,0.02);
}
```

### Inputs

```css
.admin-input {
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--admin-border);
  border-radius: var(--admin-radius-sm);
  padding: 10px 14px;
  font-size: 13px;
  color: var(--admin-text);
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.admin-input::placeholder {
  color: var(--admin-text-dim);
}

.admin-input:focus {
  border-color: var(--admin-accent-glow);
  box-shadow: 0 0 0 3px rgba(99,102,241,0.08);
}
```

### Keyboard shortcuts

```css
.admin-kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  font-size: 9px;
  font-family: var(--font-mono), monospace;
  font-weight: 600;
  color: var(--admin-text-dim);
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.04);
  border-radius: 4px;
}
```

## 10. Badges and status indicators

### Generic badge

```css
.admin-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  line-height: 1.6;
}
```

### Live badge

```css
.admin-live-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(59,130,246,0.7);
  background: linear-gradient(135deg, rgba(59,130,246,0.06), rgba(124,58,237,0.04));
  border: 1px solid rgba(59,130,246,0.08);
}

.admin-live-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #3b82f6;
  animation: admin-pulse-dot 2s ease-in-out infinite;
}

@keyframes admin-pulse-dot {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.3); }
}
```

### Health states

```css
.admin-status-healthy {
  color: #34d399;
  background: rgba(52,211,153,0.06);
}

.admin-status-warning {
  color: #fbbf24;
  background: rgba(251,191,36,0.06);
}

.admin-status-danger {
  color: #f87171;
  background: rgba(248,113,113,0.06);
}
```

## 11. Tables

Tables use a dark card wrapper, sticky header, very small uppercase labels, and quiet row hover.

```css
.admin-table {
  border: 1px solid var(--admin-border);
  border-radius: var(--admin-radius);
  overflow: hidden;
  background: var(--admin-surface);
}

.admin-table thead {
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--admin-surface);
}

.admin-table thead tr {
  background: rgba(255,255,255,0.01);
  border-bottom: 1px solid var(--admin-border);
}

.admin-table th {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--admin-text-muted);
  padding: 14px 20px;
  text-align: left;
  white-space: nowrap;
}

.admin-table td {
  padding: 12px 20px;
  font-size: 13px;
  color: var(--admin-text);
  border-bottom: 1px solid rgba(255,255,255,0.02);
  white-space: nowrap;
}

.admin-table tbody tr:hover {
  background: rgba(255,255,255,0.015);
}
```

## 12. Dashboard composition

The admin dashboard is not a generic four-card grid. It uses hierarchy:

1. Header row with page title, live badge, date, auto-refresh text.
2. System status strip.
3. One dominant hero metric, three compact stats, and one pulse panel.
4. Activity feed plus quick command card.

### Recommended grid

```tsx
<div className="space-y-5">
  <HeaderRow />
  <SystemStatusStrip />

  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
    <div className="lg:col-span-5"><HeroMetric /></div>
    <div className="lg:col-span-3 flex flex-col gap-4"><CompactStats /></div>
    <div className="lg:col-span-4"><PlatformPulse /></div>
  </div>

  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
    <div className="lg:col-span-2"><ActivityFeed /></div>
    <div><QuickCommands /></div>
  </div>
</div>
```

### Hero metric style

```css
.admin-hero-metric {
  border-color: rgba(59,130,246,0.06);
  background: linear-gradient(135deg, var(--admin-surface) 0%, rgba(59,130,246,0.015) 100%);
}

.admin-hero-value {
  font-size: 42px;
  font-weight: 700;
  letter-spacing: -0.035em;
  line-height: 1;
  color: var(--admin-text);
  font-variant-numeric: tabular-nums;
}
```

### Compact stat style

```css
.admin-compact-stat:hover {
  border-color: var(--admin-border-hover);
  transform: translateY(-1px);
}
```

Compact stats should use:

- Tiny colored dot for category.
- 10px uppercase label.
- 22px mono bold value.
- 11px mono dim subtext.

## 13. Dropdowns and overlays

Dropdowns are elevated black panels with stronger shadow and blur.

```css
.admin-dropdown {
  backdrop-filter: blur(16px) saturate(1.3);
  background: var(--admin-surface-elevated);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.6);
  overflow: hidden;
}
```

Menu items:

```css
.admin-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  font-size: 12px;
  color: var(--admin-text-muted);
  transition: color 0.2s ease, background 0.2s ease;
}

.admin-menu-item:hover {
  color: var(--admin-text);
  background: rgba(255,255,255,0.02);
}
```

## 14. Scrollbars

Admin scrollbars are extremely thin and violet/indigo tinted.

```css
.admin-scroll {
  scrollbar-width: thin;
  scrollbar-color: rgba(99,102,241,0.25) transparent;
}

.admin-scroll::-webkit-scrollbar { width: 3px; }
.admin-scroll::-webkit-scrollbar-track { background: transparent; }
.admin-scroll::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgba(99,102,241,0.4), rgba(139,92,246,0.3));
  border-radius: 10px;
}
```

## 15. Loading states

Skeletons use a low-contrast shimmer. Avoid bright gray placeholders.

```css
@keyframes admin-skeleton {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.admin-skeleton {
  background: linear-gradient(
    90deg,
    rgba(255,255,255,0.02) 25%,
    rgba(255,255,255,0.05) 50%,
    rgba(255,255,255,0.02) 75%
  );
  background-size: 200% 100%;
  animation: admin-skeleton 1.8s ease-in-out infinite;
  border-radius: 6px;
}
```

## 16. Motion language

Use Framer Motion or equivalent CSS transitions.

### Entrance animation

```ts
const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.03 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 120, damping: 22 },
  },
};
```

### Dropdown animation

```ts
initial={{ opacity: 0, y: 6, scale: 0.97 }}
animate={{ opacity: 1, y: 0, scale: 1 }}
exit={{ opacity: 0, y: 6, scale: 0.97 }}
transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
```

### Timing rules

- Hover transitions: `0.15s–0.2s`.
- Card border/glow transitions: `0.3s–0.4s`.
- Page entrance: `0.35s–0.5s`.
- Use easing `[0.16, 1, 0.3, 1]` for smooth premium exits/entries.

Respect reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  .admin-stagger > *,
  .admin-pulse-dot,
  .admin-skeleton {
    animation: none;
  }
}
```

## 17. Icon style

- Use thin line icons similar to Lucide.
- Default icon size: `14px–18px`.
- Topbar icons: `16px`.
- Quick nav icons: `12px`.
- Sidebar icons: `18px`.
- Icon opacity is often more important than icon color:
  - Default: `white/20` or dim gray.
  - Hover: `white/40`.
  - Active/accent: `#3b82f6` with 50–70% opacity.

## 18. Spacing system

| Pattern | Spacing |
| --- | --- |
| Page vertical sections | `20px` (`space-y-5`) |
| Grid gutters | `16px` (`gap-4`) |
| Card internal gap | `20px–24px` |
| Sidebar nav section gap | `24px` |
| Sidebar nav item gap | `2px` vertical between items |
| Inline icon/text gap | `6px–12px` |
| Topbar action gap | `8px` |

## 19. Implementation checklist

To recreate the design in another app:

1. Add `[data-admin]` CSS variables exactly as above.
2. Build a fixed sidebar (`260px`, collapsible to `72px`).
3. Build a fixed blurred topbar (`64px`) with gradient bottom border.
4. Put content inside a scrollable main area with `max-width: 1400px` and `padding: 32px`.
5. Add ambient background layers: faint grid, blue orb, violet orb, purple orb.
6. Use `.admin-card` for all panels; keep borders at `rgba(255,255,255,0.04)`.
7. Use mono font for metrics, dates, IDs, and operational labels.
8. Keep all accent fills low-alpha. Use blue/purple mostly as glow, outline, dots, and small text.
9. Use compact tables with sticky headers and very quiet row hover.
10. Add skeleton shimmer and pulse dots for live/loading states.
11. Add short spring entrance animations and dropdown scale/fade.
12. Add reduced-motion fallbacks.

## 20. Things to avoid

- Do not use large saturated blue cards.
- Do not use medium-gray backgrounds; stay close to black (`#050505`, `#0A0A0A`, `#0e0e0e`).
- Do not make borders brighter than `rgba(255,255,255,0.08)` except for focused controls.
- Do not use bulky shadows; prefer soft colored glow with negative spread.
- Do not use large rounded corners everywhere; most admin UI corners are `8px–14px`, dropdowns `16px`, large panels up to `20px`.
- Do not over-animate. Motion should feel responsive, not playful.
- Do not mix many accent colors. Blue/violet are the brand; green/yellow/red are only for status.

## 21. Minimal starter markup

```tsx
export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div data-admin className="admin-shell">
      <div className="admin-grid" />
      <div className="admin-blue-orb" />
      <div className="admin-violet-orb" />
      <aside className="admin-sidebar">...</aside>
      <header className="admin-topbar">...</header>
      <main className="admin-scroll admin-main">
        <div className="admin-content">{children}</div>
      </main>
    </div>
  );
}
```

```css
.admin-main {
  height: 100vh;
  padding-top: 65px;
  margin-left: 260px;
  position: relative;
  z-index: 1;
  overflow-y: auto;
}

.admin-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 32px;
}
```
