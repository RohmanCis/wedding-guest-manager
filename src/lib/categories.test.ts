import { describe, it, expect, beforeEach } from "vitest";
import { resetDb } from "@/lib/db";
import { createGuest, exportGuestsCsv } from "@/lib/guests";
import { parties, groups } from "@/lib/categories";
import { ValidationError, NotFoundError } from "@/lib/normalize";

beforeEach(() => resetDb());

function seed() {
  const ps = parties.list();
  const gs = groups.list();
  const groom = ps.find((p) => p.name === "Groom")!;
  const bride = ps.find((p) => p.name === "Bride")!;
  createGuest({ name: "Budi Santoso", address: "A, line", partyId: groom.id, groupId: gs[0].id });
  createGuest({ name: "Ani Wijaya", address: "B", partyId: bride.id, groupId: gs[1].id });
  return { ps, gs, groom, bride };
}

describe("category management", () => {
  it("creates and renames a party", () => {
    const p = parties.create("Custom Party");
    expect(parties.list().some((x) => x.id === p.id)).toBe(true);
    const renamed = parties.rename(p.id, "Custom Party 2");
    expect(renamed.name).toBe("Custom Party 2");
  });

  it("creates and renames a group", () => {
    const g = groups.create("Custom Group");
    const renamed = groups.rename(g.id, "Custom Group 2");
    expect(renamed.name).toBe("Custom Group 2");
  });

  it("prevents deleting a referenced party", () => {
    const { ps, gs } = seed();
    expect(() => parties.remove(ps[0].id)).toThrow(ValidationError);
  });

  it("prevents deleting a referenced group", () => {
    const { ps, gs } = seed();
    expect(() => groups.remove(gs[0].id)).toThrow(ValidationError);
  });

  it("allows deleting an unused party", () => {
    const p = parties.create("Unused");
    parties.remove(p.id);
    expect(parties.list().some((x) => x.id === p.id)).toBe(false);
  });

  it("prevents duplicate category names", () => {
    parties.create("Dup");
    expect(() => parties.create("Dup")).toThrow(ValidationError);
  });
});

describe("CSV export", () => {
  it("export all includes every guest with correct columns", () => {
    const { ps, gs } = seed();
    const csv = exportGuestsCsv();
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe("Name,Address,Party,Group");
    expect(lines.length).toBe(3);
    expect(csv).toContain("Budi Santoso");
  });

  it("filtered export includes only matching records", () => {
    const { groom } = seed();
    const csv = exportGuestsCsv({ partyId: groom.id });
    const lines = csv.split("\r\n");
    expect(lines.length).toBe(2); // header + Budi (only Groom guest)
    expect(csv).not.toContain("Ani Wijaya");
  });

  it("escapes commas and quotes", () => {
    seed();
    const csv = exportGuestsCsv();
    expect(csv).toContain('"A, line"');
  });

  it("empty filtered result exports valid header", () => {
    seed();
    const csv = exportGuestsCsv({ search: "zzz" });
    expect(csv).toBe("Name,Address,Party,Group");
  });
});
