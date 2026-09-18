"use client";

import { useMemo } from "react";
import { useGuestList } from "./use-guest-list";
import { partyHex, colorForGroup } from "@/lib/party-colors";
import type { PieData } from "@/components/charts/pie-context";

export interface AnalyticsGuest {
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

/** Distribution derivation on top of the shared guest-list data module. */
export function useAnalyticsData({
  search,
  partyId,
  groupId,
  initialGuests
}: {
  search: string;
  partyId: string;
  groupId: string;
  initialGuests?: AnalyticsGuest[];
}) {
  const { guests, isLoading, error } = useGuestList<AnalyticsGuest>({
    search,
    partyId,
    groupId,
    initialGuests
  });
  const byParty = useMemo(
    () =>
      aggregate(guests, "party_name").map((d) => ({
        ...d,
        color: partyHex(d.label)
      })),
    [guests]
  );
  const byGroup = useMemo(
    () =>
      aggregate(guests, "group_name").map((d) => ({
        ...d,
        color: colorForGroup(d.label).dot
      })),
    [guests]
  );
  return { isLoading, error, totalGuests: guests.length, byParty, byGroup };
}
