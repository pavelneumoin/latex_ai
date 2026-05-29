// GET /api/worksheets/[id]/validate
// Прогоняет сохранённый contentJson через детерминированный валидатор и возвращает
// отчёт о качестве (score + список замечаний). Не дёргает LLM.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { safeParseJson } from "@/lib/worksheets";
import { validateWorksheet } from "@/lib/worksheet-validator";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();

  const ws = await prisma.worksheet.findUnique({ where: { id: params.id } });
  if (!ws) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const isOwner = !!user && ws.userId === user.id;
  if (!isOwner && !ws.isPublic) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const content = safeParseJson(ws.contentJson);
  if (!content) {
    return NextResponse.json(
      { error: "no_content", detail: "Лист ещё не сгенерирован." },
      { status: 422 }
    );
  }

  const result = validateWorksheet(content);
  return NextResponse.json({ worksheetId: ws.id, ...result });
}
