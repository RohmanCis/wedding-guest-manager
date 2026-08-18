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
