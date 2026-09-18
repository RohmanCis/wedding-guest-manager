import { describe, it, expect, vi, afterEach } from "vitest";
import {
  DuplicateNameError,
  NotFoundError,
  ValidationError,
  errorPayload
} from "@/lib/normalize";
import { ApiError, apiGet, apiSend } from "@/lib/client";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("errorPayload wire contract", () => {
  it("maps duplicate name to 409 with existingId", () => {
    const { status, body } = errorPayload(new DuplicateNameError("g1"));
    expect(status).toBe(409);
    expect(body).toEqual({
      error: "Guest with this name already exists.",
      existingId: "g1"
    });
  });

  it("maps validation to 400 with field", () => {
    const { status, body } = errorPayload(new ValidationError("name", "Nama wajib."));
    expect(status).toBe(400);
    expect(body).toEqual({ error: "Nama wajib.", field: "name" });
  });

  it("maps not found to 404", () => {
    const { status, body } = errorPayload(new NotFoundError());
    expect(status).toBe(404);
    expect(body).toEqual({ error: "Not found." });
  });

  it("maps unknown to 500", () => {
    const { status, body } = errorPayload(new Error("boom"));
    expect(status).toBe(500);
    expect(body).toEqual({ error: "Unexpected error." });
  });
});

describe("ApiError unwrap", () => {
  it("carries existingId from a 409 duplicate payload", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ error: "dup", existingId: "g9" }), {
            status: 409
          })
      )
    );
    await expect(apiSend("/api/guests", "POST")).rejects.toMatchObject({
      name: "ApiError",
      existingId: "g9"
    });
  });

  it("leaves existingId undefined for a 400 validation payload", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ error: "Nama wajib.", field: "name" }), {
            status: 400
          })
      )
    );
    let err: ApiError | undefined;
    try {
      await apiGet<never>("/api/guests");
    } catch (e) {
      err = e as ApiError;
    }
    expect(err).toBeInstanceOf(ApiError);
    expect(err?.message).toBe("Nama wajib.");
    expect(err?.existingId).toBeUndefined();
  });
});
