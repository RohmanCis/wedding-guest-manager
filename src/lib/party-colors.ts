/**
 * Color identity for Party/Group categories.
 * Named entries use the brand chart palette; user-created categories
 * fall back to a deterministic hash pick so colors stay stable.
 *
 * Note: bg/text use literal hex (arbitrary values) so Tailwind opacity
 * modifiers work — var() colors can't take /alpha. chart-3/chart-4 are
 * too light for text, so their text classes use darker analogues.
 */

export interface CategoryColor {
  /** solid dot, e.g. select options */
  dot: string;
  /** subtle badge background */
  bg: string;
  /** badge text (contrast-safe) */
  text: string;
  /** border-top accent for stat cards */
  border: string;
}

const chart1: CategoryColor = {
  dot: "bg-chart-1",
  bg: "bg-[#b05730]/10 dark:bg-[#c9a84c]/15",
  text: "text-[#8f4526] dark:text-[#d4b565]",
  border: "border-t-chart-1"
};
const chart2: CategoryColor = {
  dot: "bg-chart-2",
  bg: "bg-[#9c87f5]/10 dark:bg-[#c4717a]/15",
  text: "text-[#6f56d6] dark:text-[#dda0a7]",
  border: "border-t-chart-2"
};
const chart3: CategoryColor = {
  dot: "bg-chart-3",
  bg: "bg-[#ded8c4]/50 dark:bg-[#7a9cc4]/15",
  text: "text-[#7d7457] dark:text-[#a8c0dd]",
  border: "border-t-chart-3"
};
const chart4: CategoryColor = {
  dot: "bg-chart-4",
  bg: "bg-[#dbd3f0]/50 dark:bg-[#7ac49c]/15",
  text: "text-[#6656a8] dark:text-[#a5dcc0]",
  border: "border-t-chart-4"
};
const chart5: CategoryColor = {
  dot: "bg-chart-5",
  bg: "bg-[#b4552d]/10 dark:bg-[#c49c7a]/15",
  text: "text-[#8f4526] dark:text-[#dec2a6]",
  border: "border-t-chart-5"
};
const blue: CategoryColor = {
  dot: "bg-blue-500",
  bg: "bg-blue-500/10 dark:bg-blue-400/15",
  text: "text-blue-700 dark:text-blue-400",
  border: "border-t-blue-500"
};
const emerald: CategoryColor = {
  dot: "bg-emerald-500",
  bg: "bg-emerald-500/10 dark:bg-emerald-400/15",
  text: "text-emerald-700 dark:text-emerald-400",
  border: "border-t-emerald-500"
};
const amber: CategoryColor = {
  dot: "bg-amber-500",
  bg: "bg-amber-500/10 dark:bg-amber-400/15",
  text: "text-amber-700 dark:text-amber-400",
  border: "border-t-amber-500"
};
const pink: CategoryColor = {
  dot: "bg-pink-500",
  bg: "bg-pink-500/10 dark:bg-pink-400/15",
  text: "text-pink-700 dark:text-pink-400",
  border: "border-t-pink-500"
};
const gray: CategoryColor = {
  dot: "bg-gray-500",
  bg: "bg-gray-500/10 dark:bg-gray-400/15",
  text: "text-gray-700 dark:text-gray-400",
  border: "border-t-gray-500"
};

export const partyColors: Record<string, CategoryColor> = {
  Groom: chart1,
  Bride: chart2,
  "Groom Family": chart3,
  "Bride Family": chart4
};

export const groupColors: Record<string, CategoryColor> = {
  "Rekan Kerja": chart1,
  Sekolah: chart2,
  Kuliah: chart5,
  Tetangga: blue,
  Saudara: emerald,
  Teman: amber,
  Komunitas: pink,
  Lainnya: gray
};

const FALLBACK = [chart1, chart2, chart5, blue, emerald, amber, pink, gray];

export function colorFor(kind: "party" | "group", name: string): CategoryColor {
  const map = kind === "party" ? partyColors : groupColors;
  const hit = map[name];
  if (hit) return hit;
  // Deterministic fallback for user-created categories.
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0;
  }
  return FALLBACK[h % FALLBACK.length];
}

/* === Group color identity (hex-based) ===
 * Groups resolve to literal hex, applied via inline style — arbitrary-value
 * Tailwind classes can't be built dynamically (JIT scans source for complete
 * class strings). bg = dot at 15% alpha, text = dot lightened toward white
 * for ≥4.5:1 contrast on the tinted background (same logic as party badges).
 */

export interface GroupColor {
  /** solid swatch hex, e.g. dots */
  dot: string;
  /** subtle badge background (dot at 15% alpha, 8-digit hex) */
  bg: string;
  /** contrast-safe badge text (dot lightened) */
  text: string;
}

export const groupColorHex: Record<string, string> = {
  "Rekan Kerja": "#5B8CDB",
  Sekolah: "#6DBF82",
  Kuliah: "#A78BD4",
  Tetangga: "#E08A5A",
  Saudara: "#D4756B",
  Teman: "#5BB8C4",
  Komunitas: "#C4A85B",
  Lainnya: "#8A8FA8"
};

const GROUP_FALLBACK = Object.values(groupColorHex);

/** Same deterministic hash as colorFor's party fallback — keep in sync. */
function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** Mix a #rrggbb hex toward white by `amount` (0..1). */
function lighten(hex: string, amount = 0.45): string {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

export function colorForGroup(name: string): GroupColor {
  const hex =
    groupColorHex[name] ?? GROUP_FALLBACK[hashName(name) % GROUP_FALLBACK.length];
  return { dot: hex, bg: `${hex}26`, text: lighten(hex) };
}
