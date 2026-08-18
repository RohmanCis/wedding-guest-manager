import { randomUUID } from "node:crypto";
import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is required (Postgres, e.g. Supabase pooler). See DEPLOYMENT.md."
  );
}

// prepare:false + max:1 — required behind Supabase's PgBouncer transaction
// pooler and correct for Vercel serverless instances.
export const sql = postgres(DATABASE_URL, { prepare: false, max: 1 });

export async function getDb(): Promise<typeof sql> {
  await init;
  return sql;
}

export async function resetDb(): Promise<void> {
  await getDb();
  await sql`DELETE FROM guests`;
  await sql`DELETE FROM parties`;
  await sql`DELETE FROM groups`;
  await seed();
}

export function cryptoId(): string {
  return randomUUID();
}

const init = (async () => {
  await migrate();
  await seed();
})();

async function migrate() {
  await sql`
    CREATE TABLE IF NOT EXISTS parties (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS guests (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      name_norm TEXT NOT NULL,
      address TEXT NOT NULL,
      party_id TEXT NOT NULL REFERENCES parties(id) ON DELETE RESTRICT,
      group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE RESTRICT,
      pax INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (name_norm)
    )`;
}

const INITIAL_PARTIES = ["Groom", "Bride", "Groom Family", "Bride Family"];
const INITIAL_GROUPS = [
  "Rekan Kerja",
  "Sekolah",
  "Kuliah",
  "Tetangga",
  "Saudara",
  "Teman",
  "Komunitas",
  "Lainnya"
];

async function seed() {
  const [{ count: pCount }] = await sql`SELECT COUNT(*)::int AS count FROM parties`;
  if (pCount === 0) {
    const now = new Date().toISOString();
    for (const name of INITIAL_PARTIES) {
      await sql`INSERT INTO parties (id, name, created_at, updated_at)
        VALUES (${cryptoId()}, ${name}, ${now}, ${now})`;
    }
  }
  const [{ count: gCount }] = await sql`SELECT COUNT(*)::int AS count FROM groups`;
  if (gCount === 0) {
    const now = new Date().toISOString();
    for (const name of INITIAL_GROUPS) {
      await sql`INSERT INTO groups (id, name, created_at, updated_at)
        VALUES (${cryptoId()}, ${name}, ${now}, ${now})`;
    }
  }
}
