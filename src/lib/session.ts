export const ADMIN_USER = process.env.ADMIN_USERNAME || "admin";
export const ADMIN_PASS = process.env.ADMIN_PASSWORD || "admin";
export const SESSION_COOKIE = "wgm_session";

// ponytail: single-admin MVP token, edge-safe (globalThis.crypto only — no
// node:crypto import). Empty-secret fallback keeps Edge middleware alive at
// module load (a throw there hangs every request); validSession() rejects all
// sessions when the secret is missing so the app fails closed, not open.
// For multi-admin/rotation, move to a signed cookie/JWT in a node runtime.
export const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET ?? "";

export function sessionToken(): string {
  return btoa(`${ADMIN_USER}:${ADMIN_PASS}:${SESSION_SECRET}`);
}

export function validSession(cookie: string | undefined): boolean {
  if (!SESSION_SECRET) return false;
  return cookie === sessionToken();
}
