---
name: Wedding Guest Manager
description: The Warm Command Center — a dark operational guest-list tool with a wedding-warm accent layer.
colors:
  primary: "#c9a84c"
  surface-0: "#111113"
  surface-1: "#1a1b1e"
  surface-2: "#222327"
  surface-3: "#2b2d31"
  surface-4: "#313338"
  surface-overlay: "#0d0d0f"
  accent-gold: "#c9a84c"
  accent-gold-hover: "#d4b565"
  accent-gold-subtle: "rgba(201, 168, 76, 0.12)"
  accent-rose: "#c4717a"
  accent-rose-subtle: "rgba(196, 113, 122, 0.12)"
  accent-cream: "#f0e6d3"
  border-subtle: "rgba(255, 255, 255, 0.06)"
  border-default: "rgba(255, 255, 255, 0.10)"
  border-strong: "rgba(255, 255, 255, 0.18)"
  text-primary: "#f2f3f5"
  text-secondary: "#b5bac1"
  text-muted: "#6d6f78"
  text-inverse: "#111113"
  danger: "#f04747"
  danger-subtle: "rgba(240, 71, 71, 0.12)"
  success: "#43b581"
  success-subtle: "rgba(67, 181, 129, 0.12)"
  warning: "#faa61a"
  warning-subtle: "rgba(250, 166, 26, 0.12)"
  ring: "rgba(201, 168, 76, 0.5)"
  chart-1: "#c9a84c"
  chart-2: "#c4717a"
  chart-3: "#7a9cc4"
  chart-4: "#7ac49c"
  chart-5: "#c49c7a"
typography:
  display:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.5
  body:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  md: "6px"
  lg: "8px"
  xl: "12px"
  2xl: "16px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.accent-gold}"
    textColor: "{colors.text-inverse}"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.accent-gold-hover}"
    textColor: "{colors.text-inverse}"
  button-secondary:
    backgroundColor: "{colors.surface-3}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
    height: "36px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
    height: "36px"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "#ffffff"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
    height: "36px"
  button-link:
    backgroundColor: "transparent"
    textColor: "{colors.accent-gold}"
    rounded: "{rounded.md}"
    padding: "0"
  input:
    backgroundColor: "{colors.surface-3}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
    height: "36px"
  card-elevated:
    backgroundColor: "{colors.surface-4}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.2xl}"
  card-flat:
    backgroundColor: "{colors.surface-3}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.xl}"
  badge-party:
    backgroundColor: "rgba(201, 168, 76, 0.15)"
    textColor: "{colors.accent-gold-hover}"
    rounded: "{rounded.md}"
    padding: "2px 8px"
  # group badges resolve dynamically via colorForGroup(); values shown for "Rekan Kerja"
  badge-group:
    backgroundColor: "#5B8CDB26"
    textColor: "#A5C0EB"
    rounded: "{rounded.md}"
    padding: "2px 8px"
---

# Design System: Wedding Guest Manager

## Overview

**Creative North Star: "The Warm Command Center"**

A single-admin operational tool that borrows Discord's spatial discipline and wraps it in wedding warmth. The structure is pure utility — a fixed icon rail, a sticky top bar, dense tables — but the color identity is gold, rose, and cream, not corporate blue. It should feel like a well-run back office the night before the wedding: dark, calm, everything within reach.

Dark is the only theme. It is hard-coded on `<html>` with no toggle and no system-preference fallback; light mode does not exist and must not be reintroduced without an explicit product decision. Density is tuned for manual data entry: compact rows, hover-reveal actions, keyboard-friendly forms, and a fast return to the list after every save. Expression lives in the accents; the working surfaces stay quiet.

**Key Characteristics:**
- Dark-by-default, permanently; no theme switcher anywhere
- Discord spatial hierarchy: desktop 72px icon rail, mobile bottom nav (<lg) + sticky 48px top bar + content surface
- Gold/rose/cream accent layer on a five-step neutral surface scale
- Admin-optimized density: compact tables, hover-reveal row actions, one primary action per view
- Fraunces reserved for the brand mark only; Figtree does all the work

## Colors

The palette is a cool dark neutral ladder warmed by a single gold voice, with rose and cream as supporting wedding tones.

### Primary
- **Wedding Gold** (#c9a84c): the one action voice — primary buttons, active nav state, focus ring, selected-option checkmarks, loading spinner, link buttons, donut highlight accents. Hover lifts to Lighter Gold (#d4b565).
- **Warm Cream** (#f0e6d3): high-emphasis text only — page titles, modal titles, stat values. Never a background, never body text.

### Secondary
- **Blush Rose** (#c4717a): danger-adjacent warmth and category identity (chart-2). Decorative and identificational; real destructive actions use Danger red, not rose.

### Neutral
- **Surface 0** (#111113): deepest background — body, outermost shell.
- **Surface 1** (#1a1b1e): sidebar rail, sticky table header.
- **Surface 2** (#222327): main content area, top bar, table rows at rest.
- **Surface 3** (#2b2d31): cards, inputs, row hover, flat containers.
- **Surface 4** (#313338): elevated surfaces — modals, dropdowns, elevated cards.
- **Surface Overlay** (#0d0d0f): modal backdrop at 80% opacity with backdrop blur.
- **Primary Text** (#f2f3f5): body and table text on all surfaces.
- **Secondary Text** (#b5bac1): labels, descriptions, ghost buttons.
- **Muted Text** (#6d6f78): placeholders, table header labels, disabled hints. Borderline contrast — never use it for data-bearing text.
- **Inverse Text** (#111113): text sitting directly on Wedding Gold.
- **Subtle Border** (rgba(255,255,255,0.06)): surface dividers, table row separators.
- **Default Border** (rgba(255,255,255,0.10)): input, card, and menu outlines.
- **Strong Border** (rgba(255,255,255,0.18)): focused-input border.
- **Danger** (#f04747) / **Success** (#43b581) / **Warning** (#faa61a): semantic states, each paired with a 12%-alpha subtle background for alerts.
- **Focus Ring** (rgba(201,168,76,0.5)): gold halo on every focusable element, globally via `:focus-visible`.

### Category Identity Palette (chart-1..5)
- **chart-1 Gold** (#c9a84c), **chart-2 Rose** (#c4717a), **chart-3 Steel** (#7a9cc4), **chart-4 Sage** (#7ac49c), **chart-5 Sand** (#c49c7a): the identity ramp for Party/Group color coding — badges, stat-card accent bars, chart slices.

### The party-colors.ts Identity System
`src/lib/party-colors.ts` is the single source of category color truth. Named parties (Groom, Bride, Groom Family, Bride Family) map to fixed identities; anything user-created resolves through a deterministic name hash (`h * 31 + charCode`) into an eight-entry FALLBACK palette, so colors are stable forever. Each identity is a `CategoryColor` quadruple: `dot` (solid swatch), `bg` (subtle badge background), `text` (contrast-safe badge text, ≥4.5:1 on its background), `border` (accent). Badge bg/text use literal hexes because Tailwind opacity modifiers can't consume `var()` colors. `CHART_HEX` + `partyHex(name)` resolve the same identities to SVG hex fills for donut slices.

**The One Voice Rule.** Wedding Gold is the only color that ever means "act" — one primary action per view. Its rarity is the point.

**The Identity Rule.** Party color is always resolved through `colorFor(name)`; group color through `colorForGroup(name)`. A category means the same color on every page, forever — never rank, never order, never inline hex.

## Typography

**Display Font:** Fraunces (via `next/font`, `--font-display`, Georgia fallback)
**Body Font:** Figtree (via `next/font`, `--font-body`, system sans fallback)

**Character:** Fraunces brings the wedding warmth in exactly one place; Figtree carries the entire operational interface with quiet, legible neutrality.

### Hierarchy
- **Display** (Fraunces, semibold 600, 14px): the "WG" brand mark in the sidebar rail and the login card title. Nothing else.
- **Page Title** (Figtree, semibold, `text-base` 16px): top-bar headings and card/modal titles, set in Warm Cream.
- **Stat Value** (Figtree, semibold, `text-2xl` 24px, tabular-nums): dashboard numbers, set in Warm Cream.
- **Body / Table Cell / Input** (Figtree, regular 400, `text-sm` 14px): the default reading size everywhere.
- **Table Header** (Figtree, medium 500, `text-xs` 12px, uppercase, tracking-wide): column labels in Muted Text.
- **Label / Badge / Tooltip** (Figtree, medium 500, `text-xs` 12px): field labels in Secondary Text; badges and nav tooltips.
- **Stat Label** (Figtree, medium 500, `text-xs` 12px): under stat values, in Muted Text.

**The Brand-Only Display Rule.** Fraunces appears only in the brand mark and login title. Page headings, card titles, and content are always Figtree medium/semibold — never display type in content.

## Elevation

Depth comes from the five-step surface ladder first; shadows are a secondary, state-responsive layer. The body sits flat on Surface 0, content on Surface 2, resting containers on Surface 3, and only floating UI — modals, dropdowns, elevated cards — reaches Surface 4.

### Shadow Vocabulary
- **shadow-1** (`0 1px 3px rgba(0,0,0,0.4)`): resting lift — stat cards, primary button at rest.
- **shadow-2** (`0 4px 12px rgba(0,0,0,0.5)`): hover response — primary button hover, elevated cards, dropdown/select popovers.
- **shadow-3** (`0 8px 24px rgba(0,0,0,0.6)`): interactive-card hover only.
- **shadow-modal** (`0 16px 48px rgba(0,0,0,0.8)`): dialogs above the blurred overlay.

**The State-Responsive Elevation Rule.** Elevation increases only in response to state. Body and resting content carry no shadow; cards hold shadow-1/shadow-2; hover may step up one level; modals alone use shadow-modal. Nothing animates to a lower elevation than it started from.

## Components

Motion conventions: page transitions are framer-motion fade-and-rise (16px to 0, 0.22s easeOut) on every page's main content via shared `pageVariants`; modals scale 0.96 → 1 over 0.18s; micro-interactions stay Tailwind-only — buttons press to 95% scale, badges transition colors over 200ms, stat cards lift a shadow level on hover, nav items press to 90%. `getVariants(reducedMotion)` zeroes durations and travel when the user prefers reduced motion; the modal drops its scale but keeps the fade.

### Button
Five variants, four sizes, one loading pattern. **Primary** is Wedding Gold with Inverse Text, semibold, shadow-1 lifting to shadow-2 on hover. **Secondary** is Surface 3 with a default border, stepping to Surface 4 on hover. **Ghost** is transparent Secondary Text, gaining a Surface 3 wash on hover — the toolbar and icon-action workhorse. **Danger** is solid red reserved for confirm-delete dialogs only, never a row-level trigger. **Link** is a gold underlined text button (auto-height, no padding, keeps the focus ring) for inline text actions like the BR-007 "Lihat di daftar →" jump inside alerts. Sizes: `sm` (28px), `md` (36px, default), `lg` (40px), `icon` (32px square). Loading swaps in a Spinner matching the button's text color, disables the button, sets `aria-busy`. Every button carries the gold focus ring offset against its parent surface.

### Input + Field
Inputs rest on Surface 3 with a default border, 36px tall, `text-sm`. Focus shifts the border to strong and adds the gold ring. Error state turns the border Danger red and sets `aria-invalid`; the Field wrapper renders the error in red `text-xs` with `role="alert"` directly beneath, label above in Secondary Text. Select (Radix) matches Input styling exactly, with a muted chevron and gold check on the selected item.

### Modal
Radix Dialog on an 80% Surface Overlay backdrop with blur. Panel is Surface 4, generously rounded (16px), shadow-modal, padded 24px, max-width 448px (384px for `sm`). Title in Warm Cream, optional description in Secondary Text, 32px ghost close button top-right. Enter animation: fade plus slight zoom, 180ms.

### Table
Rounded container (12px) with a subtle border. Sticky header on Surface 1, uppercase muted labels. Rows rest on Surface 2 and warm to Surface 3 on hover in 100ms. Row actions follow hover-reveal: hidden on `sm+` until row hover or keyboard focus-within, always visible on touch — Linear-style density without sacrificing accessibility. A newly saved guest's row flashes a gold-subtle background that fades to transparent over 1.5s (`MotionTableRow`).

On mobile the guest view adapts: the filter toolbar stacks vertically with full-width search and selects (`sm` restores the inline row), Export CSV and Tambah Tamu move into a sticky action bar pinned directly above the bottom nav (`bottom-14`, visible below `sm` only — `sm+` shows them in the top bar), the Alamat column hides below `sm`, and row actions stay always-visible as 32×32 touch targets.

### Pagination
The guest table paginates at 10 rows per page. Inactive page links and prev/next buttons use the ghost Button tokens (Secondary Text warming to Primary on a Surface 3 wash); the active link carries the gold identity — `accent-gold-subtle` wash, `border-accent-gold`, Warm Cream text — and `aria-current="page"`. Ellipses and the "Menampilkan X–Y dari Z tamu" count line sit in Muted `text-xs` (count-in-muted is an explicit product decision for this line only). Controls appear below the table only when there is more than one page; desktop shows 7 page items, mobile 5 (via `useIsMobile`). A "Tampilkan Semua" ghost `sm` toggle sits beside the controls and renders the unfiltered-by-pagination full list (label swaps to "Tampilkan Per Halaman", which returns to page 1); any filter change resets to page 1 in paginated mode. Page changes animate the old rows out (y −8, 150ms) and the new rows in (y 8→0, 200ms) under `AnimatePresence`, zeroed for reduced motion.

### Stat Card
Flat Surface 3 card (12px radius, 80px minimum height, shadow-1 lifting to shadow-2 on hover over 200ms) with a 3px left accent bar in the category identity color resolved from `colorFor().dot`. Value in 24px tabular Warm Cream, label in muted `text-xs`.

### Category Badge
Party badges carry the identity: 6px color dot plus subtle identity background with contrast-safe identity text. Group badges resolve through their own `colorForGroup` identity (below). Parties and groups each own a distinct color-coded axis.

**Group identity — `colorForGroup(name)`.** Groups resolve through `colorForGroup(name)` from `src/lib/party-colors.ts`: eight named hex identities (Rekan Kerja `#5B8CDB` through Lainnya `#8A8FA8`), with unmapped names falling back through the same deterministic `h * 31 + charCode` hash into that palette. It returns `{ dot, bg, text }` — `bg` is the dot at 15% alpha, `text` is the dot lightened toward white to hold ≥4.5:1 on the tinted background — applied via inline style, because dynamically built arbitrary-value Tailwind classes are invisible to the JIT scanner. Group dots and badges carry this identity everywhere they render: filter selects, table badges, the category list, and analytics donut slices.

### App Shell
Dual navigation, one shell. Desktop (`lg` and up): a 72px fixed left rail on Surface 1 — Fraunces gold "WG" brand mark in a 36px circle, a divider, then icon-only nav (44px targets, 20px icons) with Radix Tooltips on the right side at 300ms delay. Active route is Wedding Gold on a gold-subtle wash, rounded 12px; inactive icons are muted, warming on hover. Logout sits pinned at the bottom.

Mobile (below `lg`): a fixed bottom navigation bar (56px, Surface 1, top border, z-30) with four evenly spaced items — the three routes plus a logout button — each a 44×44 target with a `text-[10px]` medium label under the icon. Active items turn Wedding Gold and show a 4px dot indicator below the label; inactive items are muted. No tooltips; items press to 90% scale. The content wrapper compensates: full-width with 56px bottom clearance on mobile (`ml-0 pb-14`), rail offset restored on desktop (`lg:ml-[72px] lg:pb-0`).

A sticky 48px top bar on Surface 2 holds the page title and contextual actions. `/login` renders fullscreen without any navigation chrome.

### Analytics
Read-only distribution view. Desktop places a flat filter card beside an elevated chart card (`lg:grid-cols-3`); on mobile the filter panel becomes a collapsible accordion above the chart (collapsed by default, AnimatePresence height animation, chevron rotating 180°). Both Party and Group modes render the donut — fixed 280px on desktop, fluid via the chart library's ParentSize inside a 280px cap on mobile — with slice fills from `partyHex` (Party) and `colorForGroup().dot` (Group). The chart panel holds a 320px minimum height so loading and loaded states never shift layout.

### Supporting Cast
Alert (error/success/warning: left border stripe, 12%-alpha semantic wash, matching icon; info: strong border on Surface 3 with a secondary-text icon), Dropdown Menu (Surface 4, 12px radius, shadow-2, danger items in red), Card (elevated Surface 4 / flat Surface 3 / interactive with hover shadow-3), Empty State (dashed border, muted 40px icon, optional action), Loading (gold spinner, shimmer skeletons, role="status" table skeleton).

## Do's and Don'ts

### Do:
- **Do** use CSS variables / Tailwind token classes for every color — never raw hex in components (the one sanctioned exception: `party-colors.ts` badge hexes, which exist because Tailwind opacity modifiers can't consume `var()`).
- **Do** resolve every party color through `party-colors.ts` `colorFor(name)` and every group color through `colorForGroup(name)` — badges, dots, stat accents, chart slices, all of them.
- **Do** always use `colorForGroup()` for group color resolution — never inline group hex values.
- **Do** keep table row actions on the hover-reveal pattern (opacity transition, always visible to keyboard focus-within and touch).
- **Do** keep one Wedding Gold primary action per view; subordinate actions go secondary or ghost.
- **Do** reserve solid Danger red for confirmation dialogs; row-level delete triggers are ghost danger icons.
- **Do** give every async surface a loading state with reserved space (skeleton or spinner, no layout jump).

### Don't:
- **Don't** use Fraunces anywhere but the brand mark and login title — content headings are Figtree, always.
- **Don't** add light mode, a theme toggle, or system-preference fallback without an explicit product decision; dark is the product.
- **Don't** introduce a fourth accent color; the wedding layer is gold, rose, cream — semantics (danger/success/warning) are states, not accents.
- **Don't** inline party or group hex values anywhere; identity comes from `colorFor` or nothing.
- **Don't** style buttons, inputs, or modals page-locally; extend `src/components/ui/` instead.
- **Don't** use Muted Text for data-bearing content (counts, values, names) — it is for placeholders and hints, and sits near the contrast floor.
