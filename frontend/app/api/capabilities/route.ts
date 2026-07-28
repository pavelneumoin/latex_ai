import { NextResponse } from "next/server";
import { getLLMCapabilities } from "@/lib/llm";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { llm: getLLMCapabilities() },
    { headers: { "Cache-Control": "no-store" } }
  );
}
