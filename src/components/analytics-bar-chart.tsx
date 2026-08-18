"use client";

import { partyHex, colorForGroup } from "@/lib/party-colors";

interface Datum {
  label: string;
  value: number;
}

/**
 * Horizontal bar distribution for /analytics. Replaces the vendored
 * visx/d3 donut (~150KB) with pure CSS — bars size relative to the max
 * value (biggest = full width), percentage text shows share of total.
 * Colors always resolve through party-colors (mode-aware), never inline.
 */
export function AnalyticsBarChart({
  data,
  mode
}: {
  data: Datum[];
  mode: "party" | "group";
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const max = Math.max(1, ...data.map((d) => d.value));
  const colorOf = (name: string) =>
    mode === "party" ? partyHex(name) : colorForGroup(name).dot;

  return (
    <div className="w-full">
      {/* key={mode}: remount replays the grow-in stagger on toggle */}
      <ul key={mode} className="max-h-[480px] space-y-3 overflow-y-auto">
        {data.map((d, i) => {
          const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
          return (
            <li
              key={d.label}
              className="animate-row-in"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="mb-1 flex items-baseline justify-between gap-3">
                <span className="truncate text-sm font-medium text-accent-cream">
                  {d.label}
                </span>
                <span className="shrink-0 text-sm tabular-nums text-secondary">
                  <span className="font-semibold text-accent-cream">
                    {d.value}
                  </span>
                  {` · ${pct}%`}
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-3">
                <div
                  className="analytics-bar-in h-full rounded-full"
                  style={{
                    width: `${(d.value / max) * 100}%`,
                    backgroundColor: colorOf(d.label),
                    animationDelay: `${i * 40}ms`
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      <table className="sr-only" aria-label="Guest distribution data">
        <thead>
          <tr>
            <th scope="col">Nama</th>
            <th scope="col">Jumlah</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <td>{d.label}</td>
              <td>{d.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
