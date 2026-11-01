import { describe, it, expect, beforeEach } from "vitest";
import { resetDb } from "@/lib/db";
import { parties, groups } from "@/lib/categories";
import { createGuest, exportGuestsCsv, csvCell } from "@/lib/guests";
import { filterForScope } from "@/lib/guest-filter";

beforeEach(async () => {
  await resetDb();
});

async function refs() {
  const ps = await parties.list();
  const gs = await groups.list();
  return { p: ps[0], g: gs[0] };
}

describe("csvCell escaping", () => {
  it("quotes a value and doubles embedded quotes", () => {
    expect(csvCell('Jl "Mawar"')).toBe('"Jl ""Mawar"""');
  });

  it("quotes a value containing a comma", () => {
    expect(csvCell("No 1, RT 2")).toBe('"No 1, RT 2"');
  });

  it("quotes values containing newlines", () => {
    expect(csvCell("a\nb")).toBe('"a\nb"');
    expect(csvCell("a\r\nb")).toBe('"a\r\nb"');
  });

  it("leaves a plain value unwrapped", () => {
    expect(csvCell("Jl Mawar")).toBe("Jl Mawar");
  });
});

describe("CSV export escaping (DB-backed)", () => {
  it("escapes quotes, commas, and newlines in an address", async () => {
    const { p, g } = await refs();
    await createGuest({
      name: "Budi",
      address: 'Jl "Mawar", No 1\nRT 2',
      partyId: p.id,
      groupId: g.id
    });
    const csv = await exportGuestsCsv();
    expect(csv).toContain('"Jl ""Mawar"", No 1\nRT 2"');
  });
});

describe("filterForScope in the export path (DB-backed)", () => {
  it("scope=all drops the search filter but a normal export keeps it", async () => {
    const { p, g } = await refs();
    await createGuest({ name: "Ani", address: "A", partyId: p.id, groupId: g.id });
    await createGuest({ name: "Budi", address: "B", partyId: p.id, groupId: g.id });

    const all = await exportGuestsCsv(filterForScope("all", { search: "Ani" }));
    expect(all).toContain("Ani");
    expect(all).toContain("Budi");

    const filtered = await exportGuestsCsv({ search: "Ani" });
    expect(filtered).toContain("Ani");
    expect(filtered).not.toContain("Budi");
  });
});
