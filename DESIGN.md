# LokaTalenta LMS — Design System & Engineering Specification (DESIGN.md)
*Version: v4.0.0 (Major Anti-Slop Industrial Release) • Sprint 21 Active*

---

## 1. Purpose and Scope

This document specifies the authoritative design standards, design tokens, component rules, interaction states, and anti-slop guidelines for **LokaTalenta LMS** (`lms-psikotes/client`). Any human engineer, coding agent, or design subagent modifying or generating user interfaces across LokaTalenta must strictly adhere to these rules before writing or reviewing code.

---

## 2. Product and User Principles

1. **Zero Paywall & Equal Access**: Every assessment, course module, simulation, and credential is 100% free. The UI must never introduce artificial paywall barriers, locked premium tiers, or predatory FOMO countdowns.
2. **Industrial Precision over Decoration**: Interface elements must serve cognitive speed, scanability, and spatial certainty. Motion and colors must earn their place.
3. **High-Stakes Predictability**: Under exam conditions, latency, layout shifts, and accidental clicks cause candidate anxiety. Zero layout thrashing, 0ms input-path latency, and physical micro-press states are required.
4. **Transparent Telemetry**: Proctoring tools (focus loss indicators, timer warnings) must be honest, calm, non-accusatory, and non-intrusive.
5. **Universal Fluid Responsiveness**: The experience must function seamlessly from 360px budget smartphones to 4K desktop battle stations.

---

## 3. Visual Hierarchy and Layout Rules

- **Spatial Rhythm**: Multi-column 12-column grid layout on desktop (`lg:grid-cols-12`) with an asymmetric 8:4 split for primary exam/catalog views (8 cols content, 4 cols sticky telemetry/filter rail).
- **Max Width**: Standard views capped at `max-w-7xl mx-auto px-4 sm:px-6`.
- **Card Containers**: Fixed border `1px solid var(--border-industrial)`. Radiuses restricted to `rounded-lg` (8px) for cards, `rounded-md` (6px) for action buttons and chips, and `rounded-sm` (4px) for micro-indicators.
- **Vertical Density**: Tight padding (`p-4` to `p-6`). Avoid gratuitous `p-12` or `rounded-2xl` cushions that push primary tasks below the viewport fold.

---

## 4. Token and Visual-System Guidance

### 4.1. Color Roles

| Token Role | CSS Variable | Light Hex | Dark Hex | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Canvas Background** | `--bg-canvas` | `#F4F4F1` | `#0D1117` | Neutral ground; never pure harsh white or fake parchment. |
| **Panel Surface** | `--surface-panel` | `#FFFFFF` | `#161B22` | Cards, modals, drawers, input containers. |
| **Docked Surface** | `--surface-docked` | `#E8E8E3` | `#1B1F2B` | Sidebars, bottom action strips, filter panels. |
| **Industrial Border** | `--border-industrial` | `#D4D4CE` | `#282E3D` | 1px structural framing across panels and inputs. |
| **Primary Ink** | `--ink-primary` | `#0F1216` / `#18181B` | `#F1F5F9` / `#F0F6FC` | High-contrast body text ($\ge 14:1$). |
| **Muted Ink** | `--ink-muted` | `#545C6E` / `#71717A` | `#8892A6` / `#8B949E` | Secondary captions, timestamps, counters ($\ge 4.5:1$). |
| **Accent Primary** | `--status-teal` | `#0F766E` | `#14B8A6` | Signature actions, selected states, badges. |
| **Alert / Warning** | `--status-amber` | `#D97706` | `#F59E0B` | Flagged questions, pending reviews, streak indicators. |
| **Critical / Danger** | `--status-crimson` | `#E11D48` | `#FB7185` | Critical time alerts (<5m), wrong answers, destructive actions. |
| **Success / Verified** | `--status-emerald` | `#059669` | `#10B981` | Completed courses, passed scores, verified certificates. |

### 4.2. Typography Pairing
- **Display & Section Headings**: `Plus Jakarta Sans` (Weight: 700 / 800, Tracking: `-0.03em`).
- **Body & Longform Reading**: `Inter` or clean system sans (Weight: 400 / 500, Line Height: `1.6`).
- **Telemetry, Timers, Matrices & Data**: `JetBrains Mono` (`font-mono`, `font-variant-numeric: tabular-nums`).

---

## 5. Component Selection and Usage Rules

1. **`Button` (`client/src/shared/ui/Button.tsx`)**:
   - `primary`: `#0F766E`, white text, `active:scale-[0.98]`, `duration-150`.
   - `secondary`: Solid 1px `#D4D4CE`, `hover:bg-[#F4F4F1]`.
   - `danger`: Solid crimson `#E11D48` for irrecoverable actions.
2. **`Badge` (`client/src/shared/ui/Badge.tsx`)**:
   - Compact inline meta indicators (tone: `emerald`, `amber`, `blue`, `slate`). Never rounded into oversized stadium lozenges.
3. **`ConfirmDialog` (`client/src/shared/ui/ConfirmDialog.tsx`)**:
   - Accessible keyboard-trapped modal dialog with `Escape` dismiss and `focus-visible` boundary. Enters via subtle `fade-in zoom-in-95 duration-150 ease-out`.
4. **`CourseSyllabusDrawer` (`client/src/features/courses/CourseSyllabusDrawer.tsx`)**:
   - Dual-mode fluid sheet: desktop right-rail slide-in; mobile velocity-aware bottom drag sheet with pointer capture and rubber-banding upward resistance.

---

## 6. Interaction States and Behavior

- **Hover**: Solid border darkening (`hover:border-[#0F766E]`) and subtle background tint. **BANNED**: `hover:-translate-y-*` or elevation bounce.
- **Active / Press**: Physical depression `active:scale-[0.98]` (buttons) or `active:scale-[0.995]` (option cards).
- **Focus Visible**: High-visibility 2px focus ring (`focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2`).
- **Disabled**: `disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100`.

---

## 7. Content and Microcopy Guidance

- **Tone**: Direct, technical, empowering, respectful.
- **Action Verbs**: Use precise single verbs (e.g. `Kerjakan`, `Lanjutkan`, `Kumpulkan`, `Buka Silabus`, `Reset Filter`). Never verbose conversational filler ("Silakan klik tombol di bawah ini untuk memulai tes").
- **Error States**: State the factual error and provide one immediate corrective button ("Gagal memuat program dari server" + `[Coba Lagi]`).
- **Telemetry Labels**: Objective proctoring metrics ("Pindah Tab: 1x", "Waktu Tersisa: 14:20").

---

## 8. Accessibility Requirements

- **WCAG Level**: Mandatory **WCAG 2.1 AA** compliance across all viewports.
- **Contrast**: Text ink against background must meet $\ge 4.5:1$ (normal body) and $\ge 7:1$ (question prompt).
- **Keyboard Navigation**:
  - Full keyboard shortcuts in Quiz Runner: `1`–`5` / `A`–`E` for answers, `←`/`→` for previous/next, `F` for flag.
  - Dialogs must trap focus and close on `Escape`.
- **Reduced Motion**: Mandatory `@media (prefers-reduced-motion: reduce)` collapsing all animations to `0.01ms`.

---

## 9. Responsive Behavior

| Breakpoint | Width Range | Layout Adaptation |
| :--- | :--- | :--- |
| **Mobile (`< sm`)** | $360\text{px} - 639\text{px}$ | Single column, bottom-sheet filter & syllabus drawers, sticky bottom submit bar. |
| **Tablet (`sm - lg`)** | $640\text{px} - 1023\text{px}$ | 2-column card catalog grid, collapsible navigation matrix rail. |
| **Desktop (`lg+`)** | $\ge 1024\text{px}$ | 12-column asymmetric workbench (8 cols test canvas, 4 cols sticky status rail). |

---

## 10. AI-Specific UI Patterns

- **No Fake AI Slop**: Banned purple-to-indigo "AI magic" gradients, sparkles on standard inputs, and decorative floating blur bubbles.
- **Proctoring Integrity**: Anti-cheat focus loss monitoring must be displayed as a transparent numerical log, never as a sensationalized threatening badge.
- **Practice Mode Instant Feedback**: Answer explanations must render in an inline docked panel below the options (`bg-emerald-50` or `bg-rose-50`) without pushing navigation out of view.

---

## 11. Anti-Patterns and Prohibited Choices

1. **NO** `hover:-translate-y-1` or hover scaling cards.
2. **NO** warm-cream `#E5E3DC` or `#F6F5F1` parchment default backgrounds.
3. **NO** purple/indigo marketing gradients.
4. **NO** `rounded-full` pill soup on standard checkboxes or data cards.
5. **NO** `999` z-index warfare. Stick to standard z-index layers: base (0), sticky header (30), modal/drawer (50).
6. **NO** bounce/elastic spring easing in testing environments.

---

## 12. Canonical Design References

- **Live Production URL**: [lokatalenta-office-3d.vercel.app](https://lokatalenta-office-3d.vercel.app)
- **LMS Client Repo**: `/Users/a2299/Documents/Projects/lms-psikotes/client`
- **Docs Hub System Specs**: `/Users/a2299/Documents/Projects/lokatalenta-docs/content/docs/design-taste-before-pixels-anti-slop-protocol.md`
- **Sprint Planner Specs**: `/Users/a2299/Documents/Projects/lokatalenta-sprint-planner/DESIGN.md`

---

## 13. Preflight Checklist (Before Writing UI Code)

- [ ] Has the design read and 3 dials been determined (`DESIGN_VARIANCE`, `MOTION_INTENSITY`, `VISUAL_DENSITY`)?
- [ ] Are color tokens sourced from `var(--bg-canvas)`, `var(--border-industrial)`, and `var(--status-teal)`?
- [ ] Is keyboard focus (`focus-visible:ring-2`) defined for every new interactive trigger?
- [ ] Are tabular numbers (`font-mono`) used for all timestamps, scores, and indices?
- [ ] Is touch target size $\ge 44\text{px}$ for mobile interactives?

---

## 14. Final UI QA Checklist

- [ ] All borders are solid 1px `#D4D4CE` (light) / `#282E3D` (dark).
- [ ] Zero hover floating (`-translate-y-*`) or layout-thrashing animations.
- [ ] Tests pass 100% (`npm test -- --run` in `client`).
- [ ] Production build succeeds cleanly without bundle warnings (`npm run build`).
- [ ] Dark mode toggle preserves WCAG 2.1 AA legibility across all panels.
