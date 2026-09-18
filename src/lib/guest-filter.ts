export interface GuestFilter {
  search?: string;
  partyId?: string;
  groupId?: string;
}

export function filterParams(filter: GuestFilter): URLSearchParams {
  const qs = new URLSearchParams();
  const search = filter.search?.trim();
  if (search) qs.set("search", search);
  if (filter.partyId) qs.set("partyId", filter.partyId);
  if (filter.groupId) qs.set("groupId", filter.groupId);
  return qs;
}

export function parseFilter(sp: URLSearchParams): GuestFilter {
  return {
    search: sp.get("search") || undefined,
    partyId: sp.get("partyId") || undefined,
    groupId: sp.get("groupId") || undefined
  };
}
