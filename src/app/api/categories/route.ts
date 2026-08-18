import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, validSession } from "@/lib/auth";
import { parties, groups } from "@/lib/categories";
import { NotFoundError, ValidationError } from "@/lib/normalize";

function guard(req: NextRequest): NextResponse | null {
  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (!validSession(cookie)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  return null;
}

function err(e: unknown): NextResponse {
  if (e instanceof ValidationError)
    return NextResponse.json({ error: e.message, field: e.field }, { status: 400 });
  if (e instanceof NotFoundError)
    return NextResponse.json({ error: e.message }, { status: 404 });
  return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
}

export async function GET(req: NextRequest) {
  const g = guard(req);
  if (g) return g;
  return NextResponse.json({ parties: parties.list(), groups: groups.list() });
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
      type === "group" ? groups.create(name) : parties.create(name);
    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    return err(e);
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
      type === "group" ? groups.rename(id, name) : parties.rename(id, name);
    return NextResponse.json({ item });
  } catch (e) {
    return err(e);
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
    if (type === "group") groups.remove(id);
    else parties.remove(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return err(e);
  }
}
