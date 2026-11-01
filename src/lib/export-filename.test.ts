import { describe, it, expect } from "vitest";
import { exportFilename } from "./export-filename";

describe("exportFilename", () => {
  it("uses the next WIB day for a late-UTC timestamp", () => {
    expect(
      exportFilename("all", "csv", new Date("2026-11-01T18:00:00Z"))
    ).toBe("wedding-guests-all-2026-11-02.csv");
  });

  it("stays on the same WIB day just before midnight", () => {
    expect(
      exportFilename("filtered", "csv", new Date("2026-11-01T16:59:59Z"))
    ).toBe("wedding-guests-filtered-2026-11-01.csv");
  });

  it("maps UTC midnight to 07:00 WIB on the same day", () => {
    expect(
      exportFilename("all", "xlsx", new Date("2026-11-01T00:00:00Z"))
    ).toBe("wedding-guests-all-2026-11-01.xlsx");
  });

  it("supports both scopes and extensions", () => {
    const now = new Date("2026-11-01T00:00:00Z");
    expect(exportFilename("filtered", "xlsx", now)).toBe(
      "wedding-guests-filtered-2026-11-01.xlsx"
    );
    expect(exportFilename("filtered", "csv", now)).toBe(
      "wedding-guests-filtered-2026-11-01.csv"
    );
    expect(exportFilename("all", "csv", now)).toBe(
      "wedding-guests-all-2026-11-01.csv"
    );
  });
});
