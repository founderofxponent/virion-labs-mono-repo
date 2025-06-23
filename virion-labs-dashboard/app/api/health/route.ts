import { NextResponse } from "next/server";

/**
 * Health check endpoint to verify API is running
 * @param _req
 * @returns {NextResponse}
 */
export async function GET(_req: Request) {
  return NextResponse.json({ status: "ok" }, { status: 200 });
} 