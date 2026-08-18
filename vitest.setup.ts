import fs from "node:fs";
import postgres from "postgres";

const worker = process.env.VITEST_WORKER_ID || "0";

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

// DB tests run against Postgres (DATABASE_URL). Each vitest worker gets an
// isolated schema so parallel suites never collide; the schema is created
// here once before tests import db.ts.
function loadFromEnvLocal(key: string): string | undefined {
  if (process.env[key]) return process.env[key];
  if (!fs.existsSync(".env.local")) return undefined;
  return fs
    .readFileSync(".env.local", "utf8")
    .match(new RegExp(`^${key}=(.+)$`, "m"))?.[1]?.trim();
}

const baseUrl = loadFromEnvLocal("DATABASE_URL");
if (!baseUrl) {
  throw new Error(
    "DATABASE_URL required for tests (set env or .env.local). See DEPLOYMENT.md."
  );
}

const schema = `test_w${worker}`;
const url = new URL(baseUrl);
url.searchParams.set("options", `-c search_path=${schema},public`);
process.env.DATABASE_URL = url.toString();

const setup = postgres(baseUrl, { prepare: false, max: 1 });
await setup.unsafe(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
await setup.unsafe(`CREATE SCHEMA ${schema}`);
await setup.end();
