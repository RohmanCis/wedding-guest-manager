import { getDb, cryptoId } from "./db";
import { NotFoundError, ValidationError } from "./normalize";

export interface CategoryRow {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

function list(table: string): CategoryRow[] {
  return getDb()
    .prepare(`SELECT * FROM ${table} ORDER BY name COLLATE NOCASE ASC`)
    .all() as CategoryRow[];
}

function create(table: string, name: string): CategoryRow {
  const trimmed = (name || "").trim();
  if (!trimmed) throw new ValidationError("name", "Name is required.");
  const db = getDb();
  const dup = db.prepare(`SELECT id FROM ${table} WHERE name = ?`).get(trimmed);
  if (dup) throw new ValidationError("name", "Name already exists.");
  const id = cryptoId();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO ${table} (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)`
  ).run(id, trimmed, now, now);
  return db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id) as CategoryRow;
}

function rename(table: string, id: string, name: string): CategoryRow {
  const trimmed = (name || "").trim();
  if (!trimmed) throw new ValidationError("name", "Name is required.");
  const db = getDb();
  const row = db.prepare(`SELECT id FROM ${table} WHERE id = ?`).get(id);
  if (!row) throw new NotFoundError("Category not found.");
  const dup = db
    .prepare(`SELECT id FROM ${table} WHERE name = ? AND id != ?`)
    .get(trimmed, id);
  if (dup) throw new ValidationError("name", "Name already exists.");
  const now = new Date().toISOString();
  db.prepare(`UPDATE ${table} SET name = ?, updated_at = ? WHERE id = ?`).run(
    trimmed,
    now,
    id
  );
  return db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id) as CategoryRow;
}

function remove(table: string, id: string): void {
  const db = getDb();
  const row = db.prepare(`SELECT id FROM ${table} WHERE id = ?`).get(id);
  if (!row) throw new NotFoundError("Category not found.");
  // ON DELETE RESTRICT makes this fail if referenced; explicit message:
  try {
    db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
  } catch (e: any) {
    if (String(e.message).includes("FOREIGN KEY")) {
      throw new ValidationError(
        "id",
        "Cannot delete: category is still used by guests. Reassign guests first."
      );
    }
    throw e;
  }
}

function refCount(table: string, id: string): number {
  const col = table === "parties" ? "party_id" : "group_id";
  const r = getDb()
    .prepare(`SELECT COUNT(*) AS c FROM guests WHERE ${col} = ?`)
    .get(id) as { c: number };
  return r.c;
}

export const parties = {
  list: () => list("parties").map((p) => ({ ...p, used: refCount("parties", p.id) })),
  create: (name: string) => create("parties", name),
  rename: (id: string, name: string) => rename("parties", id, name),
  remove: (id: string) => remove("parties", id)
};

export const groups = {
  list: () => list("groups").map((g) => ({ ...g, used: refCount("groups", g.id) })),
  create: (name: string) => create("groups", name),
  rename: (id: string, name: string) => rename("groups", id, name),
  remove: (id: string) => remove("groups", id)
};
