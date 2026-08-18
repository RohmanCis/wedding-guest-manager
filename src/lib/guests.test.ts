import { describe, it, expect, beforeEach } from "vitest";
import { resetDb } from "@/lib/db";
import {
  createGuest,
  updateGuest,
  deleteGuest,
  listGuests,
  getGuest
} from "@/lib/guests";
import {
  DuplicateNameError,
  ValidationError,
  NotFoundError
} from "@/lib/normalize";
import { parties, groups } from "@/lib/categories";

beforeEach(() => resetDb());

describe("name normalization & duplicate prevention", () => {
  it("blocks duplicate name with exact same casing", () => {
    const p = parties.list()[0];
    const g = groups.list()[0];
    createGuest({ name: "Budi Santoso", address: "Jl Mawar", partyId: p.id, groupId: g.id });
    expect(() =>
      createGuest({ name: "Budi Santoso", address: "Jl Melati", partyId: p.id, groupId: g.id })
    ).toThrow(DuplicateNameError);
  });

  it("blocks duplicate name with different casing", () => {
    const p = parties.list()[0];
    const g = groups.list()[0];
    createGuest({ name: "Budi Santoso", address: "A", partyId: p.id, groupId: g.id });
    expect(() =>
      createGuest({ name: "BUDI SANTOSO", address: "B", partyId: p.id, groupId: g.id })
    ).toThrow(DuplicateNameError);
  });

  it("blocks duplicate name with leading/trailing whitespace", () => {
    const p = parties.list()[0];
    const g = groups.list()[0];
    createGuest({ name: "Budi Santoso", address: "A", partyId: p.id, groupId: g.id });
    expect(() =>
      createGuest({ name: "  Budi Santoso ", address: "B", partyId: p.id, groupId: g.id })
    ).toThrow(DuplicateNameError);
  });

  it("blocks duplicate name with repeated internal whitespace", () => {
    const p = parties.list()[0];
    const g = groups.list()[0];
    createGuest({ name: "Budi Santoso", address: "A", partyId: p.id, groupId: g.id });
    expect(() =>
      createGuest({ name: "Budi  Santoso", address: "B", partyId: p.id, groupId: g.id })
    ).toThrow(DuplicateNameError);
  });

  it("allows same address for different names", () => {
    const p = parties.list()[0];
    const g = groups.list()[0];
    createGuest({ name: "Budi", address: "Same St", partyId: p.id, groupId: g.id });
    const second = createGuest({ name: "Ani", address: "Same St", partyId: p.id, groupId: g.id });
    expect(second.name).toBe("Ani");
  });
});

describe("guest create/update/delete", () => {
  it("creates a valid guest", () => {
    const p = parties.list()[0];
    const g = groups.list()[0];
    const guest = createGuest({ name: "Ani", address: "Jl 1", partyId: p.id, groupId: g.id });
    expect(guest.id).toBeTruthy();
    expect(guest.party_name).toBe(p.name);
  });

  it("rejects blank name", () => {
    const p = parties.list()[0];
    const g = groups.list()[0];
    expect(() =>
      createGuest({ name: "  ", address: "A", partyId: p.id, groupId: g.id })
    ).toThrow(ValidationError);
  });

  it("rejects blank address", () => {
    const p = parties.list()[0];
    const g = groups.list()[0];
    expect(() =>
      createGuest({ name: "Ani", address: "", partyId: p.id, groupId: g.id })
    ).toThrow(ValidationError);
  });

  it("rejects missing party", () => {
    const g = groups.list()[0];
    expect(() =>
      createGuest({ name: "Ani", address: "A", partyId: "nope", groupId: g.id })
    ).toThrow(ValidationError);
  });

  it("rejects missing group", () => {
    const p = parties.list()[0];
    expect(() =>
      createGuest({ name: "Ani", address: "A", partyId: p.id, groupId: "nope" })
    ).toThrow(ValidationError);
  });

  it("rejects changing a guest to another existing normalized name", () => {
    const p = parties.list()[0];
    const g = groups.list()[0];
    const a = createGuest({ name: "Ani", address: "A", partyId: p.id, groupId: g.id });
    const b = createGuest({ name: "Budi", address: "B", partyId: p.id, groupId: g.id });
    expect(() =>
      updateGuest(b.id, { name: "ani", address: "B", partyId: p.id, groupId: g.id })
    ).toThrow(DuplicateNameError);
  });

  it("allows guest to retain its own name on edit", () => {
    const p = parties.list()[0];
    const g = groups.list()[0];
    const a = createGuest({ name: "Ani", address: "A", partyId: p.id, groupId: g.id });
    const updated = updateGuest(a.id, {
      name: " ANI ",
      address: "A2",
      partyId: p.id,
      groupId: g.id
    });
    expect(updated.address).toBe("A2");
  });

  it("deletes a guest only via explicit action", () => {
    const p = parties.list()[0];
    const g = groups.list()[0];
    const a = createGuest({ name: "Ani", address: "A", partyId: p.id, groupId: g.id });
    deleteGuest(a.id);
    expect(() => getGuest(a.id)).toThrow(NotFoundError);
  });
});
