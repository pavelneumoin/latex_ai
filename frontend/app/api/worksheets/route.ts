import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import {
  checkWorksheetLimit,
  generateWorksheetContent,
  incrementWorksheetUsage,
  safeParseJson,
} from "@/lib/worksheets";

export const runtime = "nodejs";

const createSchema = z.object({
  templateId: z.string().min(1).max(64),
  topic: z.string().min(1).max(500).optional(),
  subject: z.enum(["math", "informatics", "mixed"]).optional(),
  grade: z.number().int().min(1).max(11).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  params: z.record(z.unknown()).optional(),
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
  const data = parsed.data;

  // Лимиты
  const lim = await checkWorksheetLimit(user.id);
  if (!lim.ok) {
    return NextResponse.json(
      {
        error: "limit_reached",
        plan: lim.planId,
        limit: lim.limit,
        used: lim.used,
      },
      { status: 402 }
    );
  }

  // Шаблон должен существовать
  const tpl = await prisma.template.findUnique({
    where: { id: data.templateId },
  });
  if (!tpl) {
    return NextResponse.json({ error: "template_not_found" }, { status: 404 });
  }

  const title =
    data.topic ||
    (tpl.name ? `${tpl.name} — черновик` : "Без названия");

  const ws = await prisma.worksheet.create({
    data: {
      userId: user.id,
      templateId: tpl.id,
      title,
      topic: data.topic ?? null,
      subject: data.subject ?? tpl.subject,
      grade: data.grade ?? tpl.grade ?? null,
      difficulty: data.difficulty ?? "medium",
      status: "generating",
      promptUsed: "generate_from_topic",
      paramsJson: data.params ? JSON.stringify(data.params) : null,
    },
  });

  // Генерация
  try {
    const gen = await generateWorksheetContent("generate_from_topic", {
      topic: data.topic ?? tpl.name,
      subject: data.subject ?? tpl.subject,
      grade: data.grade ?? tpl.grade ?? undefined,
      difficulty: data.difficulty ?? "medium",
      task_count: tpl.taskCount,
      template: tpl.id,
      ...(data.params ?? {}),
    });

    const updated = await prisma.worksheet.update({
      where: { id: ws.id },
      data: {
        status: "ready",
        contentJson: gen.contentJson,
        llmProvider: gen.provider,
        llmModel: gen.model,
      },
    });

    // Уменьшаем счётчик ПОСЛЕ удачной генерации.
    await incrementWorksheetUsage(user.id);

    return NextResponse.json({
      worksheet: {
        id: updated.id,
        status: updated.status,
        title: updated.title,
        templateId: updated.templateId,
        contentJson: safeParseJson(updated.contentJson),
        createdAt: updated.createdAt,
      },
    });
  } catch (e) {
    console.error("[worksheets POST] generation error", e);
    await prisma.worksheet.update({
      where: { id: ws.id },
      data: { status: "failed" },
    });
    return NextResponse.json(
      {
        error: "generation_failed",
        detail: (e as Error).message,
        worksheetId: ws.id,
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(
    100,
    Math.max(1, Number(searchParams.get("limit") ?? "20") || 20)
  );
  const offset = Math.max(0, Number(searchParams.get("offset") ?? "0") || 0);

  const rows = await prisma.worksheet.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
    select: {
      id: true,
      title: true,
      topic: true,
      subject: true,
      grade: true,
      templateId: true,
      status: true,
      difficulty: true,
      variant: true,
      parentId: true,
      isPublic: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ worksheets: rows });
}
