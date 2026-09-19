import { developmentOnly } from "@/lib/development-route";
import { NextResponse } from "next/server";
import { bankStats } from "@/lib/bank";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function GETImplementation() {
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

export const GET = developmentOnly(GETImplementation);
