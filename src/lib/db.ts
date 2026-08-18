import { createRequire } from "node:module";
import path from "node:path";
import fs from "node:fs";
import type { DatabaseSync } from "node:sqlite";

const require = createRequire(__filename);
const DatabaseSyncCtor = (
  require("node:sqlite") as typeof import("node:sqlite")
).DatabaseSync;

const DB_PATH =
  process.env.GUEST_DB_PATH ||
  path.join(process.cwd(), ".data", "guest-manager.db");

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

let _db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (_db) return _db;
  const db = new DatabaseSyncCtor(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  migrate(db);
  seed(db);
  _db = db;
  return db;
}

export function resetDb(): void {
  const db = getDb();
  db.exec(
    "DELETE FROM guests; DELETE FROM parties; DELETE FROM groups;"
  );
  seed(db);
}

// ponytail: node:sqlite (built-in, no native build) chosen because no Postgres
// server and no C++ toolchain are available here. Swap getDb()+migrate() for a
// pg client to move to PostgreSQL; the normalized-name UNIQUE index maps
// directly to a Postgres generated column + unique index.
function migrate(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS parties (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS guests (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      name_norm TEXT NOT NULL,
      address TEXT NOT NULL,
      party_id TEXT NOT NULL REFERENCES parties(id) ON DELETE RESTRICT,
      group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE RESTRICT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (name_norm)
    );
  `);
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

export function cryptoId(): string {
  const { randomUUID } = require("node:crypto");
  return randomUUID();
}

function seed(db: DatabaseSync) {
  const now = new Date().toISOString();
  const pCount = (
    db.prepare("SELECT COUNT(*) AS c FROM parties").get() as { c: number }
  ).c;
  if (pCount === 0) {
    const ins = db.prepare(
      "INSERT INTO parties (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)"
    );
    for (const name of INITIAL_PARTIES) ins.run(cryptoId(), name, now, now);
  }
  const gCount = (
    db.prepare("SELECT COUNT(*) AS c FROM groups").get() as { c: number }
  ).c;
  if (gCount === 0) {
    const ins = db.prepare(
      "INSERT INTO groups (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)"
    );
    for (const name of INITIAL_GROUPS) ins.run(cryptoId(), name, now, now);
  }
}
