"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/client";
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
import { PieChart } from "@/components/charts/pie-chart";
import { PieSlice } from "@/components/charts/pie-slice";
import { PieCenter } from "@/components/charts/pie-center";
import { motion, AnimatePresence } from "framer-motion";
import { useAnalyticsData } from "@/hooks/use-analytics-data";
import { colorForGroup } from "@/lib/party-colors";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { getVariants } from "@/lib/animation-variants";
import { Search, RotateCcw, ChevronDown } from "lucide-react";

interface Ref {
  id: string;
  name: string;
}

const ALL = "__all__";

export default function AnalyticsPage() {
  const [search, setSearch] = useState("");
  const [partyId, setPartyId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [mode, setMode] = useState<"party" | "group">("party");
  const [parties, setParties] = useState<Ref[]>([]);
  const [groups, setGroups] = useState<Ref[]>([]);
  const [refsError, setRefsError] = useState("");

  useEffect(() => {
    apiGet<{ parties: Ref[]; groups: Ref[] }>("/api/categories")
      .then((d) => {
        setParties(d.parties);
        setGroups(d.groups);
      })
      .catch((e: unknown) =>
        setRefsError(
          e instanceof Error ? e.message : "Failed to load categories."
        )
      );
  }, []);

  // Debounce the query fed to the hook; input value stays immediate.
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { isLoading, error, totalGuests, byParty, byGroup } =
    useAnalyticsData({ search: debouncedSearch, partyId, groupId });

  const isMobile = useIsMobile();
  const reducedMotion = useReducedMotion();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const hasFilter = !!(search.trim() || partyId || groupId);
  const data = mode === "party" ? byParty : byGroup;
  const maxGroup = byGroup.reduce((m, d) => Math.max(m, d.value), 0);

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
        initial="initial"
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

            {error || refsError ? (
              <div className="mt-4">
                <Alert variant="error">{error || refsError}</Alert>
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
            ) : mode === "group" ? (
              <div className="mt-4 space-y-3">
                {byGroup.map((d, index) => (
                  <div key={d.label} className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-2 text-sm text-primary">
                        <span
                          aria-hidden="true"
                          className="size-2 shrink-0 rounded-full"
                          style={{
                            backgroundColor: colorForGroup(d.label).dot
                          }}
                        />
                        <span className="truncate">{d.label}</span>
                      </span>
                      <span className="text-xs text-muted">{d.value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-surface-3">
                      <motion.div
                        className="h-2 rounded-full bg-accent-gold"
                        initial={{ width: "0%" }}
                        animate={{
                          width: `${maxGroup ? (d.value / maxGroup) * 100 : 0}%`
                        }}
                        transition={{
                          duration: reducedMotion ? 0 : 0.6,
                          ease: "easeOut",
                          delay: reducedMotion ? 0 : index * 0.05
                        }}
                      />
                    </div>
                  </div>
                ))}
                <p className="text-xs text-secondary">{totalGuests} tamu</p>
              </div>
            ) : (
              <div className="mt-4 flex justify-center">
                <div className="w-full max-w-[280px]">
                  <PieChart
                    data={data}
                    size={isMobile ? undefined : 280}
                    innerRadius={80}
                    padAngle={0.02}
                    cornerRadius={4}
                  >
                  {data.map((d, i) => (
                    <PieSlice
                      key={d.label}
                      index={i}
                      hoverEffect="translate"
                      showGlow={true}
                    />
                  ))}
                  <PieCenter defaultLabel="Total Tamu">
                    {({ value, label }) => (
                      <div className="flex min-w-0 flex-col items-center text-center">
                        <span className="text-2xl font-semibold tabular-nums text-accent-cream">
                          {value}
                        </span>
                        <span className="max-w-full truncate text-xs font-medium text-secondary">
                          {label}
                        </span>
                      </div>
                    )}
                  </PieCenter>
                  </PieChart>
                </div>
                <table className="sr-only" aria-label="Guest distribution data">
                  <thead>
                    <tr>
                      <th scope="col">Nama</th>
                      <th scope="col">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((d) => (
                      <tr key={d.label}>
                        <td>{d.label}</td>
                        <td>{d.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </motion.main>
    </>
  );
}
