import type { DuplicateNamePayload } from "./normalize";

export class ApiError extends Error {
  constructor(
    message: string,
    public existingId?: DuplicateNamePayload["existingId"]
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parse(res: Response): Promise<Partial<DuplicateNamePayload>> {
  return (await res.json().catch(() => ({}))) as Partial<DuplicateNamePayload>;
}

export async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  const data = await parse(res);
  if (!res.ok) throw new ApiError(data.error || "Request failed", data.existingId);
  return data as T;
}

export async function apiSend<T>(
  url: string,
  method: string,
  body?: unknown
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await parse(res);
  if (!res.ok) throw new ApiError(data.error || "Request failed", data.existingId);
  return data as T;
}
