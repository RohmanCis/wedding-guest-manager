// Name normalization per BR-006: trim, collapse internal whitespace, lowercase.
export function normalizeName(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export class DuplicateNameError extends Error {
  constructor(public existingId?: string) {
    super("Guest with this name already exists.");
    this.name = "DuplicateNameError";
  }
}

export class NotFoundError extends Error {
  constructor(message = "Not found.") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends Error {
  constructor(public field: string, message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export interface DuplicateNamePayload {
  error: string;
  existingId?: string;
}

export type ApiErrorBody =
  | DuplicateNamePayload
  | { error: string; field: string }
  | { error: string };

// Single source of the error wire contract: status + body for every API error.
export function errorPayload(e: unknown): {
  status: number;
  body: ApiErrorBody;
} {
  if (e instanceof DuplicateNameError)
    return { status: 409, body: { error: e.message, existingId: e.existingId } };
  if (e instanceof NotFoundError)
    return { status: 404, body: { error: e.message } };
  if (e instanceof ValidationError)
    return { status: 400, body: { error: e.message, field: e.field } };
  return { status: 500, body: { error: "Unexpected error." } };
}
