"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/loading";
import { TopBar } from "@/components/app-shell";
import { AnalyticsBarChart } from "@/components/analytics-bar-chart";
import { motion, AnimatePresence } from "motion/react";
import { useAnalyticsData } from "@/hooks/use-analytics-data";
import type { AnalyticsGuest } from "@/hooks/use-analytics-data";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { getVariants } from "@/lib/animation-variants";
import { Search, RotateCcw, ChevronDown } from "lucide-react";

interface Ref {
  id: string;
  name: string;
}

const ALL = "__all__";

export default function AnalyticsView({
  initialParties,
  initialGroups,
  initialGuests
}: {
  initialParties: Ref[];
  initialGroups: Ref[];
  initialGuests: AnalyticsGuest[];
}) {
  const [search, setSearch] = useState("");
  const [partyId, setPartyId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [mode, setMode] = useState<"party" | "group">("party");
  const [parties, setParties] = useState<Ref[]>(initialParties);
  const [groups, setGroups] = useState<Ref[]>(initialGroups);

  // Debounce the query fed to the hook; input value stays immediate.
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { isLoading, error, totalGuests, byParty, byGroup } =
    useAnalyticsData({
      search: debouncedSearch,
      partyId,
      groupId,
      initialGuests
    });

  const isMobile = useIsMobile();
  const reducedMotion = useReducedMotion();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const hasFilter = !!(search.trim() || partyId || groupId);
  const data = mode === "party" ? byParty : byGroup;

  const filterFields = (
    <>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
        <Input
          aria-label="Cari nama"
          className="pl-9"
          placeholder="Cari nama..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <Select
        value={partyId || ALL}
        onValueChange={(v) => setPartyId(v === ALL ? "" : v)}
      >
        <SelectTrigger aria-label="Filter party" className="w-full">
          <SelectValue placeholder="Party" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Semua party</SelectItem>
          {parties.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={groupId || ALL}
        onValueChange={(v) => setGroupId(v === ALL ? "" : v)}
      >
        <SelectTrigger aria-label="Filter group" className="w-full">
          <SelectValue placeholder="Group" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Semua group</SelectItem>
          {groups.map((g) => (
            <SelectItem key={g.id} value={g.id}>
              {g.name}
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
      <p className="text-sm text-secondary">Menampilkan {totalGuests} tamu</p>
    </>
  );

  function resetFilters() {
    setSearch("");
    setPartyId("");
    setGroupId("");
  }

  return (
    <>
      <TopBar>
        <h1 className="text-base font-semibold text-accent-cream">Analitik</h1>
      </TopBar>
      <motion.main
        variants={getVariants(!!reducedMotion)}
        initial={false}
        animate="animate"
        className="p-6"
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card variant="flat" className="p-4 lg:col-span-1">
            {isMobile ? (
              <div>
                <button
                  type="button"
                  aria-expanded={filtersOpen}
                  onClick={() => setFiltersOpen((o) => !o)}
                  className="flex w-full items-center justify-between text-sm font-medium text-secondary"
                >
                  Filter
                  <motion.span
                    animate={{ rotate: filtersOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="inline-flex"
                  >
                    <ChevronDown className="size-4" aria-hidden="true" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {filtersOpen && (
                    <motion.div
                      key="filters"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{
                        duration: reducedMotion ? 0 : 0.22,
                        ease: "easeOut"
                      }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-4 pt-4">{filterFields}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="space-y-4">{filterFields}</div>
            )}
          </Card>

          <Card variant="elevated" className="min-h-[320px] p-4 lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-accent-cream">
                Distribusi Tamu
              </h2>
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
            </div>

            {error ? (
              <div className="mt-4">
                <Alert variant="error">{error}</Alert>
              </div>
            ) : isLoading ? (
              <div
                className="flex min-h-[320px] items-center justify-center"
                role="status"
                aria-label="Memuat analitik"
              >
                <Spinner className="size-6" />
              </div>
            ) : totalGuests === 0 ? (
              <div className="mt-4">
                <EmptyState
                  variant="no-results"
                  title="Tidak ada tamu ditemukan."
                />
              </div>
            ) : (
              <div className="mt-4">
                <AnalyticsBarChart data={data} mode={mode} />
              </div>
            )}
          </Card>
        </div>
      </motion.main>
    </>
  );
}
