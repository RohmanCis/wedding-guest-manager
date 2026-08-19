# AGENTS.md

Wedding Guest Manager — standalone, single-admin wedding guest-list app. One administrator manually enters guests collected from multiple parties.

**Status: MVP complete + deployed live** (incl. approved `/analytics` exception below). 42/42 tests green; typecheck/build clean. Live: https://wedding-guest-manager-pi.vercel.app (Vercel + Supabase Postgres, auto-deploy from GitHub `main`). Local SQLite data (21 guests) migrated 2026-08-19.

Source of truth:
- `PRD-Wedding-Guest-Manager.md` — product spec. Read before non-trivial work. Do not invent product scope.
- `DESIGN.md` (+ `.impeccable/design.json`) — design system. Read before UI work; keep in sync when the system changes.
- `Task.md` — tracked task queue (cleanup, audits, refactors) with per-task scope, constraints, and status log. Read at session start; execute one task at a time; update its Status Log when done. Do not start a listed task without following its written scope.

## Commands

```bash
npm run typecheck   # tsc --noEmit
npm test            # vitest run
npm run build       # next build
```

All three must pass before a task is done.

## Precedence

1. Explicit current user decision
2. PRD requirements
3. Existing implementation (only if it doesn't conflict with 1–2)
4. Agent assumptions (never override 1–3)

## Product boundary

Implemented and complete: single-admin auth · guest CRUD (`name`/`address`/`party_id`/`group_id`/`pax`, exactly one party + one group per guest) · name search · party/group/combined filters + reset · duplicate prevention by normalized name · party & group management · CSV export all/filtered (columns `Name,Address,Party,Group,Pax`) · `pax` field: integer 1–4 people per entry, default 1 (explicit user decision 2026-08-19; not household tracking — one number per guest entry, no member names) · `/analytics` read-only horizontal bar distribution (explicit user decision 2026-08-18 — the ONLY analytics allowed; counts entries, NOT pax-weighted; donut replaced by bar per user decision 2026-08-19).

Never add, even under another name, unless the user makes an explicit product decision first: multi-user accounts · invitation status · RSVP · attendance/check-in · household member tracking (names within one entry) · QR codes · WhatsApp/email/SMS integrations · CSV/Excel import · relationship/free-text relation fields · public guest-facing portal · analytics beyond `/analytics` (no trends, no pax/RSVP charts, no analytics export) · notifications · payments/budgeting · invitation-website features.

A request that changes guest identity, party/group cardinality, required guest fields, duplicate definition, auth model, or import/export scope is a product change — surface it, don't implement silently.

## Invariants — do not break

- Duplicate identity = normalized name ONLY (trim → collapse internal whitespace → case-insensitive; `normalizeName`, BR-006). Address/party/group never affect it. No fuzzy/phonetic matching.
- Enforcement is server-side AND database-backed: app pre-check + `guests.name_norm` UNIQUE (TOCTOU race → `DuplicateNameError`). Duplicate 409 response carries `existingId`; UI surfaces "Lihat di daftar →" (BR-007). Guest may keep its own name on edit (BR-008).
- All guest business rules live in `src/lib/guests.ts`, server-authoritative. CSV export reuses `listGuests()` filter semantics — never duplicate filter logic. Columns `Name,Address,Party,Group,Pax`, UTF-8, filenames `wedding-guests-{all|filtered}-YYYY-MM-DD.csv`.
- Category delete blocked while `used > 0`; never silently reassign or cascade-delete guests. Guest delete requires explicit confirmation. Create/update atomic.
- Auth: cookie session via `src/lib/session.ts`. `ADMIN_SESSION_SECRET` must be set in production (Vercel env) — if missing, `SESSION_SECRET` falls back to `""` and `validSession()` returns `false` for everything: app fails CLOSED (login sets cookie but every route redirects to `/login`). Never throw at module load in `src/lib/session.ts` — it crashes Edge middleware silently and hangs every request (fixed 2026-08-19). Login cookie is `secure: true`, `maxAge` 7d. `src/middleware.ts` guards everything except `/login`, `/api/auth/*`, static assets, `icon.svg`. Login success must navigate via `window.location.href` (full load), NOT `router.push` + `router.refresh` — SPA/RSC nav races the browser's cookie commit, middleware sees no cookie and bounces back to `/login` (fixed 2026-08-19).
- SSR pages (`/`, `/categories`, `/analytics`) read `lib/` directly and pass `initial*` props to `*-view.tsx` client components, which skip the initial fetch. `listGuests()` must spread rows to plain objects — postgres.js row class instances are not RSC-serializable.
- **DB: postgres.js pool `max: 1` + `prepare: false`** (Supabase transaction pooler). Two hard rules: (1) SSR pages await list queries **sequentially** — `Promise.all` across `listGuests`/`parties.list`/`groups.list` deadlocks the pool for 240s+ (listWithUsed fans out refCount sub-queries); (2) `postgres` stays in `serverComponentsExternalPackages` (next.config.mjs) — bundling it breaks RSC module evaluation. `DATABASE_URL` is REQUIRED at module load (boot failure if missing).
- UI: consume `src/components/ui/` primitives only — zero page-local button/input/modal styling. Party colors resolve through `colorFor(name)`, group colors through `colorForGroup(name)`; category icons through `iconFor(name)`/`iconForGroup(name)` rendered via `CategoryIcon` (single source: `src/lib/party-colors.ts`); never inline category hexes or icon maps. Icons sit beside the color dot (dot = identity); never in guest table badges. Dropdown/modal popovers keep viewport-edge inset (`collisionPadding`, `max-w` calc). Dark theme only — no light mode, no toggle. Fraunces = brand mark/login title only. One gold primary action per view; solid Danger red only in confirm dialogs.
- Every business-rule change ships with tests (colocated `src/lib/*.test.ts`) covering at minimum the PRD §12 acceptance criteria for the changed behavior.

## File map — read only what the task needs

| Path | Role |
|---|---|
| `src/lib/guests.ts` | ALL guest business rules: CRUD, duplicate check, filter semantics, CSV export |
| `src/lib/normalize.ts` | `normalizeName` (BR-006), `DuplicateNameError(existingId)` |
| `src/lib/categories.ts` | Party/Group CRUD, rename, safe-delete guard |
| `src/lib/db.ts` | postgres.js pool (`DATABASE_URL` required, `max:1`, `prepare:false`), schema + seed; `name_norm` UNIQUE |
| `src/lib/session.ts` | Cookie session; `ADMIN_SESSION_SECRET` fail-closed (empty fallback rejects all sessions) |
| `src/lib/auth.ts` | Credential check (timing-safe) + shared API `guard()` |
| `src/lib/client.ts` / `api-error.ts` | Client fetch helpers; `ApiError` carries `existingId` |
| `src/lib/party-colors.ts` | Single category identity source: `colorFor`/`colorForGroup`, `iconFor`/`iconForGroup` (named maps + deterministic hash fallback), `CHART_HEX`, `partyHex` |
| `src/lib/animation-variants.ts` | Shared motion variants + reduced-motion zeroing |
| `src/middleware.ts` | Route guard |
| `src/app/(app)/page.tsx` → `guests-view.tsx` | Guest dashboard: stats, filter toolbar (search debounced 300ms), table with 10-row pagination + "Tampilkan Semua" toggle, modals, BR-007 jump, mobile sticky action bar |
| `src/app/(app)/categories/*` | Category management (server page → client view) |
| `src/app/(app)/analytics/*` | Analytics horizontal bar chart, Party/Group modes (server page → client view, read-only) |
| `src/app/login/page.tsx` | Login; after success does a FULL page navigation (`window.location.href`), never `router.push`/`refresh` |
| `src/app/api/guests/route.ts` | GET list/csv · POST · PUT · DELETE |
| `src/app/api/categories/route.ts` | GET · POST · PUT · DELETE |
| `src/app/api/auth/login/route.ts` | POST login · DELETE logout |
| `src/components/ui/` | 13 shared primitives (incl. pagination) — consume, never restyle locally |
| `src/components/charts/` | 14 vendored bklit chart files — do not hand-edit |
| `src/components/app-shell.tsx` | Dual nav: 72px desktop icon rail + mobile bottom nav (<lg), TopBar; `/login` renders without chrome |
| `src/hooks/` | `use-analytics-data`, `use-is-mobile`, `use-pagination`, `use-reduced-motion` |
| `src/lib/*.test.ts` | 42 tests: guests 19 · categories 10 · filter 8 · auth 5 |
| `vitest.setup.ts` | Per-worker Postgres schema `test_w<N>` via `search_path` on `DATABASE_URL`; loads `ADMIN_SESSION_SECRET` from `.env.local` (fixed fallback) |
| `DEPLOYMENT.md` | Deployment + env vars (incl. required `ADMIN_SESSION_SECRET`) |

Stack notes: `motion` 13 — package name `motion`, imported as `motion/react` (NOT framer-motion). Radix dialog/select/dropdown/tooltip + cva + lucide-react. bklit charts pull `@visx/*`, `d3-shape`, `@number-flow/react`.

## Working rules

- Simplest maintainable solution that preserves PRD behavior. Prefer boring code, deletion over addition, fewest files. No premature abstraction, no speculative modules, no unrequested "for later" scaffolding.
- Wedding-list scale, not ERP: no event sourcing, CQRS, microservices, workflow engines, permission matrices, dynamic field builders, taxonomy engines, fuzzy-search infra, message queues, feature flags.
- Server pages are `force-dynamic`; first paint carries no entrance animation (LCP); motion only after first paint, zeroed for reduced motion.
- Validation: reject blank values after trim; errors clear and local to the field; never expose raw DB errors. Destructive actions need confirmation.
- Unknowns → ask; don't guess product scope.
