"use client";

import { useCallback, useState } from "react";

/**
 * The Guest filter triple as view state. One owner for the three values,
 * `reset`, and `hasFilter` so no view re-derives them. Fetch/debounce stays
 * in `useGuestList`.
 */
export function useGuestFilter() {
  const [search, setSearch] = useState("");
  const [partyId, setPartyId] = useState("");
  const [groupId, setGroupId] = useState("");

  const reset = useCallback(() => {
    setSearch("");
    setPartyId("");
    setGroupId("");
  }, []);

  return {
    search,
    setSearch,
    partyId,
    setPartyId,
    groupId,
    setGroupId,
    reset,
    hasFilter: !!(search.trim() || partyId || groupId)
  };
}
