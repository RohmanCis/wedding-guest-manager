import { describe, it, expect } from "vitest";
import { rowReveal } from "./duplicate-jump";

// 25 guests → 3 pages of 10.
const guests = Array.from({ length: 25 }, (_, i) => ({ id: `g${i}` }));
const page1 = { page: 1, pageSize: 10, showAll: false };

describe("rowReveal — duplicate jump / new-guest flash (BR-007)", () => {
  it("reports missing when the id is not in the list", () => {
    expect(rowReveal(guests, "nope", page1)).toEqual({ type: "missing" });
    expect(rowReveal([], "g0", page1)).toEqual({ type: "missing" });
  });

  it("reports the target page when the row sits on another page", () => {
    expect(rowReveal(guests, "g15", page1)).toEqual({ type: "page", page: 2 });
    expect(rowReveal(guests, "g24", { page: 2, pageSize: 10, showAll: false })).toEqual({
      type: "page",
      page: 3
    });
  });

  it("first and last row of a page are visible on that page", () => {
    const page2 = { page: 2, pageSize: 10, showAll: false };
    expect(rowReveal(guests, "g10", page2)).toEqual({ type: "visible" });
    expect(rowReveal(guests, "g19", page2)).toEqual({ type: "visible" });
  });

  it("row just past the page edge triggers a page jump", () => {
    expect(rowReveal(guests, "g20", { page: 2, pageSize: 10, showAll: false })).toEqual({
      type: "page",
      page: 3
    });
    expect(rowReveal(guests, "g9", page1)).toEqual({ type: "visible" });
  });

  it("any row is visible when showAll is on", () => {
    expect(rowReveal(guests, "g24", { ...page1, showAll: true })).toEqual({
      type: "visible"
    });
  });

  it("missing is the signal that the target is gone from the landed list (deleted mid-jump)", () => {
    // Caller contract: "missing" on a settled, up-to-date list means the
    // target will never arrive — resolve it (bounded clear), don't wait.
    expect(rowReveal(guests, "g5", page1)).toEqual({ type: "visible" });
    const withoutTarget = guests.filter((g) => g.id !== "g5");
    expect(rowReveal(withoutTarget, "g5", page1)).toEqual({ type: "missing" });
  });
});
