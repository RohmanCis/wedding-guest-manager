import { getDb, sql, cryptoId } from "./db";
import { NotFoundError, ValidationError } from "./normalize";

export interface CategoryRow {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

type Table = "parties" | "groups";

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

async function listWithUsed(table: Table) {
  await getDb();
  const rows =
    table === "parties"
      ? await sql<(CategoryRow & { used: number })[]>`
          SELECT p.id, p.name, p.created_at, p.updated_at,
                 COUNT(g.id)::int AS used
          FROM parties p
          LEFT JOIN guests g ON g.party_id = p.id
          GROUP BY p.id
          ORDER BY p.name ASC`
      : await sql<(CategoryRow & { used: number })[]>`
          SELECT gr.id, gr.name, gr.created_at, gr.updated_at,
                 COUNT(g.id)::int AS used
          FROM groups gr
          LEFT JOIN guests g ON g.group_id = gr.id
          GROUP BY gr.id
          ORDER BY gr.name ASC`;
  return rows.map((r) => ({ ...r }));
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
