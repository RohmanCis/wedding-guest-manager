import { describe, it, expect } from "vitest";
import { createRequestGate } from "./use-guest-list";

// useGuestList is a "use client" module; in node these imports are inert.
// The gate is the race-guard core — hook wiring is exercised by the
// stale-response interleaving below plus the browser smoke test.

describe("createRequestGate — stale fetch responses (race guard)", () => {
  it("drops the earlier response when a newer request was issued before it resolved", () => {
    const gate = createRequestGate();
    const a = gate.issue(); // fetch A dispatched
    const b = gate.issue(); // search changed → fetch B dispatched, A still in flight
    expect(gate.accept(a)).toBe(false); // A resolves LAST — must not overwrite B
    expect(gate.accept(b)).toBe(true); // B resolves — applied
  });

  it("accepts the only in-flight response", () => {
    const gate = createRequestGate();
    const a = gate.issue();
    expect(gate.accept(a)).toBe(true);
  });

  it("accepts a sequential response after the previous one completed", () => {
    const gate = createRequestGate();
    const a = gate.issue();
    gate.accept(a); // A completes
    const b = gate.issue();
    expect(gate.accept(b)).toBe(true);
    expect(gate.accept(a)).toBe(false); // a late duplicate of A is stale
  });

  it("gates track their own request chain independently", () => {
    const listA = createRequestGate();
    const listB = createRequestGate();
    const a = listA.issue();
    listB.issue(); // unrelated module issued its own fetch
    expect(listA.accept(a)).toBe(true); // does not invalidate list A's response
  });
});
