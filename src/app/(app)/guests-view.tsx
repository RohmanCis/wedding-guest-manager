"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { apiGet, apiSend, ApiError } from "@/lib/client";
import { filterParams } from "@/lib/guest-filter";
import { rowReveal } from "@/lib/duplicate-jump";
import {
  sortGuests,
  DEFAULT_SORT,
  isDefaultSort,
  sortDescription,
  sortAnnouncement,
  type SortKey,
  type SortState
} from "@/lib/guest-sort";
import { useGuestList } from "@/hooks/use-guest-list";
import { useAddGuestShortcut } from "@/hooks/use-add-guest-shortcut";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";
import dynamic from "next/dynamic";
const Modal = dynamic(() => import("@/components/ui/modal").then((m) => m.Modal), { ssr: false });
const ModalContent = dynamic(() => import("@/components/ui/modal").then((m) => m.ModalContent), { ssr: false });
const ModalHeader = dynamic(() => import("@/components/ui/modal").then((m) => m.ModalHeader), { ssr: false });
const ModalBody = dynamic(() => import("@/components/ui/modal").then((m) => m.ModalBody), { ssr: false });
const ModalFooter = dynamic(() => import("@/components/ui/modal").then((m) => m.ModalFooter), { ssr: false });
const DropdownMenu = dynamic(() => import("@/components/ui/dropdown-menu").then((m) => m.DropdownMenu), { ssr: false });
const DropdownMenuTrigger = dynamic(() => import("@/components/ui/dropdown-menu").then((m) => m.DropdownMenuTrigger), { ssr: false });
const DropdownMenuContent = dynamic(() => import("@/components/ui/dropdown-menu").then((m) => m.DropdownMenuContent), { ssr: false });
const DropdownMenuItem = dynamic(() => import("@/components/ui/dropdown-menu").then((m) => m.DropdownMenuItem), { ssr: false });
import { Alert } from "@/components/ui/alert";import {
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableActions
} from "@/components/ui/table";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/loading";
import { CategoryBadge, CategoryDot, CategoryIcon } from "@/components/ui/category-badge";
import { colorFor } from "@/lib/party-colors";
import { TopBar } from "@/components/app-shell";
import { useIsMobile } from "@/hooks/use-is-mobile";
import {
  Search,
  Plus,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  RotateCcw,
  Pencil,
  Trash2,
  FileDown,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePagination } from "@/hooks/use-pagination";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationEllipsis
} from "@/components/ui/pagination";

const PAGE_SIZE = 10;

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
interface FormState {
  id?: string;
  name: string;
  address: string;
  partyId: string;
  groupId: string;
  pax: number;
}

const EMPTY: FormState = {
  name: "",
  address: "",
  partyId: "",
  groupId: "",
  pax: 1
};
const ALL = "__all__";
const PAX_OPTIONS = [1, 2, 3, 4];

/** Sortable table header: full-cell button (≥44px hit area via -m-3 p-3),
 * aria-sort on the <th>. Idle ArrowUpDown icon rests at 70% opacity
 * (≥3:1 on the surface-1 header) at every breakpoint, full opacity on
 * hover/focus; the active column swaps to a gold ArrowUp/ArrowDown and
 * a text-primary label. */
function SortHeader({
  label,
  sortKey,
  sort,
  onToggle,
  className,
  align = "start"
}: {
  label: string;
  sortKey: SortKey;
  sort: SortState;
  onToggle: (key: SortKey) => void;
  className?: string;
  align?: "start" | "center";
}) {
  const active = sort.key === sortKey;
  const Icon = active
    ? sort.dir === "asc"
      ? ArrowUp
      : ArrowDown
    : ArrowUpDown;
  return (
    <TableHead
      className={cn("group/head", className)}
      aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onToggle(sortKey)}
        aria-label={`Urutkan berdasarkan ${label}`}
        title={`Urutkan berdasarkan ${label}`}
        className={cn(
          "-m-3 h-auto min-h-11 w-full gap-1.5 p-3 text-xs font-medium uppercase tracking-wide focus-visible:ring-offset-surface-1",
          active && "text-primary hover:text-primary",
          align === "center" ? "justify-center" : "justify-start"
        )}
      >
        {label}
        <Icon
          aria-hidden="true"
          className={cn(
            "shrink-0 transition-opacity duration-150",
            active
              ? "text-accent-gold"
              : "text-muted opacity-70 group-hover/head:opacity-100 group-focus-within/head:opacity-100"
          )}
        />
      </Button>
    </TableHead>
  );
}

export default function GuestsView({
  initialGuests,
  initialParties,
  initialGroups
}: {
  initialGuests: Guest[];
  initialParties: Ref[];
  initialGroups: Ref[];
}) {
  const [parties, setParties] = useState<Ref[]>(initialParties);
  const [groups, setGroups] = useState<Ref[]>(initialGroups);
  const [search, setSearch] = useState("");
  const [partyId, setPartyId] = useState("");
  const [groupId, setGroupId] = useState("");
  const { guests, isLoading, error, refresh } = useGuestList<Guest>({
    search,
    partyId,
    groupId,
    initialGuests
  });
  const [form, setForm] = useState<FormState | null>(null);
  const [formError, setFormError] = useState("");
  const [dupId, setDupId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [newGuestId, setNewGuestId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const [currentPage, setCurrentPage] = useState(1);
  const [showAll, setShowAll] = useState(false);
  // Hybrid sort: client-side instant reorder (no refetch — the full array is
  // already in `guests`); default {name, asc} mirrors the server default so
  // the first paint is byte-identical to the SSR order.
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT);
  const sorted = useMemo(() => sortGuests(guests, sort), [guests, sort]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  // First client paint shows SSR data without enter animations (LCP un-gate);
  // later renders (filter changes, new guest) animate rows in via CSS.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // SR-only sort announcement (aria-live). The region renders empty from the
  // first paint; the ref-seeded comparison skips the initial effect run (and
  // the StrictMode double-run) so nothing is announced on first render —
  // only on an actual toggle or reset-to-default.
  const [announcement, setAnnouncement] = useState("");
  const lastAnnounced = useRef(sortAnnouncement(DEFAULT_SORT));
  useEffect(() => {
    const msg = sortAnnouncement(sort);
    if (msg === lastAnnounced.current) return;
    lastAnnounced.current = msg;
    setAnnouncement(msg);
  }, [sort]);

  const totalPages = Math.max(1, Math.ceil(guests.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
    currentPage: safePage,
    totalPages,
    paginationItemsToDisplay: isMobile ? 5 : 7
  });
  // TRAP: every index-based consumer (page slice, rowReveal math, No.
  // numbering) must read `sorted`, not `guests` — sort BEFORE the slice.
  const pageGuests = showAll
    ? sorted
    : sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const start = guests.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const end = Math.min(safePage * PAGE_SIZE, guests.length);

  const loadRefs = useCallback(async () => {
    const data = await apiGet<{ parties: Ref[]; groups: Ref[] }>(
      "/api/categories"
    );
    setParties(data.parties);
    setGroups(data.groups);
    setForm((f) =>
      f && !f.partyId ? { ...f, partyId: data.parties[0]?.id || "" } : f
    );
    setForm((f) =>
      f && !f.groupId ? { ...f, groupId: data.groups[0]?.id || "" } : f
    );
  }, []);

  // Reset pagination whenever the active filter set or sort changes.
  useEffect(() => {
    setCurrentPage(1);
    setShowAll(false);
  }, [search, partyId, groupId, sort]);

  // BR-007: scroll the duplicate's existing row into view and highlight it.
  // "missing" keeps the highlight pending while the reset-filter fetch is in
  // flight; if the landed list still lacks the target (deleted mid-jump in
  // another tab), the grace timer bounds the pending state instead of leaking.
  // Runs against `sorted` — the page math must match the displayed order.
  useEffect(() => {
    if (!highlightId || isLoading) return;
    const step = rowReveal(sorted, highlightId, {
      page: safePage,
      pageSize: PAGE_SIZE,
      showAll
    });
    if (step.type === "page") {
      setCurrentPage(step.page);
      return;
    }
    if (step.type === "missing") {
      // Grace covers the debounce window: any state transition (e.g. fetch
      // starts) re-runs this effect and cancels the timer.
      const t = setTimeout(() => setHighlightId(null), 500);
      return () => clearTimeout(t);
    }
    const el = document.getElementById(`guest-row-${highlightId}`);
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    const t = setTimeout(() => setHighlightId(null), 2400);
    return () => clearTimeout(t);
  }, [highlightId, isLoading, sorted, safePage, showAll]);

  // Newly created guest: ensure its flash row is on the visible page.
  useEffect(() => {
    if (!newGuestId || isLoading) return;
    const step = rowReveal(sorted, newGuestId, {
      page: safePage,
      pageSize: PAGE_SIZE,
      showAll
    });
    if (step.type === "page") setCurrentPage(step.page);
  }, [newGuestId, isLoading, sorted, safePage, showAll]);

  const hasFilter = !!(search.trim() || partyId || groupId);

  function toggleSort(key: SortKey) {
    // Same key → flip direction; new key → ascending.
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );
  }

  function resetFilters() {
    setSearch("");
    setPartyId("");
    setGroupId("");
  }

  function buildCsvUrl(scope: "all" | "filtered") {
    // Filtered export follows the screen: same filter seam, plus the active
    // sort so the CSV rows land in the order the user sees.
    const filter =
      scope === "filtered"
        ? Object.fromEntries(
            filterParams({ search, partyId, groupId, sort: sort.key, dir: sort.dir })
          )
        : {};
    const qs = new URLSearchParams({ csv: "1", scope, ...filter });
    return `/api/guests?${qs}`;
  }

  function openAdd() {
    setFormError("");
    setDupId(null);
    setForm({
      ...EMPTY,
      partyId: parties[0]?.id || "",
      groupId: groups[0]?.id || ""
    });
  }

  // Desktop accelerator: Ctrl/Cmd+Enter opens the same "Tambah Tamu" handler.
  useAddGuestShortcut(openAdd, {
    dialogOpen: !!form || !!confirmId,
    searchInput: searchInputRef
  });

  function openEdit(g: Guest) {
    setFormError("");
    setDupId(null);
    setForm({
      id: g.id,
      name: g.name,
      address: g.address,
      partyId: g.party_id,
      groupId: g.group_id,
      pax: g.pax
    });
  }

  /** Focus Nama on open — desktop/fine-pointer only, so phones/tablets don't
   *  pop the touch keyboard. Runs client-side (modal mounts after a click).
   *  On coarse pointers we keep Radix's default focus behavior untouched. */
  function focusNameOnOpen(e: Event) {
    if (typeof window === "undefined") return;
    // preventDefault only when we will actually move focus: Nama ref live AND
    // fine pointer. Anything else keeps Radix's default focus untouched.
    if (!nameInputRef.current) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    e.preventDefault();
    nameInputRef.current.focus();
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setFormError("");
    setDupId(null);
    setSaving(true);
    try {
      let createdId: string | null = null;
      if (form.id) {
        await apiSend("/api/guests", "PUT", form);
      } else {
        const res = await apiSend<{ guest: Guest }>(
          "/api/guests",
          "POST",
          form
        );
        createdId = res.guest.id;
      }
      setForm(null);
      await Promise.all([loadRefs(), refresh()]);
      if (createdId) setNewGuestId(createdId);
    } catch (err: any) {
      setFormError(err.message);
      setDupId(err instanceof ApiError ? (err.existingId ?? null) : null);
    } finally {
      setSaving(false);
    }
  }

  /** BR-007: jump from duplicate error to the existing record in the list. */
  async function viewExisting() {
    if (!dupId) return;
    const target = dupId;
    let g = guests.find((x) => x.id === target);
    if (!g) {
      // Existing record is filtered out — fetch unfiltered to learn its name.
      // If it is gone there too (deleted in another tab), no jump target:
      // plain filter reset, no pending highlight.
      try {
        const data = await apiGet<{ guests: Guest[] }>("/api/guests");
        g = data.guests.find((x) => x.id === target);
      } catch {
        // fall through to plain reset
      }
    }
    setForm(null);
    setDupId(null);
    setPartyId("");
    setGroupId("");
    setSearch(g ? g.name : "");
    setHighlightId(g ? target : null);
  }

  async function confirmDelete() {
    if (!confirmId) return;
    setDeleting(true);
    try {
      await apiSend(`/api/guests?id=${confirmId}`, "DELETE");
      setConfirmId(null);
      await Promise.all([loadRefs(), refresh()]);
    } finally {
      setDeleting(false);
    }
  }

  const total = parties.reduce((sum, p) => sum + (p.used ?? 0), 0);
  // ponytail: pax sum over the currently loaded guest list — reflects active
  // filters; make /api/categories return a global pax sum if this bothers later.
  const totalPax = guests.reduce((sum, g) => sum + g.pax, 0);

  const topActions = (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="sm">
            Export CSV
            <ChevronDown aria-hidden="true" className="text-muted" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <a href={buildCsvUrl("all")}>
              <FileDown aria-hidden="true" />
              Semua tamu
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild disabled={!hasFilter}>
            <a href={buildCsvUrl("filtered")}>
              <FileDown aria-hidden="true" />
              Hasil filter saat ini
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        size="sm"
        onClick={openAdd}
        aria-keyshortcuts="Control+Enter Meta+Enter"
      >
        <Plus aria-hidden="true" />
        Tambah Tamu
        <kbd
          aria-hidden="true"
          className="hidden rounded border border-default px-1 py-0.5 text-[10px] font-normal leading-none opacity-80 lg:inline-flex"
        >
          Ctrl ↵
        </kbd>
      </Button>
    </>
  );

  return (
    <>
      <TopBar>
        <h1 className="text-base font-semibold text-accent-cream">Tamu</h1>
        <div className="hidden items-center gap-2 sm:flex">{topActions}</div>
      </TopBar>

      <main className="space-y-5 p-6 pb-24 sm:pb-6">
        <section
          aria-label="Guest summary"
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
        >
          <StatCard
            label="Total"
            value={total}
            accent="bg-accent-gold"
            className="col-span-2 sm:col-span-1"
          />
          <StatCard
            label="Total Pax"
            value={totalPax}
            accent="bg-accent-rose"
            className="col-span-2 sm:col-span-1"
          />
          {parties.map((p) => (
            <StatCard
              key={p.id}
              label={
                <span className="inline-flex items-center gap-1.5">
                  <CategoryIcon kind="party" name={p.name} className="size-3.5" />
                  {p.name}
                </span>
              }
              value={p.used ?? 0}
              accent={colorFor(p.name).dot}
            />
          ))}
        </section>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative w-full sm:w-auto">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <Input
              ref={searchInputRef}
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

        {!isLoading && guests.length > 0 && (
          <p className="text-xs text-muted">
            Menampilkan{" "}
            {showAll
              ? `semua ${guests.length} tamu`
              : `${start}–${end} dari ${guests.length} tamu`}
            {!isDefaultSort(sort) && (
              <>
                {" · "}
                {sortDescription(sort)}
                {" · "}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSort(DEFAULT_SORT)}
                  className="h-auto px-1.5 py-0.5"
                >
                  Urutan default
                </Button>
              </>
            )}
          </p>
        )}

        {/* SR-only: announces sort changes; plain text node, NOT aria-live on
            the count line above. Empty until the first real toggle. */}
        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>

        {error && <Alert variant="error">{error}</Alert>}

        {isLoading ? (
          <TableContainer>
            <TableSkeleton rows={6} />
          </TableContainer>
        ) : guests.length === 0 ? (
          total === 0 ? (
            <EmptyState
              variant="empty"
              title="Belum ada tamu"
              description="Klik “Tambah Tamu” untuk membuat data pertama."
              action={
                <Button onClick={openAdd}>
                  <Plus aria-hidden="true" />
                  Tambah Tamu
                </Button>
              }
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
          <TableContainer>
            <div className="max-h-[32rem] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-transparent hover:bg-transparent">
                    <TableHead className="w-10">No.</TableHead>
                    <SortHeader
                      label="Nama"
                      sortKey="name"
                      sort={sort}
                      onToggle={toggleSort}
                    />
                    <SortHeader
                      label="Jumlah"
                      sortKey="pax"
                      sort={sort}
                      onToggle={toggleSort}
                      align="center"
                      className="w-14"
                    />
                    <TableHead className="hidden sm:table-cell">Alamat</TableHead>
                    <SortHeader
                      label="Party"
                      sortKey="party_name"
                      sort={sort}
                      onToggle={toggleSort}
                    />
                    <SortHeader
                      label="Group"
                      sortKey="group_name"
                      sort={sort}
                      onToggle={toggleSort}
                    />
                    <TableHead className="w-px">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Sort polish: top separator when the category value changes
                      between adjacent rows (color-run collisions between
                      custom-category fallback colors). */}
                  {(() => {
                    const sepKey =
                      sort.key === "party_name" || sort.key === "group_name"
                        ? sort.key
                        : null;
                    return pageGuests.map((g, i) => (
                      <TableRow
                        key={newGuestId === g.id ? `${g.id}-new` : g.id}
                        id={`guest-row-${g.id}`}
                        className={cn(
                          mounted && "animate-row-in",
                          newGuestId === g.id && "animate-row-flash",
                          highlightId === g.id &&
                            "bg-accent-gold-subtle hover:bg-accent-gold-subtle",
                          sepKey &&
                            i > 0 &&
                            pageGuests[i - 1][sepKey] !== g[sepKey] &&
                            "border-t border-default"
                        )}
                        onAnimationEnd={
                          newGuestId === g.id
                            ? () => setNewGuestId(null)
                            : undefined
                        }
                      >
                        <TableCell className="text-muted tabular-nums">
                          {showAll ? i + 1 : (safePage - 1) * PAGE_SIZE + i + 1}
                        </TableCell>
                        <TableCell className="font-medium">{g.name}</TableCell>
                        <TableCell className="text-center tabular-nums">
                          {g.pax > 1 ? `×${g.pax}` : g.pax}
                        </TableCell>
                        <TableCell className="hidden max-w-64 truncate text-secondary sm:table-cell">
                          {g.address}
                        </TableCell>
                        <TableCell>
                          <CategoryBadge kind="party" name={g.party_name} />
                        </TableCell>
                        <TableCell>
                          <CategoryBadge kind="group" name={g.group_name} />
                        </TableCell>
                        <TableCell>
                          <TableActions>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Edit ${g.name}`}
                              onClick={() => openEdit(g)}
                            >
                              <Pencil aria-hidden="true" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Delete ${g.name}`}
                              className="text-danger hover:bg-danger-subtle hover:text-danger"
                              onClick={() => setConfirmId(g.id)}
                            >
                              <Trash2 aria-hidden="true" />
                            </Button>
                          </TableActions>
                        </TableCell>
                       </TableRow>
                    ));
                  })()}
                </TableBody>
              </Table>
            </div>
          </TableContainer>
        )}

        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            {!showAll && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Halaman sebelumnya"
                      disabled={safePage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft aria-hidden="true" />
                    </Button>
                  </PaginationItem>
                  {showLeftEllipsis && (
                    <PaginationItem>
                      <PaginationLink
                        onClick={() => setCurrentPage(1)}
                        aria-label="Halaman 1"
                      >
                        1
                      </PaginationLink>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  {pages.map((p) => (
                    <PaginationItem key={p}>
                      <PaginationLink
                        isActive={p === safePage}
                        onClick={() => setCurrentPage(p)}
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  {showRightEllipsis && (
                    <PaginationItem>
                      <PaginationEllipsis />
                      <PaginationLink
                        onClick={() => setCurrentPage(totalPages)}
                        aria-label={`Halaman ${totalPages}`}
                      >
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  )}
                  <PaginationItem>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Halaman berikutnya"
                      disabled={safePage >= totalPages}
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                    >
                      <ChevronRight aria-hidden="true" />
                    </Button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (showAll) {
                  setShowAll(false);
                  setCurrentPage(1);
                } else {
                  setShowAll(true);
                }
              }}
            >
              {showAll ? "Tampilkan Per Halaman" : "Tampilkan Semua"}
            </Button>
          </div>
        )}

        <Modal open={!!form} onOpenChange={(o) => !o && setForm(null)}>
          <ModalContent aria-describedby={undefined} onOpenAutoFocus={focusNameOnOpen}>
            <ModalHeader
              title={form?.id ? "Edit Tamu" : "Tambah Tamu"}
              description={
                form?.id
                  ? "Perbarui detail tamu ini."
                  : "Tambahkan tamu baru ke daftar."
              }
              onClose={() => setForm(null)}
            />
            {form && (
              <form onSubmit={submitForm}>
                <ModalBody>
                  <Field label="Nama" htmlFor="guest-name">
                    <Input
                      id="guest-name"
                      ref={nameInputRef}
                      value={form.name}
                      error={!!formError}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </Field>
                  <Field label="Alamat" htmlFor="guest-address">
                    <Input
                      id="guest-address"
                      value={form.address}
                      onChange={(e) =>
                        setForm({ ...form, address: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Jumlah Orang" htmlFor="guest-pax">
                    <Select
                      value={String(form.pax)}
                      onValueChange={(v) =>
                        setForm({ ...form, pax: Number(v) })
                      }
                    >
                      <SelectTrigger id="guest-pax">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAX_OPTIONS.map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Party" htmlFor="guest-party">
                    <Select
                      value={form.partyId}
                      onValueChange={(v) => setForm({ ...form, partyId: v })}
                    >
                      <SelectTrigger id="guest-party">
                        <SelectValue placeholder="Pilih party" />
                      </SelectTrigger>
                      <SelectContent>
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
                  </Field>
                  <Field label="Group" htmlFor="guest-group">
                    <Select
                      value={form.groupId}
                      onValueChange={(v) => setForm({ ...form, groupId: v })}
                    >
                      <SelectTrigger id="guest-group">
                        <SelectValue placeholder="Pilih group" />
                      </SelectTrigger>
                      <SelectContent>
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
                  </Field>
                  {dupId ? (
                    <Alert variant="error">
                      <p>Tamu dengan nama ini sudah ada.</p>
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="mt-1 px-0 text-xs"
                        onClick={viewExisting}
                      >
                        Lihat di daftar →
                      </Button>
                    </Alert>
                  ) : (
                    formError && <Alert variant="error">{formError}</Alert>
                  )}
                </ModalBody>
                <ModalFooter>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setForm(null)}
                  >
                    Batal
                  </Button>
                  <Button type="submit" loading={saving}>
                    Simpan
                  </Button>
                </ModalFooter>
              </form>
            )}
          </ModalContent>
        </Modal>

        <Modal
          open={!!confirmId}
          onOpenChange={(o) => !o && setConfirmId(null)}
        >
          <ModalContent size="sm" aria-describedby={undefined}>
            <ModalHeader
              title="Hapus tamu?"
              description="Tindakan ini tidak dapat dibatalkan."
            />
            <ModalFooter>
              <Button variant="secondary" onClick={() => setConfirmId(null)}>
                Batal
              </Button>
              <Button variant="danger" loading={deleting} onClick={confirmDelete}>
                Hapus
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </main>

      {/* Mobile-only sticky action bar; sm+ shows actions in the TopBar.
          Sits above the 56px bottom nav (bottom-14), which is hidden on lg. */}
      <div className="fixed bottom-14 left-0 right-0 z-20 flex justify-end gap-2 border-t border-subtle bg-surface-2 p-3 sm:hidden">
        {topActions}
      </div>
    </>
  );
}
