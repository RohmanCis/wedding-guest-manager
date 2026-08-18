import { getDb, sql, cryptoId } from "./db";
import { NotFoundError, ValidationError } from "./normalize";

export interface CategoryRow {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

type Table = "parties" | "groups";

async function list(table: Table): Promise<CategoryRow[]> {
  await getDb();
  const rows =
    table === "parties"
      ? await sql<CategoryRow[]>`SELECT * FROM parties ORDER BY name ASC`
      : await sql<CategoryRow[]>`SELECT * FROM groups ORDER BY name ASC`;
  return rows.map((r) => ({ ...r }));
}

async function create(table: Table, name: string): Promise<CategoryRow> {
  const trimmed = (name || "").trim();
  if (!trimmed) throw new ValidationError("name", "Name is required.");
  await getDb();
  const dup =
    table === "parties"
      ? await sql`SELECT id FROM parties WHERE name = ${trimmed}`
      : await sql`SELECT id FROM groups WHERE name = ${trimmed}`;
  if (dup.length) throw new ValidationError("name", "Name already exists.");
  const id = cryptoId();
  const now = new Date().toISOString();
  if (table === "parties") {
    await sql`INSERT INTO parties (id, name, created_at, updated_at)
      VALUES (${id}, ${trimmed}, ${now}, ${now})`;
  } else {
    await sql`INSERT INTO groups (id, name, created_at, updated_at)
      VALUES (${id}, ${trimmed}, ${now}, ${now})`;
  }
  return getById(table, id);
}

async function getById(table: Table, id: string): Promise<CategoryRow> {
  const rows =
    table === "parties"
      ? await sql<CategoryRow[]>`SELECT * FROM parties WHERE id = ${id}`
      : await sql<CategoryRow[]>`SELECT * FROM groups WHERE id = ${id}`;
  if (!rows.length) throw new NotFoundError("Category not found.");
  return { ...rows[0] };
}

async function rename(
  table: Table,
  id: string,
  name: string
): Promise<CategoryRow> {
  const trimmed = (name || "").trim();
  if (!trimmed) throw new ValidationError("name", "Name is required.");
  await getDb();
  const row =
    table === "parties"
      ? await sql`SELECT id FROM parties WHERE id = ${id}`
      : await sql`SELECT id FROM groups WHERE id = ${id}`;
  if (!row.length) throw new NotFoundError("Category not found.");
  const dup =
    table === "parties"
      ? await sql`SELECT id FROM parties WHERE name = ${trimmed} AND id != ${id}`
      : await sql`SELECT id FROM groups WHERE name = ${trimmed} AND id != ${id}`;
  if (dup.length) throw new ValidationError("name", "Name already exists.");
  const now = new Date().toISOString();
  if (table === "parties") {
    await sql`UPDATE parties SET name = ${trimmed}, updated_at = ${now} WHERE id = ${id}`;
  } else {
    await sql`UPDATE groups SET name = ${trimmed}, updated_at = ${now} WHERE id = ${id}`;
  }
  return getById(table, id);
}

async function remove(table: Table, id: string): Promise<void> {
  await getDb();
  const row =
    table === "parties"
      ? await sql`SELECT id FROM parties WHERE id = ${id}`
      : await sql`SELECT id FROM groups WHERE id = ${id}`;
  if (!row.length) throw new NotFoundError("Category not found.");
  // ON DELETE RESTRICT makes this fail if referenced; explicit message:
  try {
    if (table === "parties") {
      await sql`DELETE FROM parties WHERE id = ${id}`;
    } else {
      await sql`DELETE FROM groups WHERE id = ${id}`;
    }
  } catch (e) {
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code?: string }).code === "23503"
    ) {
      throw new ValidationError(
        "id",
        "Cannot delete: category is still used by guests. Reassign guests first."
      );
    }
    throw e;
  }
}

async function refCount(table: Table, id: string): Promise<number> {
  const col = table === "parties" ? sql`party_id` : sql`group_id`;
  const rows = await sql<{ count: number }[]>`
    SELECT COUNT(*)::int AS count FROM guests WHERE ${col} = ${id}`;
  return rows[0].count;
}

async function listWithUsed(table: Table) {
  const rows = await list(table);
  return Promise.all(
    rows.map(async (r) => ({ ...r, used: await refCount(table, r.id) }))
  );
}

export const parties = {
  list: () => listWithUsed("parties"),
  create: (name: string) => create("parties", name),
  rename: (id: string, name: string) => rename("parties", id, name),
  remove: (id: string) => remove("parties", id)
};

export const groups = {
  list: () => listWithUsed("groups"),
  create: (name: string) => create("groups", name),
  rename: (id: string, name: string) => rename("groups", id, name),
  remove: (id: string) => remove("groups", id)
};
