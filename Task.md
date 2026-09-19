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

## Task 2 — Sort Tabel Tamu (kolom Nama/Jumlah/Party/Group)

**Tujuan:** Klik judul kolom untuk mengurutkan tabel tamu; klik lagi membalik arah. Default `name asc` — identik dengan `ORDER BY g.name ASC` server saat ini, tampilan awal tidak berubah.

**Keputusan produk (user, 2026-09-19):**
- Sort kolom: `Nama`, `Jumlah (pax)`, `Party`, `Group`. `No.` dan `Alamat` tidak di-sort.
- Sort by Party & Group eksplisit diminta (fitur inti task ini).
- **Grouped/sectioned view (header seksi collapsible) DITUNDA — bukan scope.** Hasil crosscheck 3 agent (explorer/data, oracle/arsitektur, designer/UX, 2026-09-19): rusak `guests.slice` pagination (seksi terpotong antar halaman), rusak `rowReveal` index math (BR-007 tested behavior — invariant load-bearing), ±150 LOC refactor. Manfaat visual ~80% sudah didapat gratis dari color-run badge saat sort. Bangun hanya jika tamu > ~500 atau permintaan eksplisit.
- Arsitektur: **hybrid** — sort UI client-side (instant, tanpa refetch, array full sudah ada di `guests`), CSV export sort-aware (export ikut urutan layar) via param `sort`/`dir` di seam `guest-filter`.

**Rancangan (terverifikasi crosscheck vs kode, 2026-09-19):**
1. **`src/lib/guest-sort.ts` (baru)** — pure, ikut pola `guest-filter.ts`:
   - `SortKey = "name" | "pax" | "party_name" | "group_name"`, `SortState { key, dir }`, `sortGuests(rows, sort)`.
   - `pax` compare NUMERIC (`a.pax - b.pax`, bukan string — "10" vs "2"); string via `localeCompare(..., "id")`.
   - Tiebreak sekunder `name` (deterministik, aman untuk `rowReveal`).
   - Test file `guest-sort.test.ts` colocated: pax numeric, tie stability, empty array, arah desc, locale.
2. **`src/app/(app)/guests-view.tsx`:**
   - State `const [sort, setSort] = useState<SortState>({ key: "name", dir: "asc" })` + `toggleSort(k)`: key sama → flip dir; key baru → asc.
   - `const sorted = useMemo(() => sortGuests(guests, sort), [guests, sort])`.
   - **TRAP — feed `sorted` (bukan `guests`) ke SEMUA konsumen index-based:** `pageGuests` slice (sort SEBELUM slice), kedua efek `rowReveal` (highlight duplikat + flash guest baru), penomoran `No.`, teks hitung "Menampilkan X–Y".
   - Tambah `sort` ke deps efek reset-pagination (ganti sort → kembali halaman 1, konsisten dengan perubahan filter).
   - Header jadi tombol full-cell dalam `TableHead`: `aria-sort` ascending/ddescending, ikon `ChevronsUpDown` idle (desktop: muncul saat hover/focus; mobile: SELALU terlihat low-opacity — tidak ada hover di touch), panah aktif warna accent. Hit area ≥44px (padding trick `-m-2 p-2`). Kolom Party/Group tanpa width class — pastikan ikon tidak menggeser lebar kolom.
   - Polish opsional (5 baris `cn()` di row map): garis pemisah atas saat nilai kolom sort berubah (border-t) — menangkal tabrakan warna fallback antar kategori custom.
3. **CSV konsisten (jalur oracle, bentuk minimal):**
   - `guest-filter.ts`: extend `GuestFilter` dengan `sort`/`dir` opsional; `filterParams` set jika ada; `parseFilter` whitelist validasi (`SORT_KEYS` enum — trust boundary, jangan pernah interpolate mentah ke SQL).
   - `guests.ts` `listGuests`: map `SORT_COLUMNS: Record<SortKey, string>` (`name→g.name`, `pax→g.pax`, `party_name→p.name`, `group_name→gr.name`) — hanya identifier hasil map yang masuk `ORDER BY` (postgres.js tidak bisa parameterize identifier), tiebreak `, g.name ASC`.
   - `use-guest-list.ts`: terima `sort`/`dir`, masukkan ke `filterParams` + deps `refresh`.
   - `buildCsvUrl("filtered")` spread `sort`/`dir` → export ikut urutan layar. `exportGuestsCsv` otomatis warisan via `listGuests`.
   - Catatan staleness (LOW, terima tanpa mitigasi): rename kategori di halaman lain → nama lama di list ter-mount sampai refresh berikut; sembuh sendiri. Jangan bangun polling.
4. **Tidak disentuh:** `route.ts`, `db.ts`, `categories.ts`, primitif `ui/`, pagination hook.

**Langkah:**
1. `guest-sort.ts` + test → `npm test` hijau dulu (pure, tanpa UI).
2. Wire `guests-view.tsx` (state + memo + header UI + efek) → verifikasi manual: sort + filter + pagination + jump duplikat (BR-007) + flash guest baru + `Tampilkan Semua`.
3. Wire jalur CSV (`guest-filter` + `guests.ts` + `use-guest-list`) → verifikasi export filtered mengikuti sort.
4. `npm run typecheck` + `npm test` + `npm run build` semua hijau.
5. Update Status Log baris ini.

**Batasan:**
- Dark theme only; primitif `src/components/ui/` only; warna via `party-colors.ts` (tidak ada hex inline).
- Jangan refactor `rowReveal`/`duplicate-jump.ts` — cukup beri array ter-sort.
- Jangan ubah jumlah SSR await (pool `max:1` — sequential).
- Multi-column sort = YAGNI. URL-sync sort = YAGNI.
- 65 test lama tetap hijau + test baru sort.

**Selesai:** Header 4 kolom klik-urut, arah toggle, default name asc (zero visual diff awal), BR-007 jump tetap benar saat sort aktif, CSV filtered mengikuti sort, semua command green.

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
| 2 — Sort tabel tamu | done | `guest-sort.ts` pure (pax numeric, `localeCompare "id"`, tiebreak name asc deterministik, 10 test); header 4 kolom klik-urut (`SortHeader`: aria-sort di `<th>`, ChevronsUpDown idle hover/focus desktop + selalu low-opacity <lg, panah aktif accent, hit ≥44px `-m-3 p-3 min-h-11`, ikon space reserved agar lebar kolom stabil); SEMUA konsumen index (`pageGuests` slice, kedua efek `rowReveal` BR-007/flash, penomoran No.) kini baca `sorted` (useMemo) — default `{name,asc}` zero visual diff vs SSR; `sort` masuk deps efek reset-pagination; polish separator `border-t` saat nilai kolom party/group berubah; CSV: `GuestFilter` +`sort`/`dir` (parseFilter whitelist `SORT_KEYS` — trust boundary), `listGuests` ORDER BY via `SORT_COLUMNS` map — hanya identifier ter-map masuk SQL (`sql(col)` quoted fragment + `sql.unsafe(dir)` keyword; bug awal `sql("g.name ASC")` = identifier ter-quote → "column does not exist", fixed), `buildCsvUrl("filtered")` bawa sort/dir, scope "all" tetap default; `use-guest-list` terima sort/dir opsional (guests-view TIDAK memakainya — sort murni client-side: 0 refetch saat klik sort, terverifikasi via network log); verifikasi manual 2 fase: prod 311 tamu read-only (default order identik, sort×filter, pagination reset, showAll 311 baris + numbering + 4 separator group, CSV filtered 279 baris pax desc non-increasing + tie name asc, BR-007 duplicate jump dengan sort aktif — page-branch ke halaman 22 + highlight + grace timer, zero mutation) + schema terisolasi (flash guest baru pax-4 di posisi 1 saat sort pax desc, animate-row-flash tertangkap timeline); typecheck + 82/82 (65 lama + 17 baru: 10 sort + 3 filter + 4 ORDER BY) + build green |
