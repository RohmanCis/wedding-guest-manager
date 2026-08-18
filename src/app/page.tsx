"use client";

import { useEffect, useState, useCallback } from "react";
import { apiGet, apiSend, ApiError } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter
} from "@/components/ui/modal";
import { Alert } from "@/components/ui/alert";
import {
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableActions,
  MotionTableRow
} from "@/components/ui/table";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/loading";
import { CategoryBadge, CategoryDot } from "@/components/ui/category-badge";
import { colorFor } from "@/lib/party-colors";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { TopBar } from "@/components/app-shell";
import { motion, AnimatePresence } from "motion/react";
import { getVariants, getRowVariants } from "@/lib/animation-variants";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useIsMobile } from "@/hooks/use-is-mobile";
import {
  Search,
  Plus,
  ChevronDown,
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
  party_name: string;
  group_name: string;
}
interface FormState {
  id?: string;
  name: string;
  address: string;
  partyId: string;
  groupId: string;
}

const EMPTY: FormState = { name: "", address: "", partyId: "", groupId: "" };
const ALL = "__all__";

export default function GuestsPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [parties, setParties] = useState<Ref[]>([]);
  const [groups, setGroups] = useState<Ref[]>([]);
  const [search, setSearch] = useState("");
  const [partyId, setPartyId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState | null>(null);
  const [formError, setFormError] = useState("");
  const [dupId, setDupId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [newGuestId, setNewGuestId] = useState<string | null>(null);
  const reducedMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const [currentPage, setCurrentPage] = useState(1);
  const [showAll, setShowAll] = useState(false);

  const totalPages = Math.max(1, Math.ceil(guests.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
    currentPage: safePage,
    totalPages,
    paginationItemsToDisplay: isMobile ? 5 : 7
  });
  const pageGuests = showAll
    ? guests
    : guests.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
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

  const loadGuests = useCallback(async () => {
    setLoading(true);
    setError("");
    const qs = new URLSearchParams();
    if (search.trim()) qs.set("search", search.trim());
    if (partyId) qs.set("partyId", partyId);
    if (groupId) qs.set("groupId", groupId);
    try {
      const data = await apiGet<{ guests: Guest[] }>(`/api/guests?${qs}`);
      setGuests(data.guests);
    } catch (e: any) {
      setError(e.message || "Failed to load guests.");
    } finally {
      setLoading(false);
    }
  }, [search, partyId, groupId]);

  useEffect(() => {
    loadRefs();
  }, [loadRefs]);

  useEffect(() => {
    loadGuests();
  }, [loadGuests]);

  // Reset pagination whenever the active filter set changes.
  useEffect(() => {
    setCurrentPage(1);
    setShowAll(false);
  }, [search, partyId, groupId]);

  // BR-007: scroll the duplicate's existing row into view and highlight it.
  // If the target is filtered onto another page, jump to that page first so the
  // row exists on the current view (effect re-runs after page state settles).
  useEffect(() => {
    if (!highlightId || loading) return;
    const idx = guests.findIndex((g) => g.id === highlightId);
    if (idx === -1) {
      setHighlightId(null);
      return;
    }
    if (
      !showAll &&
      (idx < (safePage - 1) * PAGE_SIZE || idx >= safePage * PAGE_SIZE)
    ) {
      setCurrentPage(Math.floor(idx / PAGE_SIZE) + 1);
      return;
    }
    const el = document.getElementById(`guest-row-${highlightId}`);
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    const t = setTimeout(() => setHighlightId(null), 2400);
    return () => clearTimeout(t);
  }, [highlightId, loading, guests, safePage, showAll]);

  // Newly created guest: ensure its flash row is on the visible page.
  useEffect(() => {
    if (!newGuestId || loading) return;
    const idx = guests.findIndex((g) => g.id === newGuestId);
    if (idx === -1) return;
    if (
      !showAll &&
      (idx < (safePage - 1) * PAGE_SIZE || idx >= safePage * PAGE_SIZE)
    ) {
      setCurrentPage(Math.floor(idx / PAGE_SIZE) + 1);
    }
  }, [newGuestId, loading, guests, safePage, showAll]);

  const hasFilter = !!(search.trim() || partyId || groupId);

  function resetFilters() {
    setSearch("");
    setPartyId("");
    setGroupId("");
  }

  function buildCsvUrl(scope: "all" | "filtered") {
    const qs = new URLSearchParams();
    qs.set("csv", "1");
    qs.set("scope", scope);
    if (scope === "filtered") {
      if (search.trim()) qs.set("search", search.trim());
      if (partyId) qs.set("partyId", partyId);
      if (groupId) qs.set("groupId", groupId);
    }
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

  function openEdit(g: Guest) {
    setFormError("");
    setDupId(null);
    setForm({
      id: g.id,
      name: g.name,
      address: g.address,
      partyId: g.party_id,
      groupId: g.group_id
    });
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
      await Promise.all([loadRefs(), loadGuests()]);
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
    setHighlightId(target);
  }

  async function confirmDelete() {
    if (!confirmId) return;
    setDeleting(true);
    try {
      await apiSend(`/api/guests?id=${confirmId}`, "DELETE");
      setConfirmId(null);
      await Promise.all([loadRefs(), loadGuests()]);
    } finally {
      setDeleting(false);
    }
  }

  const total = parties.reduce((sum, p) => sum + (p.used ?? 0), 0);

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
      <Button size="sm" onClick={openAdd}>
        <Plus aria-hidden="true" />
        Tambah Tamu
      </Button>
    </>
  );

  return (
    <>
      <TopBar>
        <h1 className="text-base font-semibold text-accent-cream">Tamu</h1>
        <div className="hidden items-center gap-2 sm:flex">{topActions}</div>
      </TopBar>

      <motion.main
        variants={getVariants(!!reducedMotion)}
        initial="initial"
        animate="animate"
        className="space-y-5 p-6 pb-24 sm:pb-6"
      >
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
          {parties.map((p) => (
            <StatCard
              key={p.id}
              label={p.name}
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

        {!loading && guests.length > 0 && (
          <p className="text-xs text-muted">
            Menampilkan{" "}
            {showAll
              ? `semua ${guests.length} tamu`
              : `${start}–${end} dari ${guests.length} tamu`}
          </p>
        )}

        {error && <Alert variant="error">{error}</Alert>}

        {loading ? (
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
                    <TableHead>Nama</TableHead>
                    <TableHead className="hidden sm:table-cell">Alamat</TableHead>
                    <TableHead>Party</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead className="w-px">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence initial={false} mode="wait">
                    {pageGuests.map((g, i) => (
                      <MotionTableRow
                        key={newGuestId === g.id ? `${g.id}-new` : g.id}
                        id={`guest-row-${g.id}`}
                        initial={getRowVariants(!!reducedMotion).initial}
                        animate={{
                          ...getRowVariants(!!reducedMotion).animate,
                          ...(newGuestId === g.id
                            ? {
                                backgroundColor: [
                                  "rgba(201, 168, 76, 0.12)",
                                  "rgba(201, 168, 76, 0)"
                                ]
                              }
                            : {})
                        }}
                        exit={getRowVariants(!!reducedMotion).exit}
                        transition={
                          newGuestId === g.id
                            ? { duration: 1.5, ease: "easeOut" }
                            : getRowVariants(!!reducedMotion).animate.transition
                        }
                        onAnimationComplete={() => {
                          if (newGuestId === g.id) setNewGuestId(null);
                        }}
                        className={cn(
                          highlightId === g.id &&
                            "bg-accent-gold-subtle hover:bg-accent-gold-subtle"
                        )}
                      >
                        <TableCell className="text-muted tabular-nums">
                          {showAll ? i + 1 : (safePage - 1) * PAGE_SIZE + i + 1}
                        </TableCell>
                        <TableCell className="font-medium">{g.name}</TableCell>
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
                      </MotionTableRow>
                    ))}
                  </AnimatePresence>
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
          <ModalContent aria-describedby={undefined}>
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
      </motion.main>

      {/* Mobile-only sticky action bar; sm+ shows actions in the TopBar.
          Sits above the 56px bottom nav (bottom-14), which is hidden on lg. */}
      <div className="fixed bottom-14 left-0 right-0 z-20 flex justify-end gap-2 border-t border-subtle bg-surface-2 p-3 sm:hidden">
        {topActions}
      </div>
    </>
  );
}
