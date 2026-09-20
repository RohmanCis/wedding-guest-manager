export interface GuestSection<T> {
  name: string;
  guests: T[];
}

/**
 * Group guests into sections by Party or Group name.
 *  - Section order follows `categoryNames` order.
 *  - Categories with zero matching guests NEVER produce a section (always hidden).
 *  - Within a section, guests keep input order (server already returns name asc).
 *  - A guest whose category name is not in `categoryNames` (defensive — FK makes
 *    this impossible) is appended in trailing sections grouped by its actual
 *    category name, in first-appearance order — never dropped.
 */
export function groupGuests<T extends { party_name: string; group_name: string }>(
  guests: T[],
  mode: "party" | "group",
  categoryNames: string[]
): GuestSection<T>[] {
  const key = mode === "party" ? "party_name" : "group_name";
  const buckets = new Map<string, T[]>();
  for (const g of guests) {
    const name = g[key];
    const bucket = buckets.get(name);
    if (bucket) bucket.push(g);
    else buckets.set(name, [g]);
  }

  const sections: GuestSection<T>[] = [];
  for (const name of categoryNames) {
    const bucket = buckets.get(name);
    if (bucket) {
      sections.push({ name, guests: bucket });
      buckets.delete(name); // never emit a known category twice
    }
  }
  // Trailing sections: unknown category names, first-appearance order.
  for (const [name, bucket] of buckets) sections.push({ name, guests: bucket });
  return sections;
}
