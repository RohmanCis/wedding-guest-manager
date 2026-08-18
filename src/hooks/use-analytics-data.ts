"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/client";
import { partyHex, colorForGroup } from "@/lib/party-colors";
import type { PieData } from "@/components/charts/pie-context";

interface AnalyticsGuest {
  id: string;
  party_name: string;
  group_name: string;
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
        setByGroup(
          aggregate(data.guests, "group_name").map((d) => ({
            ...d,
            color: colorForGroup(d.label).dot
          }))
        );
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
