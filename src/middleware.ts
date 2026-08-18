import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, validSession } from "@/lib/session";

export function middleware(req: NextRequest) {
  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (!validSession(cookie)) {
    const url = req.nextUrl.clone();
    if (url.pathname !== "/login") {
      url.pathname = "/login";
      url.searchParams.set("next", req.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  }
  if (req.nextUrl.pathname === "/login" && validSession(cookie)) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|api/auth/login).*)"]
};
