import { describe, it, expect, beforeEach } from "vitest";
import { resetDb } from "@/lib/db";
import { createGuest, listGuests } from "@/lib/guests";
import { parties, groups } from "@/lib/categories";

beforeEach(() => resetDb());

function seed() {
  const ps = parties.list();
  const gs = groups.list();
  createGuest({ name: "Budi Santoso", address: "A", partyId: ps[0].id, groupId: gs[0].id });
  createGuest({ name: "Ani Wijaya", address: "B", partyId: ps[1].id, groupId: gs[1].id });
  createGuest({ name: "Citra Budi", address: "C", partyId: ps[0].id, groupId: gs[1].id });
  return { ps, gs };
}

describe("search and filtering", () => {
  it("searches by name case-insensitively", () => {
    seed();
    expect(listGuests({ search: "budi" }).length).toBe(2);
  });

  it("filters by party", () => {
    const { ps } = seed();
    expect(listGuests({ partyId: ps[0].id }).length).toBe(2);
  });

  it("filters by group", () => {
    const { gs } = seed();
    expect(listGuests({ groupId: gs[1].id }).length).toBe(2);
  });

  it("combines search + party", () => {
    const { ps } = seed();
    expect(listGuests({ search: "budi", partyId: ps[0].id }).length).toBe(2);
  });

  it("combines search + group", () => {
    const { gs } = seed();
    expect(listGuests({ search: "citra", groupId: gs[1].id }).length).toBe(1);
  });

  it("combines search + party + group", () => {
    const { ps, gs } = seed();
    expect(listGuests({ search: "budi", partyId: ps[0].id, groupId: gs[0].id }).length).toBe(1);
  });

  it("returns empty when no match", () => {
    seed();
    expect(listGuests({ search: "zzz" }).length).toBe(0);
  });
});
