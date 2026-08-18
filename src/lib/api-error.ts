import { NextResponse } from "next/server";
import {
  DuplicateNameError,
  NotFoundError,
  ValidationError
} from "./normalize";

export function errorResponse(e: unknown): NextResponse {
  if (e instanceof DuplicateNameError)
    return NextResponse.json(
      { error: e.message, existingId: e.existingId },
      { status: 409 }
    );
  if (e instanceof NotFoundError)
    return NextResponse.json({ error: e.message }, { status: 404 });
  if (e instanceof ValidationError)
    return NextResponse.json(
      { error: e.message, field: e.field },
      { status: 400 }
    );
  return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
}
