// Результаты проверки: пакетное сохранение (ручной ввод или итог LLM-проверки).
// Проценты и отметки пересчитываются на сервере по шкале класса.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { computeMark, computePct, DEFAULT_SCALE } from "@/lib/marks";

export const runtime = "nodejs";

const resultSchema = z.object({
  id: z.string().min(1).optional(),          // без id = новая строка (ученик вне класса)
  studentName: z.string().min(1).max(120).optional(),
  score: z.number().int().min(0).max(300).optional(),
  maxScore: z.number().int().min(0).max(300).optional(),
  absent: z.boolean().optional(),
  needsReview: z.boolean().optional(),
  answersJson: z.string().max(20000).optional(),
  delete: z.boolean().optional(),
});

const patchSchema = z.object({
  results: z.array(resultSchema).min(1).max(80),
  markDone: z.boolean().optional(), // пометить проверку завершённой
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const job = await prisma.checkJob.findUnique({
    where: { id: params.id },
    include: { class: true },
  });
  if (!job || job.userId !== user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const scale = job.class
    ? { scale5: job.class.scale5, scale4: job.class.scale4, scale3: job.class.scale3 }
    : DEFAULT_SCALE;
  const jobMax = job.maxScore ?? 0;

  for (const r of parsed.data.results) {
    if (r.id && r.delete) {
      await prisma.checkResult.deleteMany({
        where: { id: r.id, jobId: job.id },
      });
      continue;
    }

    if (r.id) {
      const existing = await prisma.checkResult.findUnique({ where: { id: r.id } });
      if (!existing || existing.jobId !== job.id) continue;

      const absent = r.absent ?? existing.absent;
      const maxScore = r.maxScore ?? (existing.maxScore || jobMax);
      const score = r.score ?? existing.score;
      const pct = absent ? 0 : computePct(score, maxScore);
      const mark = absent ? null : computeMark(pct, scale);

      await prisma.checkResult.update({
        where: { id: existing.id },
        data: {
          ...(r.studentName !== undefined ? { studentName: r.studentName.trim() } : {}),
          ...(r.answersJson !== undefined ? { answersJson: r.answersJson } : {}),
          score,
          maxScore,
          pct,
          mark,
          absent,
          needsReview: r.needsReview ?? (r.score !== undefined ? false : existing.needsReview),
        },
      });
    } else {
      if (!r.studentName?.trim()) continue;
      const maxScore = r.maxScore ?? jobMax;
      const score = r.score ?? 0;
      const absent = r.absent ?? false;
      const pct = absent ? 0 : computePct(score, maxScore);
      await prisma.checkResult.create({
        data: {
          jobId: job.id,
          studentName: r.studentName.trim(),
          score,
          maxScore,
          pct,
          mark: absent ? null : computeMark(pct, scale),
          absent,
          needsReview: r.needsReview ?? r.score === undefined,
          answersJson: r.answersJson ?? "[]",
        },
      });
    }
  }

  // Статусы: все строки без needsReview → review/done
  const remaining = await prisma.checkResult.count({
    where: { jobId: job.id, needsReview: true, absent: false },
  });
  let status = job.status;
  if (parsed.data.markDone) {
    status = "done";
  } else if (remaining === 0 && job.status !== "done") {
    status = "review";
  }
  if (status !== job.status) {
    await prisma.checkJob.update({ where: { id: job.id }, data: { status } });
  }

  const results = await prisma.checkResult.findMany({
    where: { jobId: job.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    ok: true,
    status,
    pendingReview: remaining,
    results: results.map((r) => ({
      id: r.id,
      studentName: r.studentName,
      score: r.score,
      maxScore: r.maxScore,
      pct: r.pct,
      mark: r.mark,
      absent: r.absent,
      needsReview: r.needsReview,
    })),
  });
}
