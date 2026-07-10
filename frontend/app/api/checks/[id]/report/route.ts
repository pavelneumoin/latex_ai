// Сформировать LaTeX-отчёт по проверке (+PDF, если xelatex доступен).

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { buildCheckReportTex } from "@/lib/reports/check-report";
import { saveAndCompileReport } from "@/lib/reports/compile";
import { DEFAULT_SCALE } from "@/lib/marks";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(
  _req: NextRequest,
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
    include: {
      class: true,
      product: { select: { title: true, subject: true } },
      results: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!job || job.userId !== user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (job.results.length === 0) {
    return NextResponse.json({ error: "no_results" }, { status: 400 });
  }

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true },
  });

  const tex = buildCheckReportTex({
    title: job.title,
    className: job.class?.name ?? null,
    productTitle: job.product?.title ?? null,
    subject: job.class?.subject ?? job.product?.subject ?? null,
    date: new Date(),
    teacherName: profile?.name ?? null,
    results: job.results.map((r) => ({
      studentName: r.studentName,
      score: r.score,
      maxScore: r.maxScore,
      pct: r.pct,
      mark: r.mark,
      absent: r.absent,
      answersJson: r.answersJson,
    })),
    scale: job.class
      ? { scale5: job.class.scale5, scale4: job.class.scale4, scale3: job.class.scale3 }
      : DEFAULT_SCALE,
  });

  const report = await prisma.report.create({
    data: {
      userId: user.id,
      kind: "check",
      jobId: job.id,
      title: `Отчёт: ${job.title}`,
      status: "generating",
    },
  });

  try {
    const files = await saveAndCompileReport(user.id, report.id, tex);
    const updated = await prisma.report.update({
      where: { id: report.id },
      data: {
        status: "ready",
        texPath: files.texPath,
        pdfPath: files.pdfPath,
      },
    });
    return NextResponse.json({
      ok: true,
      report: {
        id: updated.id,
        title: updated.title,
        hasPdf: !!updated.pdfPath,
      },
    });
  } catch (e) {
    await prisma.report.update({
      where: { id: report.id },
      data: { status: "failed" },
    });
    console.error("[checks/report] failed", e);
    return NextResponse.json(
      { error: "report_failed", detail: (e as Error).message },
      { status: 500 }
    );
  }
}
