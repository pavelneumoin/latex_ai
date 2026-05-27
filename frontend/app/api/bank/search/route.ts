import { NextRequest, NextResponse } from "next/server";
import { searchBank } from "@/lib/bank";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const subject = sp.get("subject") as "math" | "informatics" | null;
  const exam = sp.get("exam") as "ege" | "ege_base" | "oge" | null;
  const zadanie_n = sp.get("zadanie_n") ? Number(sp.get("zadanie_n")) : undefined;
  const topic = sp.get("topic") ?? undefined;
  const limit = sp.get("limit") ? Math.min(50, Number(sp.get("limit"))) : 10;

  try {
    const tasks = await searchBank({
      subject: subject ?? undefined,
      exam: exam ?? undefined,
      zadanie_n,
      topic,
      limit,
    });
    // Возвращаем без solution (для превью на /create экономим трафик).
    const slim = tasks.map(({ solution: _sol, ...rest }) => rest);
    return NextResponse.json({ tasks: slim, count: slim.length });
  } catch (e) {
    return NextResponse.json(
      { error: "bank_search_failed", detail: (e as Error).message },
      { status: 500 }
    );
  }
}
