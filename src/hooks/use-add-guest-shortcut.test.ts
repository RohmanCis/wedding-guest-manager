import { describe, it, expect } from "vitest";
import { shouldTriggerShortcut, type ShortcutEvent } from "./use-add-guest-shortcut";

// use-add-guest-shortcut is a "use client" module; in node these imports are
// inert. The predicate is the pure core — DOM-free, so fakes are plain objects
// whose closest() actually receives the real selector string and answers on it.

const FAKE_EL = {} as Element;

/** Fake target blocked for exactly the listed selector tokens. */
function blockedTarget(...tokens: string[]) {
  return {
    closest: (sel: string) =>
      tokens.some((token) => sel.includes(token)) ? FAKE_EL : null
  };
}

/** Fake target matching nothing (body-ish). */
function plainTarget() {
  return { closest: (_sel: string) => null };
}

function ev(over: Partial<ShortcutEvent> = {}): ShortcutEvent {
  return {
    key: "Enter",
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    repeat: false,
    isComposing: false,
    target: null,
    ...over
  } as ShortcutEvent;
}

const OPEN = { dialogOpen: false } as const;

describe("shouldTriggerShortcut", () => {
  it("1. Ctrl+Enter on a body-ish target → true", () => {
    expect(shouldTriggerShortcut(ev({ ctrlKey: true, target: plainTarget() as any }), OPEN)).toBe(true);
  });

  it("2. Meta+Enter (macOS) → true", () => {
    expect(shouldTriggerShortcut(ev({ metaKey: true, target: plainTarget() as any }), OPEN)).toBe(true);
  });

  it("3. plain Enter, no modifiers → false", () => {
    expect(shouldTriggerShortcut(ev({ target: plainTarget() as any }), OPEN)).toBe(false);
  });

  it("4. dialogOpen: true → false", () => {
    expect(
      shouldTriggerShortcut(ev({ ctrlKey: true, target: plainTarget() as any }), { dialogOpen: true })
    ).toBe(false);
  });

  it("5. target inside input → false", () => {
    expect(
      shouldTriggerShortcut(ev({ ctrlKey: true, target: blockedTarget("input") as any }), OPEN)
    ).toBe(false);
  });

  it("6. target inside textarea → false", () => {
    expect(
      shouldTriggerShortcut(ev({ ctrlKey: true, target: blockedTarget("textarea") as any }), OPEN)
    ).toBe(false);
  });

  it("7. target inside select → false", () => {
    expect(
      shouldTriggerShortcut(ev({ ctrlKey: true, target: blockedTarget("select") as any }), OPEN)
    ).toBe(false);
  });

  it('8. target inside [contenteditable="true"] → false', () => {
    expect(
      shouldTriggerShortcut(
        ev({ ctrlKey: true, target: blockedTarget('contenteditable="true"') as any }),
        OPEN
      )
    ).toBe(false);
  });

  it('9. target inside [role="dialog"] → false', () => {
    expect(
      shouldTriggerShortcut(ev({ ctrlKey: true, target: blockedTarget('[role="dialog"]') as any }), OPEN)
    ).toBe(false);
  });

  it('10. target inside [role="listbox"] → false', () => {
    expect(
      shouldTriggerShortcut(ev({ ctrlKey: true, target: blockedTarget('[role="listbox"]') as any }), OPEN)
    ).toBe(false);
  });

  it("11. target IS the searchInput → true (explicit product decision)", () => {
    const searchEl = {
      closest: (sel: string) => (sel.includes("input") ? FAKE_EL : null),
      contains: () => false
    } as unknown as Element;
    expect(
      shouldTriggerShortcut(ev({ ctrlKey: true, target: searchEl as any }), {
        dialogOpen: false,
        searchInput: searchEl
      })
    ).toBe(true);
  });

  it("12. target is a child of searchInput → true", () => {
    const child = blockedTarget("input") as any;
    const searchEl = {
      closest: () => null,
      contains: (n: unknown) => n === child
    } as unknown as Element;
    expect(
      shouldTriggerShortcut(ev({ ctrlKey: true, target: child }), {
        dialogOpen: false,
        searchInput: searchEl
      })
    ).toBe(true);
  });

  it("13. Ctrl+Alt+Enter (AltGr) → false", () => {
    expect(
      shouldTriggerShortcut(ev({ ctrlKey: true, altKey: true, target: plainTarget() as any }), OPEN)
    ).toBe(false);
  });

  it("14. repeat: true → false", () => {
    expect(
      shouldTriggerShortcut(ev({ ctrlKey: true, repeat: true, target: plainTarget() as any }), OPEN)
    ).toBe(false);
  });

  it("15. isComposing: true → false", () => {
    expect(
      shouldTriggerShortcut(ev({ ctrlKey: true, isComposing: true, target: plainTarget() as any }), OPEN)
    ).toBe(false);
  });

  it("16. target with no closest function → true (defensive)", () => {
    expect(shouldTriggerShortcut(ev({ ctrlKey: true, target: {} as any }), OPEN)).toBe(true);
  });

  it("17. Ctrl+Shift+Enter → true (pinned)", () => {
    expect(
      shouldTriggerShortcut(ev({ ctrlKey: true, shiftKey: true, target: plainTarget() as any }), OPEN)
    ).toBe(true);
  });
});
