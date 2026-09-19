import { describe, it, expect } from "vitest";
import {
  sortGuests,
  DEFAULT_SORT,
  SORT_KEYS,
  SORT_COLUMN_LABELS,
  isDefaultSort,
  sortDirectionWord,
  sortDescription,
  sortAnnouncement,
  type SortableGuest,
  type SortKey,
  type SortState
} from "./guest-sort";

function g(partial: Partial<SortableGuest>): SortableGuest {
  return { name: "", pax: 1, party_name: "", group_name: "", ...partial };
}

describe("sortGuests — pax numeric", () => {
  it("sorts pax numerically ascending (2 before 10)", () => {
    const rows = [g({ name: "Zed", pax: 10 }), g({ name: "Ana", pax: 2 })];
    expect(
      sortGuests(rows, { key: "pax", dir: "asc" }).map((r) => r.name)
    ).toEqual(["Ana", "Zed"]);
  });

  it("sorts pax numerically descending (10 before 2)", () => {
    const rows = [g({ name: "Ana", pax: 2 }), g({ name: "Zed", pax: 10 })];
    expect(
      sortGuests(rows, { key: "pax", dir: "desc" }).map((r) => r.name)
    ).toEqual(["Zed", "Ana"]);
  });

  it("breaks pax ties on name asc regardless of direction", () => {
    const rows = [g({ name: "Budi", pax: 1 }), g({ name: "Ani", pax: 1 })];
    expect(
      sortGuests(rows, { key: "pax", dir: "desc" }).map((r) => r.name)
    ).toEqual(["Ani", "Budi"]);
    expect(
      sortGuests(rows, { key: "pax", dir: "asc" }).map((r) => r.name)
    ).toEqual(["Ani", "Budi"]);
  });
});

describe("sortGuests — string keys", () => {
  it("sorts names with the id locale, not byte order", () => {
    const rows = [g({ name: "Zaki" }), g({ name: "Élan" })];
    expect(
      sortGuests(rows, { key: "name", dir: "asc" }).map((r) => r.name)
    ).toEqual(["Élan", "Zaki"]);
  });

  it("reverses direction for string keys", () => {
    const rows = [g({ name: "Ani" }), g({ name: "Budi" })];
    expect(
      sortGuests(rows, { key: "name", dir: "desc" }).map((r) => r.name)
    ).toEqual(["Budi", "Ani"]);
  });

  it("sorts by party_name and group_name", () => {
    const rows = [
      g({ name: "X", party_name: "Keluarga", group_name: "Teman" }),
      g({ name: "Y", party_name: "Kantor", group_name: "Keluarga" })
    ];
    expect(
      sortGuests(rows, { key: "party_name", dir: "asc" }).map((r) => r.party_name)
    ).toEqual(["Kantor", "Keluarga"]);
    expect(
      sortGuests(rows, { key: "group_name", dir: "asc" }).map((r) => r.group_name)
    ).toEqual(["Keluarga", "Teman"]);
  });

  it("breaks category ties on name asc", () => {
    const rows = [
      g({ name: "Zaki", party_name: "Keluarga" }),
      g({ name: "Ani", party_name: "Keluarga" })
    ];
    expect(
      sortGuests(rows, { key: "party_name", dir: "asc" }).map((r) => r.name)
    ).toEqual(["Ani", "Zaki"]);
  });
});

describe("sortGuests — contract", () => {
  it("returns a new array without mutating the input", () => {
    const rows = [g({ name: "B" }), g({ name: "A" })];
    const sorted = sortGuests(rows, { key: "name", dir: "asc" });
    expect(sorted.map((r) => r.name)).toEqual(["A", "B"]);
    expect(rows.map((r) => r.name)).toEqual(["B", "A"]);
  });

  it("handles the empty array", () => {
    expect(sortGuests([], { key: "pax", dir: "desc" })).toEqual([]);
  });

  it("default sort is name asc and SORT_KEYS covers exactly the four columns", () => {
    const rows = [g({ name: "Budi" }), g({ name: "Ani" })];
    expect(sortGuests(rows, DEFAULT_SORT).map((r) => r.name)).toEqual([
      "Ani",
      "Budi"
    ]);
    expect(SORT_KEYS).toEqual(["name", "pax", "party_name", "group_name"]);
  });
});

describe("sort wording — labels and default detection", () => {
  it("uses the Indonesian header labels", () => {
    expect(SORT_COLUMN_LABELS).toEqual({
      name: "Nama",
      pax: "Jumlah",
      party_name: "Party",
      group_name: "Group"
    });
    expect(SORT_COLUMN_LABELS[SORT_KEYS[0]]).toBe("Nama");
  });

  it("treats name asc as default and any other state as non-default", () => {
    expect(isDefaultSort(DEFAULT_SORT)).toBe(true);
    expect(isDefaultSort({ key: "name", dir: "desc" })).toBe(false);
    expect(isDefaultSort({ key: "pax", dir: "asc" })).toBe(false);
    expect(isDefaultSort({ key: "party_name", dir: "desc" })).toBe(false);
    expect(isDefaultSort({ key: "group_name", dir: "asc" })).toBe(false);
  });
});

describe("sortDirectionWord — per column × direction", () => {
  const textKeys: SortKey[] = ["name", "party_name", "group_name"];
  const cases: Array<[SortState, string]> = [
    ...textKeys.map((key) => [{ key, dir: "asc" }, "A–Z"] as [SortState, string]),
    ...textKeys.map((key) => [{ key, dir: "desc" }, "Z–A"] as [SortState, string]),
    [{ key: "pax", dir: "asc" }, "1→4"],
    [{ key: "pax", dir: "desc" }, "4→1"]
  ];

  it.each(cases)("maps each column × direction", (sort, word) => {
    expect(sortDirectionWord(sort)).toBe(word);
  });
});

describe("sortDescription — visible count-line suffix", () => {
  it("is empty at the default sort state", () => {
    expect(sortDescription(DEFAULT_SORT)).toBe("");
  });

  it.each([
    [{ key: "pax", dir: "asc" }, "Terurut: Jumlah (1→4)"],
    [{ key: "pax", dir: "desc" }, "Terurut: Jumlah (4→1)"],
    [{ key: "name", dir: "desc" }, "Terurut: Nama (Z–A)"],
    [{ key: "party_name", dir: "asc" }, "Terurut: Party (A–Z)"],
    [{ key: "party_name", dir: "desc" }, "Terurut: Party (Z–A)"],
    [{ key: "group_name", dir: "asc" }, "Terurut: Group (A–Z)"],
    [{ key: "group_name", dir: "desc" }, "Terurut: Group (Z–A)"]
  ] as Array<[SortState, string]>)("builds the visible suffix", (sort, text) => {
    expect(sortDescription(sort)).toBe(text);
  });
});

describe("sortAnnouncement — aria-live text", () => {
  it("announces the default order after a reset (never empty)", () => {
    expect(sortAnnouncement(DEFAULT_SORT)).toBe(
      "Terurut berdasarkan Nama, menaik"
    );
  });

  it.each([
    [{ key: "name", dir: "desc" }, "Terurut berdasarkan Nama, menurun"],
    [{ key: "pax", dir: "asc" }, "Terurut berdasarkan Jumlah, menaik"],
    [{ key: "pax", dir: "desc" }, "Terurut berdasarkan Jumlah, menurun"],
    [{ key: "party_name", dir: "asc" }, "Terurut berdasarkan Party, menaik"],
    [{ key: "party_name", dir: "desc" }, "Terurut berdasarkan Party, menurun"],
    [{ key: "group_name", dir: "asc" }, "Terurut berdasarkan Group, menaik"],
    [{ key: "group_name", dir: "desc" }, "Terurut berdasarkan Group, menurun"]
  ] as Array<[SortState, string]>)("builds the spoken announcement", (sort, text) => {
    expect(sortAnnouncement(sort)).toBe(text);
  });
});
