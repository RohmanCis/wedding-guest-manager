/**
 * Export filename with the date of the Asia/Jakarta (WIB) calendar day, so an
 * evening UTC export does not carry yesterday's date. Safe to import from a
 * route handler (no Node-only APIs, no dependencies).
 */
export function exportFilename(
  scope: "all" | "filtered",
  ext: "csv" | "xlsx",
  now: Date = new Date()
): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(now);
  const part = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "";
  const date = `${part("year")}-${part("month")}-${part("day")}`;
  return `wedding-guests-${scope}-${date}.${ext}`;
}
