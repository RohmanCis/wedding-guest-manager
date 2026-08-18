export const ADMIN_USER = process.env.ADMIN_USERNAME || "admin";
export const ADMIN_PASS = process.env.ADMIN_PASSWORD || "admin";
export const SESSION_COOKIE = "wgm_session";

// ponytail: single-admin MVP token. Derived without node:crypto so it is
// usable from edge middleware. For multi-admin/rotation, move to a signed
// cookie/JWT in a node runtime. Token = btoa(user:pass:secret).
export function sessionToken(): string {
  return btoa(`${ADMIN_USER}:${ADMIN_PASS}:wgm-secret`);
}

export function validSession(cookie: string | undefined): boolean {
  return cookie === sessionToken();
}
