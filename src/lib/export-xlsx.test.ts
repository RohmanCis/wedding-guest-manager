import { describe, it, expect, beforeEach } from "vitest";
import ExcelJS from "exceljs";
import { resetDb } from "@/lib/db";
import { createGuest, listGuests, exportGuestsXlsx } from "@/lib/guests";
import { parties, groups } from "@/lib/categories";

beforeEach(async () => {
  await resetDb();
});

async function refs() {
  const ps = await parties.list();
  const gs = await groups.list();
  return { ps, p: ps[0], g: gs[0] };
}

async function loadSheet(buf: Buffer) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf as unknown as ArrayBuffer);
  const ws = wb.getWorksheet("Tamu");
  if (!ws) throw new Error("worksheet Tamu missing");
  return ws;
}

function rowValues(ws: ExcelJS.Worksheet, row: number) {
  return [1, 2, 3, 4, 5].map((c) => ws.getRow(row).getCell(c).value);
}

describe("buildGuestsXlsx", () => {
  it("writes header and all rows with correct types", async () => {
    const { p, g } = await refs();
    await createGuest({ name: "Ani", address: "Jl 1", partyId: p.id, groupId: g.id, pax: 2 });
    await createGuest({ name: "Budi", address: "Jl 2", partyId: p.id, groupId: g.id, pax: 1 });
    const ws = await loadSheet(await exportGuestsXlsx());

    expect(ws.name).toBe("Tamu");
    expect(rowValues(ws, 1)).toEqual(["Name", "Address", "Party", "Group", "Pax"]);
    expect(ws.rowCount).toBe(3);

    const r2 = rowValues(ws, 2);
    expect(r2[0]).toBe("Ani");
    expect(r2[1]).toBe("Jl 1");
    expect(r2[2]).toBe(p.name);
    expect(r2[3]).toBe(g.name);
    expect(r2[4]).toBe(2);
    expect(typeof r2[0]).toBe("string");
    expect(typeof r2[1]).toBe("string");
    expect(typeof r2[2]).toBe("string");
    expect(typeof r2[3]).toBe("string");
    expect(typeof r2[4]).toBe("number");
  });

  it("honours the party filter", async () => {
    const { ps, p, g } = await refs();
    const other = ps[1];
    await createGuest({ name: "Ani", address: "A", partyId: p.id, groupId: g.id });
    await createGuest({ name: "Budi", address: "B", partyId: other.id, groupId: g.id });

    const ws = await loadSheet(await exportGuestsXlsx({ partyId: other.id }));
    expect(ws.rowCount).toBe(2);
    expect(rowValues(ws, 2).slice(0, 4)).toEqual(["Budi", "B", other.name, g.name]);
  });

  it("follows the requested sort order", async () => {
    const { ps, p, g } = await refs();
    const other = ps[1];
    await createGuest({ name: "Ani", address: "A", partyId: p.id, groupId: g.id, pax: 1 });
    await createGuest({ name: "Budi", address: "B", partyId: other.id, groupId: g.id, pax: 3 });
    await createGuest({ name: "Cici", address: "C", partyId: p.id, groupId: g.id, pax: 2 });

    const filter = { sort: "pax" as const, dir: "desc" as const };
    const expected = (await listGuests(filter)).map((r) => r.name);
    const ws = await loadSheet(await exportGuestsXlsx(filter));
    const names = [];
    for (let i = 2; i <= ws.rowCount; i++) names.push(ws.getRow(i).getCell(1).value);
    expect(names).toEqual(expected);
    expect(names).toEqual(["Budi", "Cici", "Ani"]);
  });

  it("keeps formula-looking strings literal", async () => {
    const { p, g } = await refs();
    await createGuest({ name: "=1+1", address: "@x", partyId: p.id, groupId: g.id });
    await createGuest({ name: "Minus", address: "-2+3", partyId: p.id, groupId: g.id });

    const ws = await loadSheet(await exportGuestsXlsx());
    const c1 = ws.getRow(2).getCell(1);
    const c2 = ws.getRow(2).getCell(2);
    const c3 = ws.getRow(3).getCell(2);
    expect(c1.value).toBe("=1+1");
    expect(c1.formula).toBeUndefined();
    expect(c2.value).toBe("@x");
    expect(c2.formula).toBeUndefined();
    expect(c3.value).toBe("-2+3");
    expect(c3.formula).toBeUndefined();
  });

  it("round-trips special characters", async () => {
    const { p, g } = await refs();
    const name = "Ñü—😊";
    const address = 'Jalan, "No" 5\nRT 01';
    await createGuest({ name, address, partyId: p.id, groupId: g.id });

    const ws = await loadSheet(await exportGuestsXlsx());
    expect(ws.getRow(2).getCell(1).value).toBe(name);
    expect(ws.getRow(2).getCell(2).value).toBe(address);
  });

  it("yields a header-only sheet when nothing matches", async () => {
    const { ps } = await refs();
    const ws = await loadSheet(await exportGuestsXlsx({ partyId: ps[3].id }));
    expect(ws.rowCount).toBe(1);
    expect(rowValues(ws, 1)).toEqual(["Name", "Address", "Party", "Group", "Pax"]);
  });

  it("applies header styling, freeze pane, autofilter and widths", async () => {
    const { p, g } = await refs();
    await createGuest({ name: "Ani", address: "A", partyId: p.id, groupId: g.id });
    await createGuest({ name: "Budi", address: "B", partyId: p.id, groupId: g.id });
    const ws = await loadSheet(await exportGuestsXlsx());

    expect(ws.getRow(1).font?.bold).toBe(true);
    expect(ws.views?.[0]).toMatchObject({ state: "frozen", ySplit: 1 });
    expect(typeof ws.autoFilter).toBe("string");
    expect(ws.autoFilter).toBe("A1:E3");
    expect(ws.getColumn(1).width).toBe(32);
    expect(ws.getColumn(2).width).toBe(48);
    expect(ws.columnCount).toBe(5);
    expect(ws.columns).toHaveLength(5);
  });
});
