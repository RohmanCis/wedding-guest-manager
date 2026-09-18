import { describe, it, expect } from "vitest";
import { filterParams, parseFilter } from "./guest-filter";

describe("filterParams (encode)", () => {
  it("encodes all three params", () => {
    const qs = filterParams({ search: "budi", partyId: "p1", groupId: "g1" });
    expect(qs.get("search")).toBe("budi");
    expect(qs.get("partyId")).toBe("p1");
    expect(qs.get("groupId")).toBe("g1");
  });

  it("trims search and omits it when blank", () => {
    expect(filterParams({ search: "  budi " }).get("search")).toBe("budi");
    expect(filterParams({ search: "   " }).has("search")).toBe(false);
    expect(filterParams({}).has("search")).toBe(false);
  });

  it("omits empty partyId and groupId", () => {
    const qs = filterParams({ search: "budi", partyId: "", groupId: "" });
    expect(qs.has("partyId")).toBe(false);
    expect(qs.has("groupId")).toBe(false);
  });
});

describe("parseFilter (decode)", () => {
  it("returns undefined for absent params", () => {
    expect(parseFilter(new URLSearchParams())).toEqual({});
  });

  it("reads all three params", () => {
    const sp = new URLSearchParams("search=budi&partyId=p1&groupId=g1");
    expect(parseFilter(sp)).toEqual({ search: "budi", partyId: "p1", groupId: "g1" });
  });
});

describe("roundtrip", () => {
  it("encode → decode preserves a normalized filter", () => {
    const filter = { search: "budi", partyId: "p1", groupId: "g1" };
    expect(parseFilter(filterParams(filter))).toEqual(filter);
  });

  it("blank search encodes to an empty query that decodes to no filter", () => {
    expect(parseFilter(filterParams({ search: "  " }))).toEqual({});
  });
});
