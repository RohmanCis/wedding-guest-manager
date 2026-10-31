# AGENTS.md

Wedding Guest Manager — standalone, single-admin wedding guest-list app. One administrator manually enters guests collected from multiple parties.

**Status: MVP complete + deployed live** (incl. approved `/analytics` exception below). 144/144 tests green; typecheck/build clean. Live: https://wedding-guest-manager-pi.vercel.app (Vercel + Supabase Postgres, auto-deploy from GitHub `main`). Local SQLite data (21 guests) migrated 2026-08-19.

Verified 2026-10-28: `feat/daftar` fast-forwarded into `main` (`e14d49a`) and confirmed serving in production — sortable columns + sort wording seam (click-toggle, `aria-sort`, `Terurut: …` count-line suffix, `Urutan default` reset), Ctrl/Cmd+Enter accelerator, `/daftar` on both navs, filtered CSV export honoring screen filter + sort. typecheck / 133 tests / build re-run green the same day. Prod was carrying 422 guests / 680 pax at the time.

Verified 2026-10-31 (`860afc6`, `d32de5d`): security headers added (`X-Frame-Options` DENY, `nosniff`, `Referrer-Policy`, minimal CSP) and confirmed via `curl -I` on a local `next start` for both a static (`/login`) and a dynamic (`/` → 307) route; dynamic Router Cache staleness closed with `experimental.staleTimes { dynamic: 0 }`; category duplicate handling now relies on the `name` UNIQUE constraint (23505) instead of a pre-check. typecheck / **141** tests / build green.

Also 2026-10-31 (same day, after `8aee241`): dashboard stat cards now follow the active filter (`total` = filtered count, `totalPax` = filtered pax sum, party cards counted from the filtered list; the empty state still branches on the global count). Category names are case-insensitive — `CREATE UNIQUE INDEX ... (lower(name))` on `parties`/`groups` (23505 → `ValidationError`), checked against the live DB first (no case-collision rows). typecheck / **144** tests / build green.

Also 2026-10-31, after `34af317`: the filter control surface was extracted to `GuestFilterFields` + `useGuestFilter` — guests, daftar, and analytics render the same search/Party/Group fields (analytics options now carry the category dot + icon too); each view keeps its own wrapper, Reset, and count line. Verified in a local browser at 375px and 1440px: filter + reset, debounce, Ctrl/Cmd+Enter accelerator, empty sections, no horizontal overflow. typecheck / 144 tests / build green.

Live-verified 2026-10-31 by the owner in production (`34a9226`, real devices): the four security headers arrive, boot after the `lower(name)` indexes is clean, stat cards shrink with the active filter, a mutation followed by a revisit shows fresh data (no Router Cache staleness), and on real iOS Safari the sticky TopBar, Add to Home Screen, and the `/daftar` search/Party/Group filters all behave.

2026-11-01, `/daftar` first-load work (owner report: "feels slow" at ~700 guests; no benchmark run — the local build/Playwright measurement was aborted as ineffective). Two changes, neither touches server latency: (a) `src/app/(app)/daftar/loading.tsx` — first `loading.tsx` in the app; navigation to the route now paints a chrome-matched skeleton immediately instead of a silent stall, and it gives Next a prefetch boundary on a `force-dynamic` route; (b) `.section-cv` in `globals.css` (`content-visibility: auto; contain-intrinsic-size: auto 800px`) applied to the `<section>` in `daftar-view.tsx:154`, so first paint lays out only on-screen sections. Sticky headers, scrollbar height, Ctrl+F reveal, and reduced-motion shimmer all still need the owner's manual pass (`npm run build && npm start`) — see the test steps in the task thread. typecheck / **144** tests / build green. Not yet verified in production.

Source of truth:
- `PRD-Wedding-Guest-Manager.md` — product spec. Read before non-trivial work. Do not invent product scope.
- `DESIGN.md` (+ `.impeccable/design.json`) — design system. Read before UI work; keep in sync when the system changes.
- `CONTEXT.md` — domain glossary (Guest, Party, Group, pax, duplicate name, Guest filter, sort state, distribution, section). Keep in sync when a term sharpens.

## Commands

```bash
npm run typecheck   # tsc --noEmit
npm test            # vitest run
npm run build       # next build
```

All three must pass before a task is done.

Windows/PowerShell note: always double-quote paths containing parentheses (e.g. `"src/app/(app)/..."`) — bare `src/app/(app)/...` is parsed as a subexpression and silently mangles git/npm arguments.

## Precedence

1. Explicit current user decision
2. PRD requirements
3. Existing implementation (only if it doesn't conflict with 1–2)
4. Agent assumptions (never override 1–3)

## Product boundary

Implemented and complete: single-admin auth · guest CRUD (`name`/`address`/`party_id`/`group_id`/`pax`, exactly one party + one group per guest) · name search · party/group/combined filters + reset · guest-table sort by Nama/Jumlah/Party/Group, click-toggle direction, default `name asc`, instant client-side, filtered CSV export follows the screen sort (explicit user decision 2026-09-19; no multi-column sort, no URL-sync — explicitly deferred; the grouped/sectioned-view deferral is superseded by `/daftar` below (2026-09-20), for the separate page only — the guest table stays flat) · duplicate prevention by normalized name · party & group management · CSV export all/filtered (columns `Name,Address,Party,Group,Pax`) · `pax` field: integer 1–4 people per entry, default 1 (explicit user decision 2026-08-19; not household tracking — one number per guest entry, no member names) · `/analytics` read-only horizontal bar distribution (explicit user decision 2026-08-18 — the ONLY analytics allowed; counts entries, NOT pax-weighted; donut replaced by bar per user decision 2026-08-19) · Ctrl/Cmd+Enter desktop accelerator that opens the same "Tambah Tamu" modal (`use-add-guest-shortcut`, option C; desktop lg+ only, static `<kbd>Ctrl ↵</kbd>` chip inside the gold button, Nama autofocus on fine pointer — no scope change) · `/daftar` read-only sectioned scan page (explicit user decision 2026-09-20 — all guests on one scrolling page, sectioned by Party or Group via mode toggle, same search/Party/Group filters + reset, sticky section headers with category identity + entry counts (entries, not pax), empty sections always hidden, name-asc within sections, category-list order between sections; pure `groupGuests()` in `src/lib/group-guests.ts`; no actions/export/totals/collapsing/virtualization — `content-visibility` only a possible measured follow-up).

Never add, even under another name, unless the user makes an explicit product decision first: multi-user accounts · invitation status · RSVP · attendance/check-in · household member tracking (names within one entry) · QR codes · WhatsApp/email/SMS integrations · CSV/Excel import · relationship/free-text relation fields · public guest-facing portal · analytics beyond `/analytics` (no trends, no pax/RSVP charts, no analytics export) · notifications · payments/budgeting · invitation-website features.

A request that changes guest identity, party/group cardinality, required guest fields, duplicate definition, auth model, or import/export scope is a product change — surface it, don't implement silently.

## Invariants — do not break

- Duplicate identity = normalized name ONLY (trim → collapse internal whitespace → case-insensitive; `normalizeName`, BR-006). Address/party/group never affect it. No fuzzy/phonetic matching.
- Enforcement is server-side AND database-backed: app pre-check + `guests.name_norm` UNIQUE (TOCTOU race → `DuplicateNameError`). Duplicate 409 response carries `existingId`; UI surfaces "Lihat di daftar →" (BR-007). Guest may keep its own name on edit (BR-008).
- All guest business rules live in `src/lib/guests.ts`, server-authoritative. CSV export reuses `listGuests()` filter + sort semantics — never duplicate that logic. Columns `Name,Address,Party,Group,Pax`, UTF-8, filenames `wedding-guests-{all|filtered}-YYYY-MM-DD.csv`. `listGuests` ORDER BY only ever receives identifiers from the `SORT_COLUMNS` map (whitelisted twice: `parseFilter` rejects unknown `sort` keys at the HTTP boundary, the map lookup defaults to `g.name`) — a raw sort param must never reach SQL.
- Category delete blocked while `used > 0`; never silently reassign or cascade-delete guests. Guest delete requires explicit confirmation. Create/update atomic. Duplicate party/group names are enforced case-insensitively by the `lower(name)` UNIQUE index (23505 → `ValidationError`), not a pre-check — "Budi" and "budi" are the same category name.
- Transport hardening lives in `next.config.mjs`: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, CSP `frame-ancestors 'none'; base-uri 'self'; object-src 'none'` (deliberately no `script-src` — Next injects inline scripts), and `experimental.staleTimes { dynamic: 0 }` so a revisit after a mutation never serves a stale Router Cache payload. After deploy, verify with `curl -I` on a static and a dynamic route.
- Auth: cookie session via `src/lib/session.ts`. `ADMIN_SESSION_SECRET` must be set in production (Vercel env) — if missing, `SESSION_SECRET` falls back to `""` and `validSession()` returns `false` for everything: app fails CLOSED (login sets cookie but every route redirects to `/login`). Never throw at module load in `src/lib/session.ts` — it crashes Edge middleware silently and hangs every request (fixed 2026-08-19). Login cookie is `secure: true`, `maxAge` 7d. `src/middleware.ts` guards everything except `/login`, `/api/auth/*`, static assets, `icon.svg`. Login success must navigate via `window.location.href` (full load), NOT `router.push` + `router.refresh` — SPA/RSC nav races the browser's cookie commit, middleware sees no cookie and bounces back to `/login` (fixed 2026-08-19).
- SSR pages (`/`, `/categories`, `/analytics`, `/daftar`) read `lib/` directly and pass `initial*` props to `*-view.tsx` client components, which skip the initial fetch. `listGuests()` must spread rows to plain objects — postgres.js row class instances are not RSC-serializable.
- **DB: postgres.js pool `max: 1` + `prepare: false`** (Supabase transaction pooler). Two hard rules: (1) SSR pages await list queries **sequentially** — `Promise.all` across `listGuests`/`parties.list`/`groups.list` historically deadlocked the pool for 240s+ (diagnosed against the old N+1 `listWithUsed` refCount fan-out, since collapsed to a single LEFT JOIN query; the rule stays as cheap insurance for the max:1 pool — don't refactor back to `Promise.all`); (2) `postgres` stays in `serverComponentsExternalPackages` (next.config.mjs) — bundling it breaks RSC module evaluation. `DATABASE_URL` is REQUIRED at module load (boot failure if missing).
- UI: consume `src/components/ui/` primitives only — zero page-local button/input/modal styling. Party colors resolve through `colorFor(name)`, group colors through `colorForGroup(name)`; category icons through `iconFor(name)`/`iconForGroup(name)` rendered via `CategoryIcon` (single source: `src/lib/party-colors.ts`); never inline category hexes or icon maps. Icons sit beside the color dot (dot = identity); never in guest table badges. Dropdown/modal popovers keep viewport-edge inset (`collisionPadding`, `max-w` calc). Dark theme only — no light mode, no toggle. Fraunces = brand mark/login title only. One gold primary action per view; solid Danger red only in confirm dialogs.
- Every business-rule change ships with tests (colocated `src/lib/*.test.ts` / `src/hooks/*.test.ts`) covering at minimum the PRD §12 acceptance criteria for the changed behavior.

## File map — read only what the task needs

| Path | Role |
|---|---|
| `src/lib/guests.ts` | ALL guest business rules: CRUD, duplicate check, filter semantics, sort-aware CSV export |
| `src/lib/guest-filter.ts` | The Guest filter seam: `GuestFilter` type (+ optional `sort`/`dir`, whitelisted in `parseFilter`) + `filterParams`/`parseFilter` (query-param encode/decode) — pure module, safe for client AND server import; all query-string building goes through it, never hand-rolled |
| `src/components/guest-filter-fields.tsx` | The one filter control surface: search + Party + Group selects (category dot + icon on every option), `layout="inline" | "stacked"`; renders no wrapper — caller owns row/column layout, Reset, count line |
| `src/hooks/use-guest-filter.ts` | Filter triple as view state: `search`/`partyId`/`groupId` + setters, `reset`, `hasFilter` — one owner across guests, daftar, analytics |
| `src/lib/guest-sort.ts` | Pure table sort: `SortKey`/`SortState`/`sortGuests` (pax numeric, `id` locale, name-asc tiebreak mirroring the SQL `, g.name ASC`) + `SORT_KEYS` whitelist; default `{name, asc}` = server order, zero visual diff. Also the sort wording seam: `isDefaultSort`/`sortDirectionWord`/`sortDescription`/`sortAnnouncement` (count-line "Terurut: …" suffix, A–Z/Z–A, Jumlah 1→4/4→1, SR aria-live text) |
| `src/lib/group-guests.ts` | Pure `/daftar` grouping: `groupGuests()` sections by party/group name in category-list order, empty sections always hidden, unknown categories append as trailing sections — never dropped |
| `src/lib/duplicate-jump.ts` | BR-007 duplicate jump decision core: pure `rowReveal()` → missing / page / visible; shared by duplicate highlight + new-guest flash effects |
| `src/lib/normalize.ts` | `normalizeName` (BR-006), error classes, and `errorPayload` — the single source of the API error wire contract (409 duplicate + existingId / 404 / 400 + field / 500) |
| `src/lib/api-error.ts` | Thin `NextResponse` wrapper over `errorPayload` — never hand-builds error JSON |
| `src/lib/categories.ts` | Party/Group CRUD, rename, safe-delete guard |
| `src/lib/db.ts` | postgres.js pool (`DATABASE_URL` required, `max:1`, `prepare:false`), schema + seed; `name_norm` UNIQUE; `lower(name)` UNIQUE index on `parties`/`groups` |
| `src/lib/session.ts` | Cookie session; `ADMIN_SESSION_SECRET` fail-closed (empty fallback rejects all sessions) |
| `src/lib/auth.ts` | Credential check (timing-safe) + shared API `guard()` |
| `src/lib/client.ts` / `api-error.ts` | Client fetch helpers; `ApiError` carries `existingId` typed from the shared `DuplicateNamePayload` contract |
| `src/lib/party-colors.ts` | Single category identity source: `colorFor`/`colorForGroup`, `iconFor`/`iconForGroup` (named maps + deterministic hash fallback), `CHART_HEX`, `partyHex`, `hexFor(kind, name)` — the one hex rule for both kinds |
| `src/lib/animation-variants.ts` | Shared motion variants + reduced-motion zeroing |
| `src/middleware.ts` | Route guard |
| `src/app/(app)/page.tsx` → `guests-view.tsx` | Guest dashboard: stats (Total / Total Pax / party cards all reflect the active filter; the empty state branches on the global count), filter toolbar (search debounced 300ms), sortable table (client-side, default `name asc`) with 10-row pagination + "Tampilkan Semua" toggle, modals, BR-007 jump, mobile sticky action bar. Fetch pipeline lives in `useGuestList` — the view never hand-rolls fetch/debounce/race handling. Every index-based consumer reads the `sorted` array, never raw `guests` |
| `src/app/(app)/categories/*` | Category management (server page → client view) |
| `src/app/(app)/analytics/*` | Analytics horizontal bar chart, Party/Group modes (server page → client view, read-only) |
| `src/app/(app)/daftar/*` | Read-only sectioned scan view (server page → client view, Party/Group mode toggle, shared filter triple, no pagination). `loading.tsx` = chrome-matched skeleton (first loading boundary in the app). Sections carry `.section-cv` (`content-visibility: auto`) — perf hint only, never apply to the flat guest table on `/` |
| `src/app/login/page.tsx` | Login; after success does a FULL page navigation (`window.location.href`), never `router.push`/`refresh` |
| `src/app/api/guests/route.ts` | GET list/csv · POST · PUT · DELETE |
| `src/app/api/categories/route.ts` | GET · POST · PUT · DELETE |
| `src/app/api/auth/login/route.ts` | POST login · DELETE logout |
| `src/components/ui/` | 13 shared primitives (incl. pagination) — consume, never restyle locally |
| `src/components/charts/` | 14 vendored bklit chart files — do not hand-edit |
| `src/components/app-shell.tsx` | Dual nav: 72px desktop icon rail + mobile bottom nav (<lg), TopBar; `/login` renders without chrome |
| `src/hooks/` | `use-guest-list` (guest-list data module: debounce + filter encode + fetch + refresh, race-safe, optional `sort`/`dir` passthrough for the CSV seam — guests-view deliberately sorts client-side instead; consumed by guests-view, use-analytics-data, AND daftar-view, which leaves sort/dir unset and uses the server default order), `use-guest-filter` (filter triple view state + `reset`/`hasFilter`), `use-analytics-data` (derive-only distribution on top), `use-add-guest-shortcut` (Ctrl/Cmd+Enter → Tambah Tamu; pure `shouldTriggerShortcut` predicate + ref-stable window listener), `use-is-mobile`, `use-pagination`, `use-reduced-motion` |
| `src/lib/*.test.ts`, `src/hooks/*.test.ts` | 144 tests: guests 23 · categories 14 · filter 8 · guest-filter 10 · guest-sort 36 · group-guests 8 · duplicate-jump 6 · use-guest-list (request-gate) 4 · api-error 6 · auth 5 · add-guest-shortcut 17 · party-colors 7 |
| `vitest.setup.ts` | Per-worker Postgres schema `test_w<N>` via `search_path` on `DATABASE_URL`; loads `ADMIN_SESSION_SECRET` from `.env.local` (fixed fallback) |
| `DEPLOYMENT.md` | Deployment + env vars (incl. required `ADMIN_SESSION_SECRET`) |

Stack notes: `motion` 13 — package name `motion`, imported as `motion/react` (NOT framer-motion). Radix dialog/select/dropdown/tooltip + cva + lucide-react. bklit charts pull `@visx/*`, `d3-shape`, `@number-flow/react`.

## Working rules

- Simplest maintainable solution that preserves PRD behavior. Prefer boring code, deletion over addition, fewest files. No premature abstraction, no speculative modules, no unrequested "for later" scaffolding.
- Wedding-list scale, not ERP: no event sourcing, CQRS, microservices, workflow engines, permission matrices, dynamic field builders, taxonomy engines, fuzzy-search infra, message queues, feature flags.
- Server pages are `force-dynamic`; first paint carries no entrance animation (LCP); motion only after first paint, zeroed for reduced motion.
- Validation: reject blank values after trim; errors clear and local to the field; never expose raw DB errors. Destructive actions need confirmation.
- Unknowns → ask; don't guess product scope.
- Filter seam (2026-10-31): the control surface lives once in `src/components/guest-filter-fields.tsx` (+ `useGuestFilter`); guests, daftar, and analytics all render it. Each view still owns its wrapper, Reset, and count line.

## Open follow-ups

(Recording only — this list is not a backlog; each item starts with its own decision. Task.md was removed deliberately in 5329087 and stays removed.)

1. **`/daftar` first-load polish** — `loading.tsx` skeleton + `.section-cv` shipped 2026-11-01 without a benchmark. Owner manual pass still outstanding: sticky headers under `content-visibility`, scrollbar height stability (`contain-intrinsic-size: auto 800px` guess), Ctrl+F reveal, reduced-motion shimmer, 375px layout shift. If still slow, the next levers in order: strip unused `party_id`/`group_id` from the `/daftar` props, merge the `parties`+`groups` queries into one round trip, stream `listGuests()` inside a `Suspense` boundary (the only one that helps cold load — `loading.tsx` only helps navigation). `loading.tsx` is still missing on `/`, `/analytics`, `/categories`.
2. **Production accepts default `admin` / `admin`** — found 2026-10-28 by driving the live `/login` form: `ADMIN_USERNAME`/`ADMIN_PASSWORD` are unset on Vercel, so `src/lib/session.ts` falls back to `"admin"`. Guest PII (422 entries incl. addresses) is readable by any visitor. Fix: set both vars on the Vercel project and redeploy (env changes need a new build), verify `admin`/`admin` is rejected, then rotate `ADMIN_SESSION_SECRET` to kill any already-issued session cookie. Status: ACCEPTED RISK 2026-10-31 — single-user personal deployment; do not implement unless the app is shared.
