export const ADMIN_USER = process.env.ADMIN_USERNAME || "admin";
export const ADMIN_PASS = process.env.ADMIN_PASSWORD || "admin";
export const SESSION_COOKIE = "wgm_session";

// ponytail: single-admin MVP token, edge-safe (globalThis.crypto only — no
// node:crypto import). A hard requirement on ADMIN_SESSION_SECRET keeps one
// secret shared by middleware and API routes — a random per-process fallback
// gave each runtime a different secret and broke cookie validation. For
// multi-admin/rotation, move to a signed cookie/JWT in a node runtime.
export const SESSION_SECRET = requiredSecret();

function requiredSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET environment variable is required");
  }
  return secret;
}

export function sessionToken(): string {
  return btoa(`${ADMIN_USER}:${ADMIN_PASS}:${SESSION_SECRET}`);
}

export function validSession(cookie: string | undefined): boolean {
  return cookie === sessionToken();
}
