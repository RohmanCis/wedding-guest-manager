import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/auth";
import { parties, groups } from "@/lib/categories";
import { errorResponse } from "@/lib/api-error";

export async function GET(req: NextRequest) {
  const g = guard(req);
  if (g) return g;
  return NextResponse.json({
    parties: await parties.list(),
    groups: await groups.list()
  });
}

export async function POST(req: NextRequest) {
  const g = guard(req);
  if (g) return g;
  const { type, name } = (await req.json().catch(() => ({}))) as {
    type: "party" | "group";
    name: string;
  };
  try {
    const item =
      type === "group" ? await groups.create(name) : await parties.create(name);
    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function PUT(req: NextRequest) {
  const g = guard(req);
  if (g) return g;
  const { type, id, name } = (await req.json().catch(() => ({}))) as {
    type: "party" | "group";
    id: string;
    name: string;
  };
  try {
    const item =
      type === "group"
        ? await groups.rename(id, name)
        : await parties.rename(id, name);
    return NextResponse.json({ item });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(req: NextRequest) {
  const g = guard(req);
  if (g) return g;
  const { type, id } = (await req.json().catch(() => ({}))) as {
    type: "party" | "group";
    id: string;
  };
  try {
    if (type === "group") await groups.remove(id);
    else await parties.remove(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
