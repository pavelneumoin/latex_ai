import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { bankStats } from "@/lib/bank";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();
  const checks: Record<string, { ok: boolean; ms?: number; detail?: string }> = {};

  // ── DB check ──────────────────────────────────────────────────────────────
  try {
    const t0 = Date.now();
    const [users, worksheets, templates] = await Promise.all([
      prisma.user.count(),
      prisma.worksheet.count(),
      prisma.template.count(),
    ]);
    checks.db = {
      ok: true,
      ms: Date.now() - t0,
      detail: `users=${users} worksheets=${worksheets} templates=${templates as number}`,
    };
  } catch (e) {
    checks.db = { ok: false, detail: (e as Error).message };
  }

  // ── Bank check ────────────────────────────────────────────────────────────
  try {
    const t0 = Date.now();
    const stats = await bankStats();
    checks.bank = {
      ok: true,
      ms: Date.now() - t0,
      detail: `total=${stats.total} sources=${Object.keys(stats.by_source).join(",")}`,
    };
  } catch (e) {
    checks.bank = { ok: false, detail: (e as Error).message };
  }

  const allOk = Object.values(checks).every((c) => c.ok);
  const totalMs = Date.now() - start;

  return NextResponse.json(
    {
      status: allOk ? "ok" : "degraded",
      uptime_s: Math.round(process.uptime()),
      node: process.version,
      env: process.env.NODE_ENV ?? "unknown",
      checks,
      total_ms: totalMs,
      ts: new Date().toISOString(),
    },
    { status: allOk ? 200 : 503 }
  );
}
