export class ApiError extends Error {
  constructor(
    message: string,
    public existingId?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json().catch(() => ({}));
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
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || "Request failed", data.existingId);
  return data as T;
}
