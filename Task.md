# Task.md

Standar eksekusi task: spesifik, bersih, tidak ada perubahan di luar scope. Selesai task → jalankan `npm run typecheck` + `npm test` (wajib green) sebelum update status di file ini.

---

## Task 1 — Statistik Pengganti Donut (Horizontal Bar)

**Tujuan:** Ganti visualisasi donut di `/analytics` dengan horizontal bar chart.

**Keputusan produk (user, 2026-08-19):**
- Visualisasi: horizontal bar per kategori (party/group), count + persentase.
- Data TIDAK berubah: count entries per party/group (bukan pax-weighted), mode toggle Per Pihak/Per Grup, filter search/party/group tetap.
- Read-only, tanpa export, tanpa analytics baru lain (boundary AGENTS.md tetap berlaku).

**Langkah:**
1. Komponen bar horizontal di `src/components/` (konsumsi primitif `src/components/ui/`, warna via `colorFor`/`colorForGroup` dari `party-colors.ts` — jangan inline hex).
2. Ganti `PieChart`/`PieSlice`/`PieCenter` di `analytics-view.tsx` dengan bar chart (dynamic import tetap).
3. Hapus dependency berat yang jadi tak terpakai dari graph analytics (visx/d3/number-flow) — verifikasi bundle.
4. Layout: label kategori + bar proporsional (count/total) + angka count; a11y (sr-only table tetap / role list).
5. Jangan hand-edit file vendored `src/components/charts/`; file pie yang tak lagi terpakai biarkan (vendored, do-not-touch) — pastikan saja tidak ter-import.

**Batasan:**
- Dark theme only; satu gold primary action per view tetap.
- `npm run typecheck` + `npm test` + `npm run build` green.

**Selesai:** `/analytics` menampilkan horizontal bar; donut hilang; bundle analytics turun.

---

## Status Log

| Task | Status | Catatan |
|---|---|---|
| QA/Cleanup (lama) | done | repo bersih, zero diff fungsional |
| Lighthouse (lama) | done | login 91/100/100; root & analytics target tercapai setelah fix (font preload, ssr seragam); user handle final measurement |
| Struktur folder (lama) | done | audit clean, zero perubahan |
| 1 — Statistik bar | done | `analytics-bar-chart.tsx` (horizontal bar, colorFor mode-aware, CSS entrance, sr-only table); visx/d3/number-flow keluar dari bundle; typecheck + 42/42 tests + build green |
| Deploy Phase 3 — SQLite→Postgres | done | postgres.js (prepare:false, max:1); `db.ts`/`guests.ts`/`categories.ts` async; SSR pages + API routes await; vitest per-worker schema `test_w<N>` via search_path; node-sqlite.d.ts dihapus; typecheck + 42/42 tests (vs Supabase) + build green |
| Fix SSR deadlock | done | `Promise.all` list queries + pool `max:1` = deadlock 240–300s; fix: sequential awaits di 3 SSR page (`(app)/page.tsx`, categories, analytics) + `postgres` di `serverComponentsExternalPackages`; prod smoke 200 semua page <1.4s; commit `ea0eeb0` |
| Deploy Vercel live | done | Root cause situs rusak: build lama (SQLite pra-port) karena project Vercel tidak connect GitHub (env import saja). Setelah connect repo + push, live hijau: login/API/SSR/CSV 200 |
| Migrasi data SQLite → Supabase | done | 21 tamu + 4 party + 6 group dipindah (map kategori by name, idempotent by id); diverifikasi live: API 21 guests, party counts benar, CSV 22 baris |
| Cleanup repo | done | log/supabase `.temp`/QA artifacts keluar dari tracking + `.gitignore`; commit `4375d08` |
| Fix login stuck (Edge + cookie) | done | `session.ts` no module-load throw (empty-secret fallback, fail-closed `validSession`); cookie `secure:true` + `maxAge` 7d; matcher exclude `/api/auth/*`; commit `47369c0` |
| Fix login stuck (SPA nav race) | done | login success → `window.location.href` full load (bukan `router.push`+`refresh` — race cookie commit vs middleware); typecheck/build green; commit `564072a`; e2e live terverifikasi: login 200, cookie Secure/Max-Age 604800, SSR 200, API 21 guests, CSV 22 baris |
| Perk listWithUsed | done | N+1 refCount → single LEFT JOIN + GROUP BY (15→3 query/page); commit `724e89c` |
| Arsitektur A — Guest filter seam | done | `src/lib/guest-filter.ts` (pure, client+server safe): `GuestFilter` + `filterParams`/`parseFilter`; 4 call site hand-rolled query-builder (guests-view loadGuests & buildCsvUrl, use-analytics-data, api route toFilter) collapse ke satu seam; `guests.ts` re-export type; 7 test baru (encode/decode/roundtrip); CONTEXT.md dibuat (domain glossary); typecheck + 49/49 + build green; commit `fc39c25` |
| Arsitektur B — Guest-list data module | done | `src/hooks/use-guest-list.ts`: debounce 300ms + filterParams + fetch + skip-initial + `refresh()` + race guard diekstrak pure (`createRequestGate`) + 4 test interleaving stale-resolve (A issue → B issue → A resolve belakangan → ditolak); guests-view & useAnalyticsData konsumsi hook yang sama (2 adapter = seam real); `use-analytics-data` jadi derive-only (useMemo aggregate, −40 baris state fetch); BR-007 decision core jadi pure fn `rowReveal()` di `src/lib/duplicate-jump.ts` + 6 test — sekaligus fix 2 latent bug: (1) stale-overwrite race di loadGuests lama (tanpa guard), (2) highlight ter-clear saat guests stale + **zombie state** `highlightId` kalau target dihapus tab lain mid-jump — kini bounded: lookup click-time skip highlight + grace timer 500ms clear saat missing permanen; typecheck + 59/59 + build green; commit `3ec7cc2`; smoke test manual live: race + BR-007 jump sesuai |
| Arsitektur C — Error payload contract | done | `errorPayload(e) → {status, body}` pure di `normalize.ts` = single source wire contract (409+existingId / 404 / 400+field / 500); `api-error.ts` jadi thin NextResponse wrapper; `ApiError.existingId` typed via `DuplicateNamePayload`; 6 test baru (4 mapping + 2 client unwrap via stubbed fetch); zero behavior change — status/body/field identik; rename field kini compile error, bukan silent break BR-007; typecheck + 65/65 + build green; commit `ddd9446` |
| Arsitektur D — Category table fragment | done | 8× `table === "parties" ? … : …` di `categories.ts` collapse ke `tableOf(table)` sql-fragment (postgres 3.4.9 — fragment identifier API diverifikasi via probe script dulu); `listWithUsed` jadi satu query JOIN parametrik (join key via fragment); interface `parties`/`groups` tak berubah; 65/65 tetap hijau (10 test categories sebagai safety net); typecheck + build green; commit `3ed87d5` |
| Arsitektur E — Distribution shape | done | `DistributionDatum {label, value, color}` dimiliki `use-analytics-data` (bukan pinjam `PieData` dari pie-chart vendored yang sudah mati); `hexFor(kind, name)` satu interface hex untuk party+group (ganti asimetri `partyHex` vs `colorForGroup().dot`); `AnalyticsBarChart` menerima color di datum, bukan resolve sendiri; zero import live dari `src/components/charts/` di luar vendored dir; typecheck + 65/65 + build green |
