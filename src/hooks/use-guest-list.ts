"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiGet } from "@/lib/client";
import { filterParams } from "@/lib/guest-filter";
import type { SortKey, SortDir } from "@/lib/guest-sort";

const DEBOUNCE_MS = 300;

/**
 * Race guard: a response may only apply if it is the newest issued request.
 * Extracted pure so the stale-overwrite interleaving is unit-testable.
 */
export interface RequestGate {
  issue(): number;
  accept(issued: number): boolean;
}

export function createRequestGate(): RequestGate {
  let latest = 0;
  return {
    issue: () => ++latest,
    accept: (issued) => issued === latest
  };
}

/**
 * Guest-list data module: debounce → filter encode → fetch → state.
 * One interface for the guest dashboard and analytics; callers never
 * hand-roll query building, debouncing, or race handling again.
 */
export function useGuestList<T extends { id: string }>({
  search,
  partyId,
  groupId,
  sort,
  dir,
  initialGuests
}: {
  search: string;
  partyId: string;
  groupId: string;
  /** Optional server-side ordering — seam parity with the CSV export URL.
   *  The guest dashboard sorts client-side (instant) and leaves these unset. */
  sort?: SortKey;
  dir?: SortDir;
  initialGuests?: T[];
}) {
  const [guests, setGuests] = useState<T[]>(initialGuests ?? []);
  const [isLoading, setIsLoading] = useState(!initialGuests);
  const [error, setError] = useState("");

  // Debounce the query fed to fetches; input value stays immediate.
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [search]);

  // Monotonic request id: a slow stale response can never overwrite a newer
  // one — covers both effect-driven refetches and manual refresh() calls.
  const gateRef = useRef<RequestGate | null>(null);
  if (!gateRef.current) gateRef.current = createRequestGate();
  const gate = gateRef.current;

  const refresh = useCallback(async () => {
    const req = gate.issue();
    setIsLoading(true);
    setError("");
    const qs = filterParams({
      search: debouncedSearch,
      partyId,
      groupId,
      sort,
      dir
    });
    try {
      const data = await apiGet<{ guests: T[] }>(`/api/guests?${qs}`);
      if (!gate.accept(req)) return;
      setGuests(data.guests);
    } catch (e: unknown) {
      if (!gate.accept(req)) return;
      setError(e instanceof Error ? e.message : "Failed to load guests.");
    } finally {
      if (gate.accept(req)) setIsLoading(false);
    }
  }, [debouncedSearch, partyId, groupId, sort, dir]);

  // SSR data is already on screen — skip the redundant initial fetch.
  const skipInitialFetch = useRef(!!initialGuests);
  useEffect(() => {
    if (skipInitialFetch.current) {
      skipInitialFetch.current = false;
      return;
    }
    void refresh();
  }, [refresh]);

  return { guests, isLoading, error, refresh };
}
