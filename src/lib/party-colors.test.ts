import { describe, it, expect } from "vitest";
import {
  CHART_HEX,
  colorFor,
  colorForGroup,
  groupColorHex,
  hexFor,
  iconFor,
  iconForGroup,
  partyHex
} from "./party-colors";

describe("trailing '(…)' suffix resolves as the base category", () => {
  it("party color/icon/hex match the base name", () => {
    expect(colorFor("Groom (Rohman)")).toEqual(colorFor("Groom"));
    expect(iconFor("Groom (Rohman)")).toBe(iconFor("Groom"));
    expect(hexFor("party", "Groom (Rohman)")).toBe(hexFor("party", "Groom"));

    expect(colorFor("Bride (Aida)")).toEqual(colorFor("Bride"));
    expect(iconFor("Bride (Aida)")).toBe(iconFor("Bride"));
    expect(hexFor("party", "Bride (Aida)")).toBe(hexFor("party", "Bride"));

    expect(colorFor("Groom Family (Rohman)")).toEqual(colorFor("Groom Family"));
    expect(iconFor("Groom Family (Rohman)")).toBe(iconFor("Groom Family"));
  });

  it("group color/icon match the base name", () => {
    expect(colorForGroup("Sekolah (2019)").dot).toBe(groupColorHex.Sekolah);
    expect(iconForGroup("Sekolah (2019)")).toBe(iconForGroup("Sekolah"));
  });

  it("trims surrounding whitespace before stripping the suffix", () => {
    expect(colorFor("  Groom (Rohman)  ")).toEqual(colorFor("Groom"));
    expect(iconFor("\tBride (Aida) ")).toBe(iconFor("Bride"));
  });
});

describe("distinct identities hold", () => {
  it("Groom and Groom Family differ in hex", () => {
    const groom = hexFor("party", "Groom (Rohman)");
    const family = hexFor("party", "Groom Family (Rohman)");
    expect(groom).not.toBe(family);
    expect(groom).toBe("#c9a84c");
    expect(family).toBe("#7a9cc4");
  });

  it("parenthesised segment mid-name is not stripped", () => {
    // "(Rohman) Groom" does not END in parens → no strip → fallback icon,
    // never Crown (which is not in ICON_FALLBACK, so this probe can fail).
    expect(iconFor("(Rohman) Groom")).not.toBe(iconFor("Groom"));
    // Mid-name parens are not a suffix: stripping them here would resolve to
    // "Groom Family" (Users). Guards the regex's `$` anchor.
    expect(iconFor("Groom(Rohman) Family")).not.toBe(iconFor("Groom Family"));
    expect(partyHex("Groom(Rohman) Family")).not.toBe(partyHex("Groom Family"));
  });

  it("unknown names stay deterministic and unchanged by this rule", () => {
    expect(iconFor("Tetangga Blok C")).not.toBe(iconFor("Groom"));
    expect(hexFor("group", "Tetangga Blok C")).toBe(colorForGroup("Tetangga Blok C").dot);
  });
});

describe("hex consistency", () => {
  it("partyHex / hexFor / colorFor agree", () => {
    expect(partyHex("Groom (Rohman)")).toBe(CHART_HEX[colorFor("Groom").dot]);
    expect(hexFor("party", "Bride (Aida)")).toBe(CHART_HEX[colorFor("Bride").dot]);
    expect(partyHex("Groom (Rohman)")).toBe(hexFor("party", "Groom (Rohman)"));
  });
});
