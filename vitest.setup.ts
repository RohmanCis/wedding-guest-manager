import fs from "node:fs";
import path from "node:path";
const worker = process.env.VITEST_WORKER_ID || "0";
process.env.GUEST_DB_PATH = path.join(
  process.cwd(),
  ".data",
  `test-guest-manager-${worker}.db`
);

// session.ts throws at import when ADMIN_SESSION_SECRET is unset; vitest does
// not read .env.local, so load it here. Fixed fallback keeps tests green even
// without .env.local (fresh clone, CI).
if (!process.env.ADMIN_SESSION_SECRET) {
  const envLocal = fs.existsSync(".env.local")
    ? fs.readFileSync(".env.local", "utf8")
    : "";
  process.env.ADMIN_SESSION_SECRET =
    envLocal.match(/^ADMIN_SESSION_SECRET=(.+)$/m)?.[1]?.trim() ||
    "vitest-fixed-session-secret";
}
