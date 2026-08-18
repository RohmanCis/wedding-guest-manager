import { describe, it, expect, beforeEach } from "vitest";
import { resetDb } from "@/lib/db";
import { createGuest, exportGuestsCsv } from "@/lib/guests";
import { parties, groups } from "@/lib/categories";
import { ValidationError } from "@/lib/normalize";

beforeEach(async () => {
  await resetDb();
});

async function seed() {
  const ps = await parties.list();
  const gs = await groups.list();
  const groom = ps.find((p) => p.name === "Groom")!;
  const bride = ps.find((p) => p.name === "Bride")!;
  await createGuest({ name: "Budi Santoso", address: "A, line", partyId: groom.id, groupId: gs[0].id });
  await createGuest({ name: "Ani Wijaya", address: "B", partyId: bride.id, groupId: gs[1].id });
  return { ps, gs, groom, bride };
}

describe("category management", () => {
  it("creates and renames a party", async () => {
    const p = await parties.create("Custom Party");
    expect((await parties.list()).some((x) => x.id === p.id)).toBe(true);
    const renamed = await parties.rename(p.id, "Custom Party 2");
    expect(renamed.name).toBe("Custom Party 2");
  });

  it("creates and renames a group", async () => {
    const g = await groups.create("Custom Group");
    const renamed = await groups.rename(g.id, "Custom Group 2");
    expect(renamed.name).toBe("Custom Group 2");
  });

  it("prevents deleting a referenced party", async () => {
    const { ps } = await seed();
    await expect(parties.remove(ps[0].id)).rejects.toThrow(ValidationError);
  });

  it("prevents deleting a referenced group", async () => {
    const { gs } = await seed();
    await expect(groups.remove(gs[0].id)).rejects.toThrow(ValidationError);
  });

  it("allows deleting an unused party", async () => {
    const p = await parties.create("Unused");
    await parties.remove(p.id);
    expect((await parties.list()).some((x) => x.id === p.id)).toBe(false);
  });

  it("prevents duplicate category names", async () => {
    await parties.create("Dup");
    await expect(parties.create("Dup")).rejects.toThrow(ValidationError);
  });
});

describe("CSV export", () => {
  it("export all includes every guest with correct columns", async () => {
    await seed();
    const csv = await exportGuestsCsv();
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe("Name,Address,Party,Group,Pax");
    expect(lines.length).toBe(3);
    expect(csv).toContain("Budi Santoso");
  });

  it("filtered export includes only matching records", async () => {
    const { groom } = await seed();
    const csv = await exportGuestsCsv({ partyId: groom.id });
    const lines = csv.split("\r\n");
    expect(lines.length).toBe(2); // header + Budi (only Groom guest)
    expect(csv).not.toContain("Ani Wijaya");
  });

  it("escapes commas and quotes", async () => {
    await seed();
    const csv = await exportGuestsCsv();
    expect(csv).toContain('"A, line"');
  });

  it("empty filtered result exports valid header", async () => {
    await seed();
    const csv = await exportGuestsCsv({ search: "zzz" });
    expect(csv).toBe("Name,Address,Party,Group,Pax");
  });
});
