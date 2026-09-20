import { describe, it, expect } from "vitest";
import { groupGuests } from "./group-guests";

interface G {
  id: string;
  name: string;
  party_name: string;
  group_name: string;
}

function g(partial: Partial<G> & { id: string }): G {
  return { name: partial.id, party_name: "", group_name: "", ...partial };
}

const fixtures: G[] = [
  g({ id: "a", party_name: "Keluarga", group_name: "Teman" }),
  g({ id: "b", party_name: "Kantor", group_name: "Keluarga" }),
  g({ id: "c", party_name: "Keluarga", group_name: "Teman" }),
  g({ id: "d", party_name: "Tetangga", group_name: "Keluarga" })
];

describe("groupGuests — sectioning", () => {
  it("emits every guest exactly once across all sections", () => {
    const ids = groupGuests(fixtures, "party", ["Keluarga", "Kantor", "Tetangga"])
      .flatMap((s) => s.guests.map((x) => x.id))
      .sort();
    expect(ids).toEqual(["a", "b", "c", "d"]);
  });

  it("section guest counts sum to the input length", () => {
    const sum = groupGuests(fixtures, "party", ["Keluarga", "Kantor", "Tetangga"]).reduce(
      (n, s) => n + s.guests.length,
      0
    );
    expect(sum).toBe(fixtures.length);
  });

  it("never emits a section for a category with zero matching guests", () => {
    const sections = groupGuests(fixtures, "party", [
      "Keluarga",
      "Kosong",
      "Kantor",
      "Tetangga"
    ]);
    expect(sections.map((s) => s.name)).toEqual(["Keluarga", "Kantor", "Tetangga"]);
  });

  it("orders sections by categoryNames, not by guest appearance", () => {
    const sections = groupGuests(fixtures, "party", ["Tetangga", "Kantor", "Keluarga"]);
    expect(sections.map((s) => s.name)).toEqual(["Tetangga", "Kantor", "Keluarga"]);
  });

  it("preserves input order within a section", () => {
    const sections = groupGuests(fixtures, "party", ["Keluarga", "Kantor", "Tetangga"]);
    expect(sections[0].guests.map((x) => x.id)).toEqual(["a", "c"]);
  });

  it("groups by party_name in party mode and group_name in group mode", () => {
    expect(
      groupGuests(fixtures, "party", ["Keluarga", "Kantor", "Tetangga"]).map(
        (s) => s.name
      )
    ).toEqual(["Keluarga", "Kantor", "Tetangga"]);
    expect(
      groupGuests(fixtures, "group", ["Teman", "Keluarga"]).map((s) => s.name)
    ).toEqual(["Teman", "Keluarga"]);
  });

  it("appends unknown category names as trailing sections, keeping their guests", () => {
    const sections = groupGuests(fixtures, "party", ["Keluarga"]);
    expect(sections.map((s) => s.name)).toEqual(["Keluarga", "Kantor", "Tetangga"]);
    expect(sections.flatMap((s) => s.guests.map((x) => x.id)).sort()).toEqual([
      "a",
      "b",
      "c",
      "d"
    ]);
  });

  it("returns an empty array for empty input", () => {
    expect(groupGuests([], "party", ["Keluarga"])).toEqual([]);
  });
});
