import { getDb, cryptoId } from "./db";
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
}

function validateRefs(partyId: string, groupId: string) {
  const db = getDb();
  const p = db.prepare("SELECT id FROM parties WHERE id = ?").get(partyId);
  if (!p) throw new ValidationError("partyId", "Invalid Party.");
  const g = db.prepare("SELECT id FROM groups WHERE id = ?").get(groupId);
  if (!g) throw new ValidationError("groupId", "Invalid Group.");
}

function validateInput(input: GuestInput) {
  if (!input.name || !input.name.trim())
    throw new ValidationError("name", "Name is required.");
  if (!input.address || !input.address.trim())
    throw new ValidationError("address", "Address is required.");
  validateRefs(input.partyId, input.groupId);
}

export function listGuests(filter: GuestFilter = {}): GuestWithRefs[] {
  const db = getDb();
  const where: string[] = [];
  const params: Record<string, unknown> = {};
  if (filter.search && filter.search.trim()) {
    where.push("g.name LIKE @search");
    params.search = `%${filter.search.trim()}%`;
  }
  if (filter.partyId) {
    where.push("g.party_id = @partyId");
    params.partyId = filter.partyId;
  }
  if (filter.groupId) {
    where.push("g.group_id = @groupId");
    params.groupId = filter.groupId;
  }
  const sql = `
    SELECT g.*, p.name AS party_name, gr.name AS group_name
    FROM guests g
    JOIN parties p ON p.id = g.party_id
    JOIN groups gr ON gr.id = g.group_id
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY g.name COLLATE NOCASE ASC
  `;
  return db.prepare(sql).all(params) as GuestWithRefs[];
}

export function getGuest(id: string): GuestWithRefs {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT g.*, p.name AS party_name, gr.name AS group_name
       FROM guests g
       JOIN parties p ON p.id = g.party_id
       JOIN groups gr ON gr.id = g.group_id
       WHERE g.id = @id`
    )
    .get({ id }) as GuestWithRefs | undefined;
  if (!row) throw new NotFoundError("Guest not found.");
  return row;
}

export function createGuest(input: GuestInput): GuestWithRefs {
  validateInput(input);
  const db = getDb();
  const nameNorm = normalizeName(input.name);
  const existing = db
    .prepare("SELECT id FROM guests WHERE name_norm = ?")
    .get(nameNorm) as { id: string } | undefined;
  if (existing) throw new DuplicateNameError(existing.id);
  const id = cryptoId();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO guests (id, name, name_norm, address, party_id, group_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.name.trim(),
    nameNorm,
    input.address.trim(),
    input.partyId,
    input.groupId,
    now,
    now
  );
  return getGuest(id);
}

export function updateGuest(id: string, input: GuestInput): GuestWithRefs {
  validateInput(input);
  const db = getDb();
  const current = db.prepare("SELECT id, name_norm FROM guests WHERE id = ?").get(id) as
    | { id: string; name_norm: string }
    | undefined;
  if (!current) throw new NotFoundError("Guest not found.");
  const nameNorm = normalizeName(input.name);
  if (nameNorm !== current.name_norm) {
    const existing = db
      .prepare("SELECT id FROM guests WHERE name_norm = ? AND id != ?")
      .get(nameNorm, id) as { id: string } | undefined;
    if (existing) throw new DuplicateNameError(existing.id);
  }
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE guests SET name = @name, name_norm = @name_norm, address = @address,
       party_id = @party_id, group_id = @group_id, updated_at = @updated_at
     WHERE id = @id`
  ).run({
    id,
    name: input.name.trim(),
    name_norm: nameNorm,
    address: input.address.trim(),
    party_id: input.partyId,
    group_id: input.groupId,
    updated_at: now
  });
  return getGuest(id);
}

export function deleteGuest(id: string): void {
  const db = getDb();
  const row = db.prepare("SELECT id FROM guests WHERE id = ?").get(id);
  if (!row) throw new NotFoundError("Guest not found.");
  db.prepare("DELETE FROM guests WHERE id = ?").run(id);
}

export function exportGuestsCsv(filter: GuestFilter = {}): string {
  const rows = listGuests(filter);
  const header = ["Name", "Address", "Party", "Group"];
  const lines = [header.map(csvCell).join(",")];
  for (const r of rows) {
    lines.push(
      [r.name, r.address, r.party_name, r.group_name].map(csvCell).join(",")
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
