import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  // Only the database is required for the current library release.
  // Worksheet generation and its task bank are disabled.
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", checks: { db: "ok", bank: "disabled" } });
  } catch {
    return NextResponse.json({ status: "degraded", checks: { db: "unavailable", bank: "disabled" } }, { status: 503 });
  }
}
