import { SORT_KEYS, type SortKey, type SortDir } from "./guest-sort";

export interface GuestFilter {
  search?: string;
  partyId?: string;
  groupId?: string;
  sort?: SortKey;
  dir?: SortDir;
}

export function filterParams(filter: GuestFilter): URLSearchParams {
  const qs = new URLSearchParams();
  const search = filter.search?.trim();
  if (search) qs.set("search", search);
  if (filter.partyId) qs.set("partyId", filter.partyId);
  if (filter.groupId) qs.set("groupId", filter.groupId);
  if (filter.sort) qs.set("sort", filter.sort);
  if (filter.dir) qs.set("dir", filter.dir);
  return qs;
}

export function parseFilter(sp: URLSearchParams): GuestFilter {
  const sort = sp.get("sort");
  const dir = sp.get("dir");
  return {
    search: sp.get("search") || undefined,
    partyId: sp.get("partyId") || undefined,
    groupId: sp.get("groupId") || undefined,
    // Trust boundary: only whitelisted sort keys and directions survive the
    // parse — the raw param must never reach SQL as an identifier.
    sort:
      sort && (SORT_KEYS as readonly string[]).includes(sort)
        ? (sort as SortKey)
        : undefined,
    dir: dir === "asc" || dir === "desc" ? dir : undefined
  };
}
