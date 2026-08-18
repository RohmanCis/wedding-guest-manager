import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/auth";
import {
  listGuests,
  createGuest,
  updateGuest,
  deleteGuest,
  exportGuestsCsv,
  GuestFilter,
  GuestInput
} from "@/lib/guests";
import { errorResponse } from "@/lib/api-error";

function toFilter(req: NextRequest): GuestFilter {
  const sp = req.nextUrl.searchParams;
  return {
    search: sp.get("search") || undefined,
    partyId: sp.get("partyId") || undefined,
    groupId: sp.get("groupId") || undefined
  };
}

export async function GET(req: NextRequest) {
  const g = guard(req);
  if (g) return g;
  const sp = req.nextUrl.searchParams;
  const filter = toFilter(req);
  if (sp.get("csv") === "1") {
    const csv = await exportGuestsCsv(filter);
    const scope = sp.get("scope") === "all" ? "all" : "filtered";
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="wedding-guests-${scope}-${new Date().toISOString().slice(0, 10)}.csv"`
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
