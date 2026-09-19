/**
 * Pure guest-table sort — mirrors the server ORDER BY in guests.ts
 * (SORT_COLUMNS map + `, g.name ASC` tiebreak) so client display order
 * and CSV export order agree.
 */
export const SORT_KEYS = ["name", "pax", "party_name", "group_name"] as const;

export type SortKey = (typeof SORT_KEYS)[number];
export type SortDir = "asc" | "desc";

export interface SortState {
  key: SortKey;
  dir: SortDir;
}

/** Server default — matches `ORDER BY g.name ASC`, zero visual diff on load. */
export const DEFAULT_SORT: SortState = { key: "name", dir: "asc" };

/** Fields a row needs to be sortable (Guest view-model + GuestWithRefs both fit). */
export interface SortableGuest {
  name: string;
  pax: number;
  party_name: string;
  group_name: string;
}

function compare(a: SortableGuest, b: SortableGuest, key: SortKey): number {
  // pax must compare NUMERIC — string order would put "10" before "2".
  if (key === "pax") return a.pax - b.pax;
  if (key === "name") return a.name.localeCompare(b.name, "id");
  if (key === "party_name") return a.party_name.localeCompare(b.party_name, "id");
  return a.group_name.localeCompare(b.group_name, "id");
}

/**
 * Non-mutating sort. Secondary tiebreak on name asc (deterministic, and the
 * same `, g.name ASC` tiebreak the SQL path applies) — keeps rowReveal
 * index math stable.
 */
export function sortGuests<T extends SortableGuest>(
  rows: T[],
  sort: SortState
): T[] {
  const dir = sort.dir === "desc" ? -1 : 1;
  return [...rows].sort((a, b) => {
    const cmp = compare(a, b, sort.key);
    return cmp !== 0 ? cmp * dir : a.name.localeCompare(b.name, "id");
  });
}
