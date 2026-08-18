"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/client";
import { colorFor } from "@/lib/party-colors";
import type { PieData } from "@/components/charts/pie-context";

interface AnalyticsGuest {
  id: string;
  party_name: string;
  group_name: string;
}

/**
 * colorFor() returns Tailwind classes, but SVG slices need hex fills.
 * chart-1..5 map to the updated --chart-N token values; the rest map to
 * their Tailwind palette hexes.
 */
const DOT_HEX: Record<string, string> = {
  "bg-chart-1": "#c9a84c",
  "bg-chart-2": "#c4717a",
  "bg-chart-3": "#7a9cc4",
  "bg-chart-4": "#7ac49c",
  "bg-chart-5": "#c49c7a",
  "bg-blue-500": "#3b82f6",
  "bg-emerald-500": "#10b981",
  "bg-amber-500": "#f59e0b",
  "bg-pink-500": "#ec4899",
  "bg-gray-500": "#6b7280"
};

function partyHex(name: string): string {
  return DOT_HEX[colorFor("party", name).dot] ?? "#c9a84c";
}

function aggregate(
  guests: AnalyticsGuest[],
  key: "party_name" | "group_name"
): PieData[] {
  const counts = new Map<string, number>();
  for (const g of guests) {
    counts.set(g[key], (counts.get(g[key]) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([label, value]) => ({ label, value }));
}

export function useAnalyticsData({
  search,
  partyId,
  groupId
}: {
  search: string;
  partyId: string;
  groupId: string;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalGuests, setTotalGuests] = useState(0);
  const [byParty, setByParty] = useState<PieData[]>([]);
  const [byGroup, setByGroup] = useState<PieData[]>([]);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError("");
    // Same query param semantics as the guest list (src/app/page.tsx).
    const qs = new URLSearchParams();
    if (search.trim()) qs.set("search", search.trim());
    if (partyId) qs.set("partyId", partyId);
    if (groupId) qs.set("groupId", groupId);
    apiGet<{ guests: AnalyticsGuest[] }>(`/api/guests?${qs}`)
      .then((data) => {
        if (!active) return;
        setTotalGuests(data.guests.length);
        setByParty(
          aggregate(data.guests, "party_name").map((d) => ({
            ...d,
            color: partyHex(d.label)
          }))
        );
        setByGroup(aggregate(data.guests, "group_name"));
      })
      .catch((e: unknown) => {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Failed to load analytics.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [search, partyId, groupId]);

  return { isLoading, error, totalGuests, byParty, byGroup };
}
