import ExcelJS from "exceljs";
import type { GuestWithRefs } from "./guests";

export async function buildGuestsXlsx(
  rows: GuestWithRefs[]
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Tamu");
  ws.columns = [
    { header: "Name", key: "name", width: 32 },
    { header: "Address", key: "address", width: 48 },
    { header: "Party", key: "party_name", width: 24 },
    { header: "Group", key: "group_name", width: 20 },
    { header: "Pax", key: "pax", width: 8 }
  ];
  ws.getRow(1).font = { bold: true };
  ws.views = [{ state: "frozen", ySplit: 1 }];
  for (const r of rows) {
    ws.addRow([r.name, r.address, r.party_name, r.group_name, Number(r.pax)]);
  }
  ws.autoFilter = `A1:E${rows.length + 1}`;
  return Buffer.from(await wb.xlsx.writeBuffer());
}
