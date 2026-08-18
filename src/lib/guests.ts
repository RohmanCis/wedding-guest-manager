import { getDb, sql, cryptoId } from "./db";
import {
  normalizeName,
  DuplicateNameError,
  NotFoundError,
  ValidationError
} from "./normalize";

export interface GuestRow {
  id: string;
  name: string;
  address: string;
  party_id: string;
  group_id: string;
  pax: number;
  created_at: string;
  updated_at: string;
}

export interface GuestWithRefs extends GuestRow {
  party_name: string;
  group_name: string;
}

export interface GuestFilter {
  search?: string;
  partyId?: string;
  groupId?: string;
}

export interface GuestInput {
  name: string;
  address: string;
  partyId: string;
  groupId: string;
  /** People covered by this entry (guest + companions). Defaults to 1. */
  pax?: number;
}

async function validateRefs(partyId: string, groupId: string) {
  await getDb();
  const p = await sql`SELECT id FROM parties WHERE id = ${partyId}`;
  if (!p.length) throw new ValidationError("partyId", "Invalid Party.");
  const g = await sql`SELECT id FROM groups WHERE id = ${groupId}`;
  if (!g.length) throw new ValidationError("groupId", "Invalid Group.");
}

export const MAX_PAX = 4;

function normalizePax(pax: GuestInput["pax"]): number {
  if (pax === undefined || pax === null || (pax as unknown) === "") return 1;
  const n = typeof pax === "number" ? pax : Number(pax);
  if (!Number.isInteger(n) || n < 1 || n > MAX_PAX)
    throw new ValidationError(
      "pax",
      `Jumlah orang harus bilangan bulat 1–${MAX_PAX}.`
    );
  return n;
}

function validateInput(input: GuestInput) {
  if (!input.name || !input.name.trim())
    throw new ValidationError("name", "Name is required.");
  if (!input.address || !input.address.trim())
    throw new ValidationError("address", "Address is required.");
  return normalizePax(input.pax);
}

export async function listGuests(
  filter: GuestFilter = {}
): Promise<GuestWithRefs[]> {
  await getDb();
  const search = filter.search?.trim() || null;
  const partyId = filter.partyId || null;
  const groupId = filter.groupId || null;
  // postgres.js rows are class instances; spread to plain objects for RSC
  // serialization into Client Components.
  const rows = await sql<GuestWithRefs[]>`
    SELECT g.*, p.name AS party_name, gr.name AS group_name
    FROM guests g
    JOIN parties p ON p.id = g.party_id
    JOIN groups gr ON gr.id = g.group_id
    WHERE
      (${search}::text IS NULL OR g.name ILIKE ${"%" + search + "%"})
      AND (${partyId}::text IS NULL OR g.party_id = ${partyId})
      AND (${groupId}::text IS NULL OR g.group_id = ${groupId})
    ORDER BY g.name ASC
  `;
  return rows.map((r) => ({ ...r }));
}

export async function getGuest(id: string): Promise<GuestWithRefs> {
  await getDb();
  const rows = await sql<GuestWithRefs[]>`
    SELECT g.*, p.name AS party_name, gr.name AS group_name
    FROM guests g
    JOIN parties p ON p.id = g.party_id
    JOIN groups gr ON gr.id = g.group_id
    WHERE g.id = ${id}`;
  if (!rows.length) throw new NotFoundError("Guest not found.");
  return { ...rows[0] };
}

export async function createGuest(
  input: GuestInput
): Promise<GuestWithRefs> {
  const pax = validateInput(input);
  await validateRefs(input.partyId, input.groupId);
  const nameNorm = normalizeName(input.name);
  const existing = await sql`SELECT id FROM guests WHERE name_norm = ${nameNorm}`;
  if (existing.length) throw new DuplicateNameError(existing[0].id as string);
  const id = cryptoId();
  const now = new Date().toISOString();
  try {
    await sql`
      INSERT INTO guests (id, name, name_norm, address, party_id, group_id, pax, created_at, updated_at)
      VALUES (${id}, ${input.name.trim()}, ${nameNorm}, ${input.address.trim()}, ${input.partyId}, ${input.groupId}, ${pax}, ${now}, ${now})`;
  } catch (e) {
    if (isNameNormUniqueError(e)) {
      const row = await sql`SELECT id FROM guests WHERE name_norm = ${nameNorm}`;
      if (row.length) throw new DuplicateNameError(row[0].id as string);
    }
    throw e;
  }
  return getGuest(id);
}

export async function updateGuest(
  id: string,
  input: GuestInput
): Promise<GuestWithRefs> {
  const pax = validateInput(input);
  await validateRefs(input.partyId, input.groupId);
  const current = await sql`SELECT id, name_norm FROM guests WHERE id = ${id}`;
  if (!current.length) throw new NotFoundError("Guest not found.");
  const nameNorm = normalizeName(input.name);
  if (nameNorm !== current[0].name_norm) {
    const existing = await sql`
      SELECT id FROM guests WHERE name_norm = ${nameNorm} AND id != ${id}`;
    if (existing.length) throw new DuplicateNameError(existing[0].id as string);
  }
  const now = new Date().toISOString();
  try {
    await sql`
      UPDATE guests SET name = ${input.name.trim()}, name_norm = ${nameNorm},
        address = ${input.address.trim()}, party_id = ${input.partyId},
        group_id = ${input.groupId}, pax = ${pax}, updated_at = ${now}
      WHERE id = ${id}`;
  } catch (e) {
    if (isNameNormUniqueError(e)) {
      const row = await sql`
        SELECT id FROM guests WHERE name_norm = ${nameNorm} AND id != ${id}`;
      if (row.length) throw new DuplicateNameError(row[0].id as string);
    }
    throw e;
  }
  return getGuest(id);
}

function isNameNormUniqueError(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code?: string }).code === "23505"
  );
}

export async function deleteGuest(id: string): Promise<void> {
  await getDb();
  const row = await sql`SELECT id FROM guests WHERE id = ${id}`;
  if (!row.length) throw new NotFoundError("Guest not found.");
  await sql`DELETE FROM guests WHERE id = ${id}`;
}

export async function exportGuestsCsv(
  filter: GuestFilter = {}
): Promise<string> {
  const rows = await listGuests(filter);
  const header = ["Name", "Address", "Party", "Group", "Pax"];
  const lines = [header.map(csvCell).join(",")];
  for (const r of rows) {
    lines.push(
      [r.name, r.address, r.party_name, r.group_name, String(r.pax)]
        .map(csvCell)
        .join(",")
    );
  }
  return lines.join("\r\n");
}

export function csvCell(value: string): string {
  const v = value ?? "";
  if (/[",\r\n]/.test(v)) {
    return '"' + v.replace(/"/g, '""') + '"';
  }
  return v;
}
