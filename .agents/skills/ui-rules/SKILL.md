---
name: ui-rules
scope: generic
description: Strict frontend engineering and visual design invariants: bans hover levitation/translate-y, eliminates AI aesthetic bloat, and enforces grounded design tokens.
---

# UI Rules & Visual Engineering Standards

This skill defines the mandatory visual engineering standards, interaction invariants, and anti-patterns across all modern frontend applications, websites, and user interfaces.

---

## 1. Rule: Absolute Ban on Hover Levitation & Moving Up

> [!CAUTION]
> **ZERO VERTICAL DISPLACEMENT ON HOVER**: Elements must NEVER move up or shift vertically on hover.
> Physical levitation (`hover:-translate-y-*`, `translateY(-...)`, float, or bounce) is strictly forbidden.

### Why This Rule Exists:
- **Visual Jitter & Disruption**: Shifting an element along the Y-axis disrupts reading flow, creates layout vibration when cursor hovers near edges, and causes optical disorientation.
- **Cheap "AI-Generated" Hallmark**: Amateur AI-generated website templates frequently default to `hover:-translate-y-1` or `hover:-translate-y-2` as an unconsidered gimmick.
- **Strictly Grounded Philosophy**: Components must remain firmly anchored in their layout plane.

### Prohibited Patterns:
```css
/* FORBIDDEN: NEVER USE LEVITATION ON HOVER */
.card:hover {
  transform: translateY(-2px); /* BANNED */
}

/* FORBIDDEN: TAILWIND HOVER TRANSLATE-Y CLASSES */
hover:-translate-y-0.5  /* BANNED */
hover:-translate-y-1    /* BANNED */
hover:-translate-y-2    /* BANNED */
group-hover:-translate-y-0.5 /* BANNED */
group-hover:-translate-y-1   /* BANNED */
```

### Approved Interactive Feedback:
- **Border Highlighting**: Subtle border color transitions (e.g. `border-gray-800` to `border-violet-500/40`).
- **Surface Overlays**: Subtle background tint or alpha layer shifts (e.g. `bg-gray-900/80` to `bg-gray-900/95`).
- **Glow & Highlights**: Soft, non-disruptive blur shadows or opacity transitions (e.g. `opacity-0` to `opacity-25`).
- **Typography Shifts**: Subtle text color accentuation (e.g. `text-white` to `text-violet-300`).

---

## 2. Rule: Elimination of AI-Generated Aesthetic Bloat

Frontend code must avoid the stereotypical hallmarks of unreviewed AI outputs:

1. **No Fake macOS Window Chrome**:
   - Do NOT decorate cards or modals with fake red/yellow/green macOS terminal dots.
2. **No Decorative Icon Pollution**:
   - Do NOT decorate every heading, card title, and badge with generic Lucide icons (`Sparkles`, `Bot`, `Layers`, `Cpu`, `Wrench`, `ShieldCheck`).
   - Use only functional UI controls (`Search`, `X`, `Copy`, `Check`, `ArrowUpRight`, authentic brand icons).
3. **No Fake Status Lights & Metric Boxes**:
   - Do NOT add pulsing radar green beacons ("Available for hire/collaboration") or arbitrary metric pills (`Verified Links`, `3 Categories`, `Open Source Contributor`).
4. **No Rainbow Gradients or Harsh Halos**:
   - Avoid loud multi-color gradients (`bg-gradient-to-r from-violet-600 to-cyan-500`). Use subtle single-tint or dual-tint background glows (`bg-violet-500/8`, `bg-teal-500/8`).

---

## 3. Rule: Layout Discipline & Unified Container Architecture

1. **Page Container Consistency**:
   - Every primary route must use the unified container constraint:
     ```tsx
     <div className="container mx-auto px-4 py-6 relative z-10 max-w-400">
     ```
2. **Responsive Card Grids**:
   - Standard 4-column responsive grid matching the canonical `ListCard` structure:
     ```tsx
     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
     ```
3. **Typography Standard**:
   - Server-rendered headers with clean typography: `text-2xl font-bold text-white font-heading` with count and category summary.

---

## 4. Automated Verification & CI Rules

Automated unit tests must assert that no components introduce `hover:-translate-y-` or `hover:translate-y-` regressions. Any pull request introducing hover vertical displacement must fail CI validation.
