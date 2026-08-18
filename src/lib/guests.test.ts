import { describe, it, expect, beforeEach } from "vitest";
import { resetDb } from "@/lib/db";
import {
  createGuest,
  updateGuest,
  deleteGuest,
  listGuests,
  getGuest,
  exportGuestsCsv
} from "@/lib/guests";
import {
  DuplicateNameError,
  ValidationError,
  NotFoundError
} from "@/lib/normalize";
import { parties, groups } from "@/lib/categories";

beforeEach(async () => {
  await resetDb();
});

async function refs() {
  const ps = await parties.list();
  const gs = await groups.list();
  return { p: ps[0], g: gs[0] };
}

describe("name normalization & duplicate prevention", () => {
  it("blocks duplicate name with exact same casing", async () => {
    const { p, g } = await refs();
    await createGuest({ name: "Budi Santoso", address: "Jl Mawar", partyId: p.id, groupId: g.id });
    await expect(
      createGuest({ name: "Budi Santoso", address: "Jl Melati", partyId: p.id, groupId: g.id })
    ).rejects.toThrow(DuplicateNameError);
  });

  it("blocks duplicate name with different casing", async () => {
    const { p, g } = await refs();
    await createGuest({ name: "Budi Santoso", address: "A", partyId: p.id, groupId: g.id });
    await expect(
      createGuest({ name: "BUDI SANTOSO", address: "B", partyId: p.id, groupId: g.id })
    ).rejects.toThrow(DuplicateNameError);
  });

  it("blocks duplicate name with leading/trailing whitespace", async () => {
    const { p, g } = await refs();
    await createGuest({ name: "Budi Santoso", address: "A", partyId: p.id, groupId: g.id });
    await expect(
      createGuest({ name: "  Budi Santoso ", address: "B", partyId: p.id, groupId: g.id })
    ).rejects.toThrow(DuplicateNameError);
  });

  it("blocks duplicate name with repeated internal whitespace", async () => {
    const { p, g } = await refs();
    await createGuest({ name: "Budi Santoso", address: "A", partyId: p.id, groupId: g.id });
    await expect(
      createGuest({ name: "Budi  Santoso", address: "B", partyId: p.id, groupId: g.id })
    ).rejects.toThrow(DuplicateNameError);
  });

  it("allows same address for different names", async () => {
    const { p, g } = await refs();
    await createGuest({ name: "Budi", address: "Same St", partyId: p.id, groupId: g.id });
    const second = await createGuest({ name: "Ani", address: "Same St", partyId: p.id, groupId: g.id });
    expect(second.name).toBe("Ani");
  });
});

describe("guest create/update/delete", () => {
  it("creates a valid guest", async () => {
    const { p, g } = await refs();
    const guest = await createGuest({ name: "Ani", address: "Jl 1", partyId: p.id, groupId: g.id });
    expect(guest.id).toBeTruthy();
    expect(guest.party_name).toBe(p.name);
  });

  it("rejects blank name", async () => {
    const { p, g } = await refs();
    await expect(
      createGuest({ name: "  ", address: "A", partyId: p.id, groupId: g.id })
    ).rejects.toThrow(ValidationError);
  });

  it("rejects blank address", async () => {
    const { p, g } = await refs();
    await expect(
      createGuest({ name: "Ani", address: "", partyId: p.id, groupId: g.id })
    ).rejects.toThrow(ValidationError);
  });

  it("rejects missing party", async () => {
    const { g } = await refs();
    await expect(
      createGuest({ name: "Ani", address: "A", partyId: "nope", groupId: g.id })
    ).rejects.toThrow(ValidationError);
  });

  it("rejects missing group", async () => {
    const { p } = await refs();
    await expect(
      createGuest({ name: "Ani", address: "A", partyId: p.id, groupId: "nope" })
    ).rejects.toThrow(ValidationError);
  });

  it("rejects changing a guest to another existing normalized name", async () => {
    const { p, g } = await refs();
    await createGuest({ name: "Ani", address: "A", partyId: p.id, groupId: g.id });
    const b = await createGuest({ name: "Budi", address: "B", partyId: p.id, groupId: g.id });
    await expect(
      updateGuest(b.id, { name: "ani", address: "B", partyId: p.id, groupId: g.id })
    ).rejects.toThrow(DuplicateNameError);
  });

  it("allows guest to retain its own name on edit", async () => {
    const { p, g } = await refs();
    const a = await createGuest({ name: "Ani", address: "A", partyId: p.id, groupId: g.id });
    const updated = await updateGuest(a.id, {
      name: " ANI ",
      address: "A2",
      partyId: p.id,
      groupId: g.id
    });
    expect(updated.address).toBe("A2");
  });

  it("deletes a guest only via explicit action", async () => {
    const { p, g } = await refs();
    const a = await createGuest({ name: "Ani", address: "A", partyId: p.id, groupId: g.id });
    await deleteGuest(a.id);
    await expect(getGuest(a.id)).rejects.toThrow(NotFoundError);
  });

  it("exports a valid header-only CSV when the filtered result is empty", async () => {
    const { p, g } = await refs();
    await createGuest({ name: "Ani", address: "A", partyId: p.id, groupId: g.id });
    expect(await exportGuestsCsv({ search: "zzz" })).toBe(
      "Name,Address,Party,Group,Pax"
    );
  });
});

describe("pax (jumlah orang per entry)", () => {
  it("defaults pax to 1 when omitted", async () => {
    const { p, g } = await refs();
    const guest = await createGuest({ name: "Ani", address: "A", partyId: p.id, groupId: g.id });
    expect(guest.pax).toBe(1);
  });

  it("accepts pax boundary values 1 and 4", async () => {
    const { p, g } = await refs();
    expect(
      (await createGuest({ name: "Ani", address: "A", partyId: p.id, groupId: g.id, pax: 1 })).pax
    ).toBe(1);
    expect(
      (await createGuest({ name: "Budi", address: "A", partyId: p.id, groupId: g.id, pax: 4 })).pax
    ).toBe(4);
  });

  it("rejects pax 0, negative, non-integer, and above 4", async () => {
    const { p, g } = await refs();
    for (const pax of [0, -1, 5, 1.5, NaN]) {
      await expect(
        createGuest({ name: "Ani", address: "A", partyId: p.id, groupId: g.id, pax })
      ).rejects.toThrow(ValidationError);
    }
  });

  it("updates pax without triggering the duplicate check", async () => {
    const { p, g } = await refs();
    const a = await createGuest({ name: "Ani", address: "A", partyId: p.id, groupId: g.id });
    const updated = await updateGuest(a.id, {
      name: "Ani",
      address: "A",
      partyId: p.id,
      groupId: g.id,
      pax: 3
    });
    expect(updated.pax).toBe(3);
  });

  it("includes pax in the CSV export", async () => {
    const { p, g } = await refs();
    await createGuest({ name: "Ani", address: "A", partyId: p.id, groupId: g.id, pax: 3 });
    const csv = await exportGuestsCsv();
    expect(csv).toContain("Ani,A,");
    expect(csv.split("\r\n")[1].endsWith(",3")).toBe(true);
  });
});
