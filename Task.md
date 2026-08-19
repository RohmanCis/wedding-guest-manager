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
