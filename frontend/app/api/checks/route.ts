import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { checkChecksLimit } from "@/lib/entitlements";

export const runtime = "nodejs";

export async function GET() {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const jobs = await prisma.checkJob.findMany({
    where: { userId: user.id },
    include: {
      class: { select: { name: true } },
      product: { select: { title: true } },
      _count: { select: { results: true, uploads: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    checks: jobs.map((j) => ({
      id: j.id,
      title: j.title,
      status: j.status,
      className: j.class?.name ?? null,
      productTitle: j.product?.title ?? null,
      results: j._count.results,
      uploads: j._count.uploads,
      createdAt: j.createdAt,
    })),
  });
}

const createSchema = z.object({
  title: z.string().min(1).max(160),
  classId: z.string().min(1).nullish(),
  productId: z.string().min(1).nullish(),
  totalTasks: z.number().int().min(1).max(60).nullish(),
  maxScore: z.number().int().min(1).max(300).nullish(),
});

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  // Лимит проверок по подписке (бесплатный план: 10/мес)
  const limit = await checkChecksLimit(user.id);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "checks_limit", used: limit.used, limit: limit.limit },
      { status: 402 }
    );
  }

  const { title, classId, productId, totalTasks, maxScore } = parsed.data;

  if (classId) {
    const cls = await prisma.class.findUnique({ where: { id: classId } });
    if (!cls || cls.userId !== user.id) {
      return NextResponse.json({ error: "class_not_found" }, { status: 404 });
    }
  }
  let product = null;
  if (productId) {
    product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: "product_not_found" }, { status: 404 });
    }
  }

  // Максимум баллов: из ключа продукта, если есть
  let computedMax = maxScore ?? null;
  let computedTasks = totalTasks ?? null;
  if (product?.answerKeyJson) {
    try {
      const key = JSON.parse(product.answerKeyJson) as { points?: number }[];
      if (Array.isArray(key) && key.length > 0) {
        computedTasks = computedTasks ?? key.length;
        computedMax =
          computedMax ??
          key.reduce((s, k) => s + (typeof k.points === "number" ? k.points : 1), 0);
      }
    } catch {
      // некритично
    }
  }

  const job = await prisma.checkJob.create({
    data: {
      userId: user.id,
      title: title.trim(),
      classId: classId ?? null,
      productId: productId ?? null,
      totalTasks: computedTasks,
      maxScore: computedMax,
      status: "draft",
    },
  });

  // Префилл результатов учениками класса
  if (classId) {
    const students = await prisma.student.findMany({
      where: { classId },
      orderBy: [{ sortKey: "asc" }, { name: "asc" }],
    });
    if (students.length > 0) {
      await prisma.checkResult.createMany({
        data: students.map((s) => ({
          jobId: job.id,
          studentId: s.id,
          studentName: s.name,
          maxScore: computedMax ?? 0,
        })),
      });
    }
  }

  return NextResponse.json({ id: job.id }, { status: 201 });
}
