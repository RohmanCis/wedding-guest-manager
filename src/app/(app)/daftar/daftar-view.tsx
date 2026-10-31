"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { CategoryDot, CategoryIcon } from "@/components/ui/category-badge";
import { GuestFilterFields } from "@/components/guest-filter-fields";
import { TopBar } from "@/components/app-shell";
import { useGuestList } from "@/hooks/use-guest-list";
import { useGuestFilter } from "@/hooks/use-guest-filter";
import { sortGuests, DEFAULT_SORT } from "@/lib/guest-sort";
import { groupGuests } from "@/lib/group-guests";
import { RotateCcw } from "lucide-react";

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

export default function DaftarView({
  initialParties,
  initialGroups,
  initialGuests
}: {
  initialParties: Ref[];
  initialGroups: Ref[];
  initialGuests: Guest[];
}) {
  const {
    search,
    setSearch,
    partyId,
    setPartyId,
    groupId,
    setGroupId,
    reset,
    hasFilter
  } = useGuestFilter();
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
          <GuestFilterFields
            search={search}
            partyId={partyId}
            groupId={groupId}
            onSearchChange={setSearch}
            onPartyChange={setPartyId}
            onGroupChange={setGroupId}
            parties={parties}
            groups={groups}
          />
          {hasFilter && (
            <Button variant="ghost" size="sm" onClick={reset}>
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
                <Button variant="secondary" onClick={reset}>
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
              <section key={section.name} aria-label={section.name} className="section-cv">
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
