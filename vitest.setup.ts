import path from "node:path";
const worker = process.env.VITEST_WORKER_ID || "0";
process.env.GUEST_DB_PATH = path.join(
  process.cwd(),
  ".data",
  `test-guest-manager-${worker}.db`
);
