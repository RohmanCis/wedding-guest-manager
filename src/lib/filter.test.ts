import { describe, it, expect, beforeEach } from "vitest";
import { resetDb } from "@/lib/db";
import { createGuest, listGuests } from "@/lib/guests";
import { parties, groups } from "@/lib/categories";

beforeEach(async () => {
  await resetDb();
});

async function seed() {
  const ps = await parties.list();
  const gs = await groups.list();
  await createGuest({ name: "Budi Santoso", address: "A", partyId: ps[0].id, groupId: gs[0].id });
  await createGuest({ name: "Ani Wijaya", address: "B", partyId: ps[1].id, groupId: gs[1].id });
  await createGuest({ name: "Citra Budi", address: "C", partyId: ps[0].id, groupId: gs[1].id });
  return { ps, gs };
}

describe("search and filtering", () => {
  it("searches by name case-insensitively", async () => {
    await seed();
    expect((await listGuests({ search: "budi" })).length).toBe(2);
  });

  it("filters by party", async () => {
    const { ps } = await seed();
    expect((await listGuests({ partyId: ps[0].id })).length).toBe(2);
  });

  it("filters by group", async () => {
    const { gs } = await seed();
    expect((await listGuests({ groupId: gs[1].id })).length).toBe(2);
  });

  it("combines search + party", async () => {
    const { ps } = await seed();
    expect((await listGuests({ search: "budi", partyId: ps[0].id })).length).toBe(2);
  });

  it("combines search + group", async () => {
    const { gs } = await seed();
    expect((await listGuests({ search: "citra", groupId: gs[1].id })).length).toBe(1);
  });

  it("combines search + party + group", async () => {
    const { ps, gs } = await seed();
    expect((await listGuests({ search: "budi", partyId: ps[0].id, groupId: gs[0].id })).length).toBe(1);
  });

  it("returns empty when no match", async () => {
    await seed();
    expect((await listGuests({ search: "zzz" })).length).toBe(0);
  });

  it("reset filters returns the full set", async () => {
    await seed();
    expect((await listGuests({ search: "budi" })).length).toBe(2);
    expect((await listGuests({})).length).toBe(3);
  });
});
