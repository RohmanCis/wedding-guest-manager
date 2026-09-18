import { getDb, sql, cryptoId } from "./db";
import { NotFoundError, ValidationError } from "./normalize";

export interface CategoryRow {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

type Table = "parties" | "groups";

/** sql fragment carrying the table identifier — safe interpolation, one place. */
function tableOf(table: Table) {
  return sql`${sql(table)}`;
}

async function create(table: Table, name: string): Promise<CategoryRow> {
  const trimmed = (name || "").trim();
  if (!trimmed) throw new ValidationError("name", "Name is required.");
  await getDb();
  const t = tableOf(table);
  const dup = await sql`SELECT id FROM ${t} WHERE name = ${trimmed}`;
  if (dup.length) throw new ValidationError("name", "Name already exists.");
  const id = cryptoId();
  const now = new Date().toISOString();
  await sql`INSERT INTO ${t} (id, name, created_at, updated_at)
    VALUES (${id}, ${trimmed}, ${now}, ${now})`;
  return getById(table, id);
}

async function getById(table: Table, id: string): Promise<CategoryRow> {
  const t = tableOf(table);
  const rows = await sql<CategoryRow[]>`SELECT * FROM ${t} WHERE id = ${id}`;
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
  const t = tableOf(table);
  const row = await sql`SELECT id FROM ${t} WHERE id = ${id}`;
  if (!row.length) throw new NotFoundError("Category not found.");
  const dup = await sql`SELECT id FROM ${t} WHERE name = ${trimmed} AND id != ${id}`;
  if (dup.length) throw new ValidationError("name", "Name already exists.");
  const now = new Date().toISOString();
  await sql`UPDATE ${t} SET name = ${trimmed}, updated_at = ${now} WHERE id = ${id}`;
  return getById(table, id);
}

async function remove(table: Table, id: string): Promise<void> {
  await getDb();
  const t = tableOf(table);
  const row = await sql`SELECT id FROM ${t} WHERE id = ${id}`;
  if (!row.length) throw new NotFoundError("Category not found.");
  // ON DELETE RESTRICT makes this fail if referenced; explicit message:
  try {
    await sql`DELETE FROM ${t} WHERE id = ${id}`;
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
  const rows = await sql<(CategoryRow & { used: number })[]>`
    SELECT c.id, c.name, c.created_at, c.updated_at,
           COUNT(g.id)::int AS used
    FROM ${tableOf(table)} c
    LEFT JOIN guests g ON ${sql(table === "parties" ? "g.party_id" : "g.group_id")} = c.id
    GROUP BY c.id
    ORDER BY c.name ASC`;
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
