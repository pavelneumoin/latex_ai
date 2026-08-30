import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export const runtime = "nodejs";

async function ownJob(userId: string, id: string) {
  const job = await prisma.checkJob.findUnique({ where: { id } });
  if (!job || job.userId !== userId) return null;
  return job;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const job = await ownJob(user.id, params.id);
  if (!job) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const [results, uploads, cls, product] = await Promise.all([
    prisma.checkResult.findMany({
      where: { jobId: job.id },
      orderBy: { createdAt: "asc" },
    }),
    prisma.upload.findMany({
      where: { checkJobId: job.id },
      orderBy: { createdAt: "asc" },
      select: { id: true, filename: true, size: true, createdAt: true },
    }),
    job.classId
      ? prisma.class.findUnique({ where: { id: job.classId } })
      : null,
    job.productId
      ? prisma.product.findUnique({
          where: { id: job.productId },
          select: { id: true, title: true, checkable: true },
        })
      : null,
  ]);

  return NextResponse.json({
    job: {
      id: job.id,
      title: job.title,
      status: job.status,
      totalTasks: job.totalTasks,
      maxScore: job.maxScore,
      classId: job.classId,
      productId: job.productId,
      createdAt: job.createdAt,
    },
    class: cls
      ? {
          id: cls.id,
          name: cls.name,
          scale5: cls.scale5,
          scale4: cls.scale4,
          scale3: cls.scale3,
        }
      : null,
    product: product
      ? { id: product.id, title: product.title, checkable: product.checkable }
      : null,
    results: results.map((r) => ({
      id: r.id,
      studentId: r.studentId,
      studentName: r.studentName,
      score: r.score,
      maxScore: r.maxScore,
      pct: r.pct,
      mark: r.mark,
      absent: r.absent,
      needsReview: r.needsReview,
      answersJson: r.answersJson,
    })),
    uploads,
  });
}

const patchSchema = z.object({
  title: z.string().min(1).max(160).optional(),
  status: z.enum(["draft", "uploaded", "processing", "review", "done", "failed"]).optional(),
  totalTasks: z.number().int().min(1).max(60).nullish(),
  maxScore: z.number().int().min(1).max(300).nullish(),
  notes: z.string().max(2000).nullish(),
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
  const job = await ownJob(user.id, params.id);
  if (!job) return NextResponse.json({ error: "not_found" }, { status: 404 });

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

  const updated = await prisma.checkJob.update({
    where: { id: job.id },
    data: parsed.data,
  });
  return NextResponse.json({ ok: true, status: updated.status });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const job = await ownJob(user.id, params.id);
  if (!job) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await prisma.checkJob.delete({ where: { id: job.id } });
  return NextResponse.json({ ok: true });
}
