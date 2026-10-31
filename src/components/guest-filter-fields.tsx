"use client";

import type { RefObject } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";
import { CategoryDot, CategoryIcon } from "@/components/ui/category-badge";
import { Search } from "lucide-react";

export interface FilterCategory {
  id: string;
  name: string;
}

/**
 * Radix Select cannot use "" as an item value, so the "no filter" choice
 * travels as `ALL` and maps back to "" at this seam.
 */
const ALL = "__all__";

export interface GuestFilterFieldsProps {
  search: string;
  partyId: string;
  groupId: string;
  onSearchChange: (value: string) => void;
  onPartyChange: (value: string) => void;
  onGroupChange: (value: string) => void;
  parties: FilterCategory[];
  groups: FilterCategory[];
  /** "inline" = responsive row (guests, daftar); "stacked" = full-width column (analytics card). */
  layout?: "inline" | "stacked";
  searchRef?: RefObject<HTMLInputElement>;
}

/**
 * The search + Party + Group controls, shared by all three filtered views.
 * Renders no wrapper: the caller owns the row/column layout, Reset, count line.
 */
export function GuestFilterFields({
  search,
  partyId,
  groupId,
  onSearchChange,
  onPartyChange,
  onGroupChange,
  parties,
  groups,
  layout = "inline",
  searchRef
}: GuestFilterFieldsProps) {
  const inline = layout === "inline";

  return (
    <>
      <div className={inline ? "relative w-full sm:w-auto" : "relative"}>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
        <Input
          ref={searchRef}
          aria-label="Cari nama"
          className={inline ? "w-full pl-9 sm:w-56" : "pl-9"}
          placeholder="Cari nama..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <Select
        value={partyId || ALL}
        onValueChange={(v) => onPartyChange(v === ALL ? "" : v)}
      >
        <SelectTrigger
          aria-label="Filter party"
          className={inline ? "w-full sm:w-44" : "w-full"}
        >
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
        onValueChange={(v) => onGroupChange(v === ALL ? "" : v)}
      >
        <SelectTrigger
          aria-label="Filter group"
          className={inline ? "w-full sm:w-44" : "w-full"}
        >
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
    </>
  );
}
