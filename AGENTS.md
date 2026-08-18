# AGENTS.md

## Project: Wedding Guest Manager

This document is the execution contract for coding agents and agent orchestrators working on this repository.

The project is a **standalone wedding guest management application**.

The primary operator is a **single administrator** who manually enters guest data collected from different parties.

Agents must treat the PRD as the product source of truth and must not invent product scope.

---

## 0. Current State & Agent Bootstrap

**Status: MVP COMPLETE + review-fix pass (2026-08-18: TOCTOU duplicate→409, shared route guard, Button link variant, Group mode donut, single hex source `CHART_HEX`, dead-code purge) + dark UI overhaul + `/analytics` distribution page (see Section 2 exception) + responsive dual nav (bottom nav `<lg`) + framer-motion transitions + group color identity (`colorForGroup`) + required `ADMIN_SESSION_SECRET` (2026-08-19: missing value = boot failure — replaces the random per-process fallback that split the secret between middleware and API routes and broke login; vitest setup now loads it from `.env.local`). Design source of truth: `DESIGN.md` (+ `.impeccable/design.json`). 37/37 tests green. Typecheck/build clean.**

### Stack

Next.js 14.2 App Router · React 18 · TS 5.5 · Tailwind 3.4 · SQLite (`node:sqlite`, no ORM) · Vitest · Radix (dialog/select/dropdown/tooltip) · cva · lucide-react · framer-motion 13 (page transitions, modal pop, accordion) · bklit pie-chart components (`src/components/charts/`, vendored via shadcn registry — `@visx/*`, `d3-shape`, `motion`, `@number-flow/react`).

### Auth

Single admin. `src/lib/session.ts` (env `ADMIN_USERNAME`/`ADMIN_PASSWORD`, default `admin`/`admin`; **required** `ADMIN_SESSION_SECRET` — a missing value throws `ADMIN_SESSION_SECRET environment variable is required` at module load, i.e. boot failure, not silent cookie invalidation; the secret must be shared by middleware and API routes so they mint/accept the same cookie). Cookie session. `src/middleware.ts` guards all routes except `/login`, `/api/auth/login`, static assets, `icon.svg`.

### File Map — read only what the task needs

| Path | ~Loc | Role |
|---|---|---|
| `src/lib/guests.ts` | 204 | Guest CRUD, duplicate check (app pre-check + DB UNIQUE race → `DuplicateNameError`), CSV export — ALL guest business rules |
| `src/lib/categories.ts` | 80 | Party/Group CRUD, rename, safe-delete guard |
| `src/lib/normalize.ts` | 25 | `normalizeName` (BR-006), `DuplicateNameError(existingId)` |
| `src/lib/db.ts` | 97 | SQLite schema + seed; `guests.name_norm` UNIQUE (DB-enforced dedup) |
| `src/lib/client.ts` | 29 | `apiGet`/`apiSend` → throws `ApiError{existingId}` |
| `src/app/page.tsx` | 609 | Guest dashboard (client): stats, responsive filter toolbar, table (MotionTableRow new-guest flash), modals, BR-007 "Lihat di daftar →", mobile sticky action bar |
| `src/app/categories/page.tsx` | 313 | Category management (client) |
| `src/app/analytics/page.tsx` | 288 | Analytics (client): filter panel (mobile accordion) + donut for both Party and Group modes; read-only, local filter state |
| `src/app/login/page.tsx` | 89 | Login (client) |
| `src/hooks/use-analytics-data.ts` | 81 | `useAnalyticsData({search,partyId,groupId})` → `{isLoading,error,totalGuests,byParty,byGroup}`; reuses `/api/guests` filter semantics; slice colors via `partyHex`/`colorForGroup` |
| `src/hooks/use-is-mobile.ts` | 17 | `useIsMobile()` — <640px match, resize listener, SSR-guard false |
| `src/hooks/use-reduced-motion.ts` | 4 | Re-export of framer-motion `useReducedMotion` (single import site) |
| `src/lib/animation-variants.ts` | 42 | Shared `pageVariants` + `getVariants(reducedMotion)` zeroing + `getRowVariants` (table-row motion) |
| `src/app/api/guests/route.ts` | 77 | GET list/csv · POST · PUT · DELETE (shared `guard()` from `lib/auth`) |
| `src/app/api/categories/route.ts` | 59 | GET · POST · PUT · DELETE (shared `guard()` + `errorResponse`) |
| `src/app/api/auth/login/route.ts` | 24 | POST login · DELETE logout |
| `src/components/ui/` | — | 12 shared components: button input select modal card alert table stat-card empty-state loading dropdown-menu category-badge |
| `src/components/charts/` | — | 14 vendored bklit chart files: PieChart/PieSlice/PieCenter + context/animation helpers; do not hand-edit |
| `components.json` | — | shadcn registry config (aliases only; required for `shadcn add`) |
| `DESIGN.md` | — | Design system source of truth (tokens, typography, elevation, components, rules) |
| `.impeccable/design.json` | — | Machine-readable design sidecar (schemaVersion 2) |
| `src/components/app-shell.tsx` | 150 | App shell: dual nav — 72px icon rail + tooltips + logout (lg+) · mobile bottom nav h-14 (<lg) · `TopBar`; `/login` renders without chrome |
| `src/lib/party-colors.ts` | 175 | Single color source: Party identity (`colorFor(name)`), Group hex identity (`colorForGroup`), `CHART_HEX` + `partyHex` (SVG slice fills), deterministic hash fallbacks |
| `src/lib/api-error.ts` | 22 | `ApiError` class — carries `existingId` for 409 duplicate responses (BR-007) |
| `src/lib/auth.ts` | 27 | Login credential check (timing-safe compare) + shared API-route `guard()` |
| `src/lib/utils.ts` | 6 | `cn()` class merge helper |
| `src/types/node-sqlite.d.ts` | 23 | Ambient declaration for `node:sqlite` |
| `src/app/layout.tsx` | 38 | Root layout — Fraunces/Figtree fonts, dark class, `AppShell` mount |
| `src/app/globals.css` | 85 | Design tokens as CSS variables + base styles |
| tests | — | `guests.test.ts` 14 · `categories.test.ts` 10 · `filter.test.ts` 8 · `auth.test.ts` 5 — colocated in `src/lib/` |

### Key invariants — do not break

- Duplicate identity = normalized name only; DB UNIQUE on `name_norm` + app check.
- 409 duplicate response carries `existingId`; UI surfaces "View in list" (BR-007).
- CSV export reuses `listGuests()` filter semantics — never duplicate filter logic.
- Category delete blocked while `used > 0`.
- UI: consume `src/components/ui/` — zero page-local button/input/modal styling.

### Verify before done

```bash
npm run typecheck; npm test; npm run build
```

UI baseline: `DESIGN.md` (+ `.impeccable/design.json`).

---

## 1. Source of Truth

Primary product specification:

- `PRD-Wedding-Guest-Manager.md`

When requirements conflict, use this precedence:

1. Explicit current user decision.
2. PRD requirements.
3. Existing implementation only when it does not conflict with 1 or 2.
4. Agent assumptions are lowest priority and must not override product requirements.

If implementation details are unspecified, choose the simplest maintainable solution that preserves the PRD behavior.

---

## 2. Product Boundary

### MUST IMPLEMENT

- Single-admin authentication.
- Guest CRUD.
- Guest fields: Name, Address, Party, Group.
- Exactly one Party per guest.
- Exactly one Group per guest.
- Party management from UI.
- Group management from UI.
- Name search.
- Party filter.
- Group filter.
- Combined search/filter.
- Duplicate prevention by normalized Name.
- CSV export for all guests.
- CSV export for filtered guests.
- Validation and destructive-action confirmation.
- Simple distribution analytics page (`/analytics`): guest counts by Party or Group as a donut chart, reusing the guest-list filters (search/party/group) and existing GET APIs. Added by explicit user decision (2026-08-18). This is the ONLY analytics exception — see "advanced analytics" below.

### MUST NOT IMPLEMENT

Unless an explicit product decision is added later, agents must not introduce:

- multi-user contributor accounts;
- guest invitation status;
- RSVP;
- attendance/check-in;
- Pax tracking;
- household management;
- QR codes;
- WhatsApp/email/SMS integrations;
- CSV/Excel import;
- guest relationship/free-text relation field;
- public guest-facing portal;
- advanced analytics (exception: the approved `/analytics` distribution view above — nothing beyond it: no trends, no pax/RSVP charts, no export of analytics);
- notifications;
- payment/budgeting;
- wedding invitation website features.

Do not sneak these into the codebase under another name.

---

## 3. Core Domain Rules

### Guest

A Guest contains only:

- `name`
- `address`
- `party_id`
- `group_id`
- system timestamps/identifier

### Party

Initial expected values:

- Groom
- Bride
- Groom Family
- Bride Family

Party values are UI-manageable.

### Group

Initial suggested values:

- Rekan Kerja
- Sekolah
- Kuliah
- Tetangga
- Saudara
- Teman
- Komunitas
- Lainnya

Group values are UI-manageable.

### Ownership

A Guest belongs to exactly one Party.

Do not model many-to-many ownership for MVP.

### Grouping

A Guest belongs to exactly one Group.

Do not model many-to-many grouping for MVP.

---

## 4. Duplicate Rule: CRITICAL

Duplicate identity is based **only on guest Name**.

Address must NOT be part of the identity key.

Party must NOT be part of the identity key.

Group must NOT be part of the identity key.

Example that MUST be blocked:

```text
Existing:
Budi Santoso / Jl. Mawar / Groom / Rekan Kerja

New:
Budi Santoso / Jl. Melati / Bride / Tetangga
```

The second record is a duplicate and must be rejected.

### Name normalization

Before comparison:

1. trim leading/trailing whitespace;
2. collapse repeated internal whitespace;
3. compare case-insensitively.

Minimum normalization examples:

```text
" Budi Santoso " == "budi santoso"
"Budi  Santoso" == "BUDI SANTOSO"
```

Do not implement fuzzy matching, typo matching, phonetic matching, or similarity scoring unless explicitly requested later.

### Enforcement

Duplicate protection MUST exist at the server/business-logic level and must be backed by database integrity where technically possible.

Client-side validation alone is insufficient.

---

## 5. CRUD Rules

### Create

Required:

- Name
- Address
- Party
- Group

Reject blank values after trimming.

Run duplicate validation before persistence.

### Read

Guest list must support:

- Name search;
- Party filter;
- Group filter;
- combined search/filter;
- reset filters.

### Update

All guest fields are editable.

Changing Name triggers duplicate validation.

A guest may keep its own current normalized Name.

### Delete

Guest deletion requires explicit confirmation.

Do not silently cascade delete Party or Group records.

---

## 6. Party and Group Management

Party and Group are simple managed reference data.

Agents should favor a minimal CRUD UI.

Allowed:

- create;
- rename/edit;
- delete when safe.

Deletion must not orphan guest records.

Acceptable strategies include:

- block deletion while referenced;
- require reassignment before deletion.

Do not silently reassign guests.

Do not build nested categories, drag/drop taxonomy builders, versioning, bulk category workflows, or permission systems.

---

## 7. CSV Export Contract

Two export modes are required:

### Export All

Returns every guest in the system.

### Export Filtered

Returns only the result set represented by the currently active:

- search query;
- Party filter;
- Group filter.

The filtered export must use the same canonical query semantics as the guest list.

CSV columns, in order:

```text
Name,Address,Party,Group
```

Use UTF-8.

Suggested filenames:

```text
wedding-guests-all-YYYY-MM-DD.csv
wedding-guests-filtered-YYYY-MM-DD.csv
```

Do not create a separate export implementation with subtly different filtering rules.

---

## 8. UI/UX Rules

Optimize for manual data entry.

The administrator is expected to enter many guests one by one.

Prioritize:

- visible Add Guest action;
- compact form;
- keyboard-friendly interaction;
- clear validation;
- persistent filters;
- easy reset;
- fast return to guest list after save.

Preferred guest toolbar structure:

```text
[ Search name... ] [ Party ] [ Group ] [ Reset ] [ Export CSV ] [ Add Guest ]
```

Do not create multi-step guest forms.

Do not add unnecessary guest fields.

Do not optimize for public consumer-facing presentation.

---

## 9. Architecture Guidance

The exact stack may be chosen by the repository/project configuration, but agents must follow these principles:

- Keep domain rules server-authoritative.
- Keep guest uniqueness deterministic.
- Keep filtering/export semantics shared rather than duplicated.
- Keep Party and Group reference data simple.
- Avoid premature abstraction.
- Avoid speculative feature modules.
- Prefer boring, maintainable code over framework tricks.

A feature should not create a new abstraction unless the existing structure cannot reasonably support it.

---

## 10. Data Integrity

The implementation must guarantee:

- guest name is non-empty;
- address is non-empty;
- Party reference is valid;
- Group reference is valid;
- duplicate normalized names cannot coexist;
- guest update cannot accidentally create a duplicate;
- category deletion cannot invalidate guests;
- create/update operations are atomic.

If the database supports functional indexes, generated columns, collations, or equivalent mechanisms suitable for normalized uniqueness, prefer a database-backed constraint consistent with the normalization rule.

Do not rely on application checks alone when the database can enforce the invariant.

---

## 11. Testing Requirements

Every implementation of a business rule must include appropriate automated tests.

### Minimum guest tests

- create valid guest;
- reject blank Name;
- reject blank Address;
- reject missing Party;
- reject missing Group;
- reject duplicate Name with exact same casing;
- reject duplicate Name with different casing;
- reject duplicate Name with leading/trailing whitespace differences;
- reject duplicate Name with repeated internal whitespace differences;
- allow same address for different names;
- reject changing a guest to another existing normalized name;
- allow guest to retain its own name;
- delete guest only with explicit application action.

### Filtering tests

- search by Name;
- Party filter;
- Group filter;
- combined search + Party;
- combined search + Group;
- search + Party + Group;
- reset filters.

### Export tests

- export all includes every guest;
- filtered export includes only filtered records;
- CSV columns are correct and ordered;
- CSV values are escaped correctly;
- empty filtered result exports a valid CSV header rather than corrupt output.

### Category tests

- create Party;
- rename Party;
- create Group;
- rename Group;
- prevent unsafe deletion of referenced categories.

---

## 12. Implementation Workflow

Agents should work in this order unless the repository already imposes a stronger structure:

1. Inspect repository structure and existing conventions.
2. Read the PRD fully before changing code.
3. Identify existing auth, database, UI, and test infrastructure.
4. Implement the smallest coherent domain model.
5. Implement database constraints/integrity.
6. Implement server-side CRUD and duplicate rules.
7. Implement guest list/search/filter.
8. Implement Party/Group management.
9. Implement CSV export using canonical query logic.
10. Add and run automated tests.
11. Validate against the acceptance criteria in the PRD.
12. Remove unnecessary code or abstractions introduced during implementation.

Do not begin by building a dashboard or visual polish before the core guest data model and integrity rules are correct.

---

## 13. Change Control

When a user request conflicts with this document, do not silently reinterpret the requirement.

If the requested change affects one of these foundations, stop and surface the product decision clearly:

- Guest identity;
- Party cardinality;
- Group cardinality;
- required Guest fields;
- duplicate definition;
- authentication model;
- import/export scope;
- multi-user scope;
- attendance/invitation scope.

A new feature that expands scope must be treated as an explicit product change, not an implementation detail.

---

## 14. Anti-Overengineering Rules

Do not introduce:

- event sourcing;
- CQRS solely for this app;
- microservices;
- workflow engines;
- complex permission matrices;
- generic dynamic field builders;
- generic taxonomy engines;
- fuzzy-search infrastructure;
- analytics warehouses;
- message queues;
- feature flags for trivial MVP behavior.

Use simple CRUD and clear invariants.

The scale target is a wedding guest list, not a multinational ERP. Build accordingly.

---

## 15. Definition of Done

A guest-management change is not done until:

- PRD behavior is satisfied;
- business rules are enforced server-side;
- relevant database integrity exists;
- automated tests cover the changed behavior;
- UI validation/error states are usable;
- filtering and export remain consistent;
- no out-of-scope feature was introduced;
- code follows repository conventions;
- dead or duplicate implementation is removed.

---

## UI Design Inventory

`DESIGN.md` is the design source of truth (tokens, typography, elevation, components, rules); `.impeccable/design.json` is its machine-readable sidecar.

When modifying UI:
- read `DESIGN.md`;
- preserve verified business behavior;
- treat DESIGN.md as the baseline for visual changes and keep it in sync when the system changes;
- do not expand UI scope without explicit product direction.

---

## 16. Final Agent Principle

The application should remain a **simple, reliable source of truth for wedding guests**.

When faced with two implementation choices, prefer the one that:

1. preserves the explicit product rules;
2. minimizes moving parts;
3. is easy for another engineer to understand;
4. is easy to test;
5. does not create future scope accidentally.
