import { NextResponse } from "next/server";
import { bankStats } from "@/lib/bank";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const s = await bankStats();
    return NextResponse.json(s);
  } catch (e) {
    return NextResponse.json(
      { error: "bank_unavailable", detail: (e as Error).message },
      { status: 503 }
    );
  }
}
