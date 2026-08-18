# Deployment Plan — GitHub + Supabase + Vercel

Goal: use Wedding Guest Manager on your phone, anywhere, with the data safely in the cloud.

## The Architecture (read this first)

```text
┌───────────────┐        ┌──────────────────────┐        ┌──────────────────┐
│  Your phone   │  HTTPS │   Vercel (free)      │  TCP   │  Supabase (free) │
│  browser/PWA  │ ─────► │   runs the Next.js   │ ─────► │   hosted         │
│               │        │   app + login        │        │   PostgreSQL DB  │
└───────────────┘        └──────────────────────┘        └──────────────────┘
```

**Important:** Supabase does **not** host Next.js websites. Supabase is used only as the
cloud database (PostgreSQL). The app itself runs on Vercel — the company behind Next.js,
free tier, zero config. This is the standard pairing and the simplest setup that works.

One code change is required first: the app currently stores data in a **local SQLite file**
(`.data/guest-manager.db`). In the cloud it must use PostgreSQL. Phase 3 below is that port —
it was planned for since day one (see the `ponytail:` note in `src/lib/db.ts`).

| Phase | What | Time | Cost |
|---|---|---|---|
| 0 | Create accounts | 10 min | free |
| 1 | Push code to GitHub | 10 min | free |
| 2 | Create Supabase project | 10 min | free |
| 3 | Port DB layer SQLite → Postgres | 1–2 hrs (agent can do it) | free |
| 4 | Deploy to Vercel | 10 min | free |
| 5 | Open on phone + Add to Home Screen | 5 min | free |
| 6 | Daily use & maintenance | — | free |

---

## Phase 0 — Accounts (one-time)

Create these three free accounts (sign in with GitHub where offered):

1. **GitHub** — https://github.com/signup (code storage + auto-deploy trigger)
2. **Supabase** — https://supabase.com (database) — sign in with GitHub
3. **Vercel** — https://vercel.com/signup (hosting) — sign in with GitHub

Free tiers are more than enough for a wedding guest list (low thousands of rows).

---

## Phase 1 — Put the project on GitHub

### 1.1 Create `.gitignore` in the project root

Create file `D:\2026\guest_management\.gitignore`:

```gitignore
node_modules/
.next/
.data/
*.db
*.db-wal
*.db-shm
.env
.env.*
!.env.example
```

(`.data/` is your local test database — never upload it. `.env` holds secrets — never upload it.)

### 1.2 Initialize git and commit

PowerShell, in `D:\2026\guest_management`:

```powershell
git init
git add .
git commit -m "Wedding Guest Manager MVP"
```

### 1.3 Create the GitHub repo and push

1. https://github.com/new → Repository name: `wedding-guest-manager` → **Private** → Create.
   (Do NOT tick "Add a README" — you already have files.)
2. Copy the push commands GitHub shows you, or run:

```powershell
git remote add origin https://github.com/<your-username>/wedding-guest-manager.git
git branch -M main
git push -u origin main
```

Done. From now on, every `git push` updates GitHub.

---

## Phase 2 — Create the Supabase project (database)

1. https://supabase.com/dashboard → **New project**.
2. Name: `wedding-guest-manager`. Choose the region closest to you (e.g. Singapore).
   Set a database password — save it in a password manager.
3. Wait ~2 min for provisioning.
4. **Connect → Connection string → URI** tab → choose **Transaction pooler** (port `6543`,
   works best with Vercel serverless) → copy the URI. It looks like:

```text
postgresql://postgres.abcdefgh:<PASSWORD>@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

Replace `<PASSWORD>` with your database password. Keep this string — it becomes
`DATABASE_URL` in Phase 4.

No tables are created manually — the app creates and seeds its own tables on first
start (same as it does locally today).

---

## Phase 3 — Port the DB layer from SQLite to Postgres

This is the only real coding step. Scope is deliberately small — 4 files + config:

| File | Change |
|---|---|
| `package.json` | add dependency `postgres` (postgres.js driver, no native build) |
| `src/lib/db.ts` | replace `node:sqlite` with a `postgres(url)` pool; `migrate()` + `seed()` keep the same DDL (`CREATE TABLE IF NOT EXISTS ...`, `UNIQUE (name_norm)`) — Postgres-compatible as-is |
| `src/lib/guests.ts` | queries become `async`, placeholders `?` → `$1, $2, ...` |
| `src/lib/categories.ts` | same treatment |
| `next.config.mjs` | remove the `node:sqlite` entry |

What does **not** change:

- Business rules, duplicate detection, CSV export, filters — all logic above the DB layer is untouched.
- Schema shape is identical (TEXT ids, ISO timestamps, `name_norm UNIQUE`) — the DB-enforced
  duplicate rule carries over 1:1.
- Tests keep covering the same behavior; they run against a Postgres URL from env (`DATABASE_URL`).

Connection notes for the implementer (whoever/whatever does the port):

- Use the **transaction pooler** URI (port 6543) and `postgres(url, { prepare: false })` —
  required behind Supabase's PgBouncer.
- Run the pool with `max: 1` per serverless instance (Vercel functions share nothing).

**Tell your coding agent:** *"Port src/lib/db.ts, guests.ts, categories.ts from node:sqlite to
postgres.js per DEPLOYMENT.md Phase 3, then run typecheck + tests + build."* It is a bounded,
well-understood change (~1–2 hours).

Existing local data: if you have real guests already entered, export CSV from the app
(Export CSV → Semua tamu) **before** the port. Importing them into the cloud is a small one-off
script done after Phase 4 only if you actually need it. Test data → just start fresh (the app
seeds default Parties/Groups automatically).

---

## Phase 4 — Deploy to Vercel

1. https://vercel.com/new → **Import** `wedding-guest-manager` (it sees your GitHub repos).
2. Framework preset: auto-detected (Next.js). Leave everything default.
3. Open **Environment Variables** and add:

| Name | Value | Environments |
|---|---|---|
| `DATABASE_URL` | the Supabase pooler URI from Phase 2 | Production, Preview, Development |
| `ADMIN_USERNAME` | your login username (e.g. `admin`) | Production, Preview, Development |
| `ADMIN_PASSWORD` | a strong password (NOT `admin`) | Production, Preview, Development |

4. **Deploy** → wait ~1 min → you get `https://wedding-guest-manager.vercel.app`.
5. Open it. Log in. The tables are created and seeded on first request.

Every future `git push` to `main` redeploys automatically.

---

## Phase 5 — Use it on your phone

The UI is already mobile-first (bottom nav, sticky action bar, touch targets).

1. Open `https://wedding-guest-manager.vercel.app` on the phone browser.
2. Log in once.
3. Add to Home Screen:
   - **iPhone (Safari):** Share button → *Add to Home Screen*.
   - **Android (Chrome):** ⋮ menu → *Add to Home screen* → Install.
4. It now opens like an app from your home screen. Bookmark/login stays until the cookie expires.

Optional hardening later: change the login password by updating `ADMIN_PASSWORD` on Vercel
(Project → Settings → Environment Variables → Redeploy). Old sessions stop working automatically.

---

## Phase 6 — Daily use & maintenance

| Task | How |
|---|---|
| Enter guests | Phone → app → Tambah Tamu. Data lives in Supabase, safe per-device-loss. |
| Update the app | Any coding agent edits code → `git push` → Vercel deploys in ~1 min. |
| Backup data | Supabase dashboard → your project → Database → Backups. Plus anytime CSV export from the app itself. |
| See the raw data | Supabase dashboard → Table Editor → `guests` table. |
| Pause costs | Free tier projects pause after ~1 week of inactivity — open the app once to wake it (or the dashboard). |

## Troubleshooting

| Symptom | Fix |
|---|---|
| Deploy ok but login fails / 500 | Check all 3 env vars on Vercel; redeploy after changing them. |
| "too many connections" | You are not using the pooler URI (port 6543) — re-copy from Phase 2. |
| Supabase project paused | Free-tier auto-pause; restore from the Supabase dashboard. Data is kept. |
| Changed admin password, still logged in on old phone | Old cookie is invalid after password change — just log in again. |

## Cost summary

GitHub free · Supabase free tier (500 MB DB — a guest list uses a few MB) · Vercel free tier
(hobby). Total: **$0**.
