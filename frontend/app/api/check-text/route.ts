// Текстовый чекер. Учитель/ученик вводит ответы вручную в форме на /check-text,
// сервер сравнивает с эталонами листа и возвращает оценку.
//
// POST /api/check-text
//   body: { worksheetId, studentName?, answers: { [taskN: string]: string } }
//
// Возвращает: { results, percent, mark, score }
// Не требует логина для публичных листов; для приватных — нужен hostUser=worksheet.user.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { compareAnswer, percentToMark, type AnswerType } from "@/lib/answer-compare";
import { checkRate, ipFromReq, rateLimited } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  worksheetId: z.string().min(1).max(64),
  studentName: z.string().max(120).optional(),
  answers: z.record(z.string().min(0).max(200)),
});

export async function POST(req: NextRequest) {
  // Не более 60 проверок в минуту с одного IP (для класса 30 учеников × 2 листа).
  const r = checkRate("check-text", ipFromReq(req), { limit: 60, windowMs: 60_000 });
  if (!r.ok) return rateLimited(r);

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_error", issues: parsed.error.issues }, { status: 400 });
  }

  const ws = await prisma.worksheet.findUnique({ where: { id: parsed.data.worksheetId } });
  if (!ws) return NextResponse.json({ error: "worksheet_not_found" }, { status: 404 });

  let content: { tasks?: Array<{ n: number; expected_answer?: string; answer_type?: string; tolerance?: number }> } | null = null;
  try { content = ws.contentJson ? JSON.parse(ws.contentJson) : null; } catch {}
  const tasks = content?.tasks ?? [];
  if (!tasks.length) {
    return NextResponse.json({ error: "no_tasks_in_worksheet" }, { status: 422 });
  }

  const answers = parsed.data.answers;
  const results = tasks.map((t) => {
    const key = String(t.n);
    const got = (answers[key] ?? "").trim();
    const exp = t.expected_answer ?? "";
    const cmp = compareAnswer({
      expected: exp,
      got,
      type: t.answer_type as AnswerType | undefined,
      tolerance: t.tolerance,
    });
    return {
      n: t.n,
      expected: exp,
      got,
      correct: cmp.correct,
      reason: cmp.reason,
      normalized_expected: cmp.normalized_expected,
      normalized_got: cmp.normalized_got,
    };
  });

  const total = results.length;
  const correctCount = results.filter((r) => r.correct).length;
  const percent = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const mark = percentToMark(percent);

  return NextResponse.json({
    worksheetId: ws.id,
    studentName: parsed.data.studentName ?? null,
    results,
    score: { correct: correctCount, total },
    percent,
    mark,
  });
}
