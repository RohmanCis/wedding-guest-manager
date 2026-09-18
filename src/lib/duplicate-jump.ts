/**
 * BR-007 "duplicate jump" decision core — pure, DOM-free.
 * Given the loaded guest list and pagination state, decide how the view
 * should reveal a target row (duplicate jump or new-guest flash):
 * - missing: id not in the list (caller keeps waiting or ignores)
 * - page: row exists but sits on another page
 * - visible: row is on the current view
 */
export type RowRevealAction =
  | { type: "missing" }
  | { type: "page"; page: number }
  | { type: "visible" };

export function rowReveal<T extends { id: string }>(
  guests: T[],
  id: string,
  opts: { page: number; pageSize: number; showAll: boolean }
): RowRevealAction {
  const idx = guests.findIndex((g) => g.id === id);
  if (idx === -1) return { type: "missing" };
  if (opts.showAll) return { type: "visible" };
  const { page, pageSize } = opts;
  if (idx < (page - 1) * pageSize || idx >= page * pageSize) {
    return { type: "page", page: Math.floor(idx / pageSize) + 1 };
  }
  return { type: "visible" };
}
