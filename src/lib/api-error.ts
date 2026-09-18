import { NextResponse } from "next/server";
import { errorPayload } from "./normalize";

export function errorResponse(e: unknown): NextResponse {
  const { status, body } = errorPayload(e);
  return NextResponse.json(body, { status });
}
