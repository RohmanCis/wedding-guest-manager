"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { CategoryDot, CategoryIcon } from "@/components/ui/category-badge";
import { TopBar } from "@/components/app-shell";
import { useGuestList } from "@/hooks/use-guest-list";
import { sortGuests, DEFAULT_SORT } from "@/lib/guest-sort";
import { groupGuests } from "@/lib/group-guests";
import { Search, RotateCcw } from "lucide-react";

interface Ref {
  id: string;
  name: string;
  used?: number;
}

interface Guest {
  id: string;
  name: string;
  address: string;
  party_id: string;
  group_id: string;
  pax: number;
  party_name: string;
  group_name: string;
}

const ALL = "__all__";

export default function DaftarView({
  initialParties,
  initialGroups,
  initialGuests
}: {
  initialParties: Ref[];
  initialGroups: Ref[];
  initialGuests: Guest[];
}) {
  const [search, setSearch] = useState("");
  const [partyId, setPartyId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [mode, setMode] = useState<"party" | "group">("party");
  // Read-only page: categories only change on /categories, no reload needed.
  const [parties] = useState<Ref[]>(initialParties);
  const [groups] = useState<Ref[]>(initialGroups);

  const { guests, isLoading, error } = useGuestList<Guest>({
    search,
    partyId,
    groupId,
    initialGuests
  });

  const hasFilter = !!(search.trim() || partyId || groupId);

  // Explicit name-asc: server already returns this order.
  const sorted = useMemo(() => sortGuests(guests, DEFAULT_SORT), [guests]);
  const sections = useMemo(
    () =>
      groupGuests(
        sorted,
        mode,
        mode === "party" ? parties.map((p) => p.name) : groups.map((g) => g.name)
      ),
    [sorted, mode, parties, groups]
  );

  const total = parties.reduce((sum, p) => sum + (p.used ?? 0), 0);

  function resetFilters() {
    setSearch("");
    setPartyId("");
    setGroupId("");
  }

  return (
    <>
      <TopBar>
        <h1 className="text-base font-semibold text-accent-cream">Daftar</h1>
        <div className="flex items-center gap-2">
          <Button
            variant={mode === "party" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setMode("party")}
          >
            Per Pihak
          </Button>
          <Button
            variant={mode === "group" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setMode("group")}
          >
            Per Grup
          </Button>
        </div>
      </TopBar>
      <main className="space-y-5 p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative w-full sm:w-auto">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <Input
              aria-label="Cari nama"
              className="w-full pl-9 sm:w-56"
              placeholder="Cari nama..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            value={partyId || ALL}
            onValueChange={(v) => setPartyId(v === ALL ? "" : v)}
          >
            <SelectTrigger aria-label="Filter party" className="w-full sm:w-44">
              <SelectValue placeholder="Party" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Semua party</SelectItem>
              {parties.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  <span className="flex items-center gap-2">
                    <CategoryDot kind="party" name={p.name} />
                    <CategoryIcon kind="party" name={p.name} />
                    {p.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={groupId || ALL}
            onValueChange={(v) => setGroupId(v === ALL ? "" : v)}
          >
            <SelectTrigger aria-label="Filter group" className="w-full sm:w-44">
              <SelectValue placeholder="Group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Semua group</SelectItem>
              {groups.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  <span className="flex items-center gap-2">
                    <CategoryDot kind="group" name={g.name} />
                    <CategoryIcon kind="group" name={g.name} />
                    {g.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasFilter && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              <RotateCcw aria-hidden="true" />
              Reset
            </Button>
          )}
        </div>

        <p className="text-sm text-secondary">Menampilkan {guests.length} tamu</p>

        {error ? (
          <Alert variant="error">{error}</Alert>
        ) : !isLoading && guests.length === 0 ? (
          total === 0 ? (
            <EmptyState
              variant="empty"
              title="Belum ada tamu"
              description="Tambahkan tamu dari halaman Tamu."
            />
          ) : (
            <EmptyState
              variant="no-results"
              title="Tidak ada hasil"
              description="Tidak ada tamu yang cocok dengan filter saat ini."
              action={
                <Button variant="secondary" onClick={resetFilters}>
                  <RotateCcw aria-hidden="true" />
                  Reset filter
                </Button>
              }
            />
          )
        ) : (
          <div
            aria-busy={isLoading}
            className={`space-y-5 ${
              isLoading ? "opacity-60 transition-opacity" : "transition-opacity"
            }`}
          >
            <p role="status" className="sr-only">
              {isLoading ? "Memuat daftar tamu" : ""}
            </p>
            {sections.map((section) => (
              <section key={section.name} aria-label={section.name}>
                <div className="sticky top-12 z-[5] flex h-10 items-center justify-between gap-2 border-b border-default bg-surface-1 px-3">
                  <span className="flex items-center gap-1.5">
                    <CategoryDot kind={mode} name={section.name} />
                    <CategoryIcon
                      kind={mode}
                      name={section.name}
                      className="size-3.5"
                    />
                    <h2 className="text-sm font-medium">{section.name}</h2>
                  </span>
                  <span className="text-xs text-secondary tabular-nums">
                    {section.guests.length} tamu
                  </span>
                </div>
                <ul role="list" className="border-b border-subtle last:border-b-0">
                  {section.guests.map((g) => (
                    <li
                      key={g.id}
                      className="flex items-center justify-between gap-3 border-b border-subtle px-3 py-2.5 last:border-b-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{g.name}</p>
                        <p className="truncate text-xs text-secondary">{g.address}</p>
                      </div>
                      {g.pax > 1 && (
                        <span className="shrink-0 text-sm text-secondary tabular-nums">
                          ×{g.pax}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
