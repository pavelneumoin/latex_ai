// POST /api/worksheets/[id]/refine
//   body: { instruction: string, replace?: boolean }
// LLM получает текущий contentJson + инструкцию учителя, возвращает новый contentJson.
// По умолчанию НЕ перезаписывает — создаёт новую запись-вариант (как /variants).
// Если replace=true — обновляет тот же лист (потеряем предыдущую версию).

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { generateWorksheetContent, safeParseJson, normalizeWorksheetContent } from "@/lib/worksheets";
import { checkRate, ipFromReq, rateLimited } from "@/lib/rate-limit";

export const runtime = "nodejs";

const schema = z.object({
  instruction: z.string().min(3).max(2000),
  replace: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  let user;
  try { user = await requireUser(); } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 20 refinement-вызовов в час на юзера — LLM-квота защита.
  const r = checkRate("refine", user.id, { limit: 20, windowMs: 60 * 60_000 });
  if (!r.ok) return rateLimited(r);

  let body: unknown = {};
  try { body = await req.json(); } catch { body = {}; }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_error", issues: parsed.error.issues }, { status: 400 });
  }

  const parent = await prisma.worksheet.findUnique({ where: { id: params.id } });
  if (!parent) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (parent.userId !== user.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const current = safeParseJson<{ title?: string; subtitle?: string; tasks?: unknown[] }>(parent.contentJson);
  if (!current?.tasks) {
    return NextResponse.json({ error: "no_content", detail: "contentJson отсутствует" }, { status: 409 });
  }

  try {
    const gen = await generateWorksheetContent("refine_worksheet", {
      current_json: JSON.stringify(current, null, 2),
      instruction: parsed.data.instruction,
    });

    // На всякий — ещё раз прогнать через нормализатор (хоть он уже внутри generateWorksheetContent).
    const normalized = normalizeWorksheetContent(JSON.parse(gen.contentJson));
    const normalizedJson = JSON.stringify(normalized);

    if (parsed.data.replace) {
      const updated = await prisma.worksheet.update({
        where: { id: parent.id },
        data: {
          contentJson: normalizedJson,
          llmProvider: gen.provider,
          llmModel: gen.model,
          promptUsed: "refine_worksheet",
          status: "ready",
          ...(typeof (normalized as { title?: string }).title === "string"
            ? { title: ((normalized as { title?: string }).title ?? parent.title).trim() }
            : {}),
        },
      });
      return NextResponse.json({
        worksheet: {
          id: updated.id,
          status: updated.status,
          title: updated.title,
          templateId: updated.templateId,
          contentJson: safeParseJson(updated.contentJson),
          createdAt: updated.createdAt,
        },
        action: "replaced",
      });
    }

    // Сохраняем как новый вариант (с parentId).
    const newTitle = (normalized as { title?: string }).title?.trim() || `${parent.title} (правка)`;
    const ws = await prisma.worksheet.create({
      data: {
        userId: user.id,
        templateId: parent.templateId,
        title: newTitle,
        topic: parent.topic,
        subject: parent.subject,
        grade: parent.grade,
        difficulty: parent.difficulty,
        parentId: parent.id,
        contentJson: normalizedJson,
        status: "ready",
        promptUsed: "refine_worksheet",
        llmProvider: gen.provider,
        llmModel: gen.model,
        paramsJson: JSON.stringify({ source: "refine", instruction: parsed.data.instruction }),
      },
    });

    return NextResponse.json({
      worksheet: {
        id: ws.id,
        status: ws.status,
        title: ws.title,
        templateId: ws.templateId,
        contentJson: safeParseJson(ws.contentJson),
        parentId: ws.parentId,
        createdAt: ws.createdAt,
      },
      action: "branched",
    });
  } catch (e) {
    console.error("[refine] error", e);
    return NextResponse.json(
      { error: "refine_failed", detail: (e as Error).message },
      { status: 502 }
    );
  }
}
