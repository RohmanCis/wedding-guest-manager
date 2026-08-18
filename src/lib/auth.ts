import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import {
  ADMIN_USER,
  ADMIN_PASS,
  SESSION_COOKIE,
  SESSION_SECRET,
  validSession
} from "./session";

export { SESSION_COOKIE, sessionToken, validSession } from "./session";

export function verifyCredentials(user: string, pass: string): boolean {
  const digest = (s: string) =>
    crypto.createHash("sha256").update(s).digest();
  const a = digest(`${user}:${pass}:${SESSION_SECRET}`);
  const b = digest(`${ADMIN_USER}:${ADMIN_PASS}:${SESSION_SECRET}`);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function guard(req: NextRequest): NextResponse | null {
  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (!validSession(cookie)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  return null;
}
