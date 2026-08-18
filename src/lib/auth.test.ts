import { describe, it, expect } from "vitest";
import { verifyCredentials } from "./auth";

describe("verifyCredentials", () => {
  it("accepts default admin credentials", () => {
    expect(verifyCredentials("admin", "admin")).toBe(true);
  });
  it("rejects wrong password", () => {
    expect(verifyCredentials("admin", "nope")).toBe(false);
  });
  it("rejects wrong username", () => {
    expect(verifyCredentials("root", "admin")).toBe(false);
  });
  it("rejects empty credentials", () => {
    expect(verifyCredentials("", "")).toBe(false);
  });
  it("rejects username-only injection format strings", () => {
    expect(verifyCredentials("admin:nope", "admin")).toBe(false);
  });
});
