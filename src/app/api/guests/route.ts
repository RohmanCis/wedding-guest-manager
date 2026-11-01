import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/auth";
import {
  listGuests,
  createGuest,
  updateGuest,
  deleteGuest,
  exportGuestsCsv,
  exportGuestsXlsx,
  GuestInput
} from "@/lib/guests";
import { parseFilter, filterForScope } from "@/lib/guest-filter";
import { exportFilename } from "@/lib/export-filename";
import { errorResponse } from "@/lib/api-error";

export async function GET(req: NextRequest) {
  const g = guard(req);
  if (g) return g;
  const sp = req.nextUrl.searchParams;
  const filter = parseFilter(sp);
  if (sp.get("csv") === "1") {
    const scope = sp.get("scope") === "all" ? "all" : "filtered";
    const exportFilter = filterForScope(sp.get("scope"), filter);
    if (sp.get("format") === "xlsx") {
      const xlsx = await exportGuestsXlsx(exportFilter);
      return new NextResponse(new Uint8Array(xlsx), {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${exportFilename(scope, "xlsx")}"`,
          "Cache-Control": "no-store"
        }
      });
    }
    const csv = await exportGuestsCsv(exportFilter);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${exportFilename(scope, "csv")}"`
      }
    });
  }
  return NextResponse.json({ guests: await listGuests(filter) });
}

export async function POST(req: NextRequest) {
  const g = guard(req);
  if (g) return g;
  const body = (await req.json().catch(() => ({}))) as GuestInput;
  try {
    const guest = await createGuest(body);
    return NextResponse.json({ guest }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function PUT(req: NextRequest) {
  const g = guard(req);
  if (g) return g;
  const body = (await req.json().catch(() => ({}))) as GuestInput & { id: string };
  try {
    const guest = await updateGuest(body.id, body);
    return NextResponse.json({ guest });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(req: NextRequest) {
  const g = guard(req);
  if (g) return g;
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  try {
    await deleteGuest(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
