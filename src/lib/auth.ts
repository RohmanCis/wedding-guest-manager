import crypto from "node:crypto";
import {
  ADMIN_USER,
  ADMIN_PASS,
  SESSION_COOKIE
} from "./session";

export { SESSION_COOKIE, sessionToken, validSession } from "./session";

export function verifyCredentials(user: string, pass: string): boolean {
  const digest = (s: string) =>
    crypto.createHash("sha256").update(s).digest();
  const a = digest(`${user}:${pass}:wgm-secret`);
  const b = digest(`${ADMIN_USER}:${ADMIN_PASS}:wgm-secret`);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
