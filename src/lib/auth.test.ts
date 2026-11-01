import { describe, it, expect, vi, afterEach } from "vitest";

// Each case gets a fresh module instance with its own env — session.ts reads
// process.env at module load, so stubbing after import would prove nothing.
async function loadAuth(user: string, pass: string, secret: string) {
  vi.resetModules();
  vi.stubEnv("ADMIN_USERNAME", user);
  vi.stubEnv("ADMIN_PASSWORD", pass);
  vi.stubEnv("ADMIN_SESSION_SECRET", secret);
  return import("./auth");
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("verifyCredentials — empty env fails closed", () => {
  it("rejects empty input when no credentials are configured", async () => {
    const { verifyCredentials } = await loadAuth("", "", "test-secret");
    expect(verifyCredentials("", "")).toBe(false);
  });

  it("rejects admin/admin when no credentials are configured", async () => {
    const { verifyCredentials } = await loadAuth("", "", "test-secret");
    expect(verifyCredentials("admin", "admin")).toBe(false);
  });
});

describe("verifyCredentials — configured credentials", () => {
  it("accepts the configured credentials", async () => {
    const { verifyCredentials } = await loadAuth(
      "test-user",
      "test-pass",
      "test-secret"
    );
    expect(verifyCredentials("test-user", "test-pass")).toBe(true);
  });

  it("rejects a wrong password", async () => {
    const { verifyCredentials } = await loadAuth(
      "test-user",
      "test-pass",
      "test-secret"
    );
    expect(verifyCredentials("test-user", "nope")).toBe(false);
  });

  it("rejects a wrong username", async () => {
    const { verifyCredentials } = await loadAuth(
      "test-user",
      "test-pass",
      "test-secret"
    );
    expect(verifyCredentials("other", "test-pass")).toBe(false);
  });

  it("rejects username injection via the digest format", async () => {
    const { verifyCredentials } = await loadAuth(
      "test-user",
      "test-pass",
      "test-secret"
    );
    expect(verifyCredentials("test-user:nope", "test-pass")).toBe(false);
  });
});

describe("missing session secret fails closed", () => {
  it("rejects credentials and any session token", async () => {
    const { verifyCredentials, validSession, sessionToken } = await loadAuth(
      "test-user",
      "test-pass",
      ""
    );
    expect(verifyCredentials("test-user", "test-pass")).toBe(false);
    expect(validSession(sessionToken())).toBe(false);
  });
});
