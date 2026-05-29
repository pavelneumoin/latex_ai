import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import {
  checkWorksheetLimit,
  generateWorksheetContent,
  generateFromBank,
  incrementWorksheetUsage,
  safeParseJson,
} from "@/lib/worksheets";
import { checkRate, ipFromReq, rateLimited } from "@/lib/rate-limit";

export const runtime = "nodejs";

const createSchema = z.object({
  templateId: z.string().min(1).max(64),
  topic: z.string().min(1).max(500).optional(),
  subject: z.enum(["math", "informatics", "mixed"]).optional(),
  grade: z.number().int().min(1).max(11).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  // Стиль формулировок (как именно нейросеть формулирует условия).
  formulation_style: z
    .enum(["mixed", "formal", "friendly", "practical", "playful", "olympiad"])
    .optional(),
  // Тематический антураж для условий (например, «космос», «футбол»).
  context_theme: z.string().max(120).optional(),
  // Желаемые типы заданий (number, choice, fill_blank, true_false, matching, ...).
  task_types: z.array(z.string().max(24)).max(12).optional(),
  source: z.enum(["llm", "bank"]).optional().default("llm"),
  bank_filter: z.object({
    subject: z.enum(["math", "informatics"]).optional(),
    exam: z.enum(["ege", "ege_base", "oge"]).optional(),
    zadanie_n: z.number().int().min(1).max(30).optional(),
    topic: z.string().max(200).optional(),
    source: z.enum(["kompege", "fipi", "sdamgia", "umschool", "mathege", "mathege_base"]).optional(),
  }).optional(),
  params: z.record(z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Anti-burn-LLM-quota: не более 30 листов в час на пользователя (поверх плановых лимитов).
  // Лимиты подписки проверяются ниже отдельно.
  const r = checkRate("worksheets-create", user.id, { limit: 30, windowMs: 60 * 60_000 });
  if (!r.ok) return rateLimited(r);

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
      promptUsed: data.source === "bank" ? "bank_filter" : "generate_from_topic",
      paramsJson: JSON.stringify({
        ...(data.params ?? {}),
        ...(data.source === "bank"
          ? { source: "bank", bank_filter: data.bank_filter ?? {} }
          : {
              source: "llm",
              ...(data.formulation_style ? { formulation_style: data.formulation_style } : {}),
              ...(data.context_theme?.trim() ? { context_theme: data.context_theme.trim() } : {}),
              ...(data.task_types?.length ? { task_types: data.task_types } : {}),
            }),
      }),
    },
  });

  // Генерация
  try {
    const gen =
      data.source === "bank"
        ? await generateFromBank(
            {
              subject: data.bank_filter?.subject ?? (data.subject === "mixed" ? undefined : data.subject),
              exam: data.bank_filter?.exam,
              zadanie_n: data.bank_filter?.zadanie_n,
              topic: data.bank_filter?.topic ?? data.topic,
              source: data.bank_filter?.source,
            },
            tpl.taskCount
          )
        : await generateWorksheetContent("generate_from_topic", {
            topic: data.topic ?? tpl.name,
            subject: data.subject ?? tpl.subject,
            grade: data.grade ?? tpl.grade ?? undefined,
            difficulty: data.difficulty ?? "medium",
            task_count: tpl.taskCount,
            template: tpl.id,
            formulation_style: data.formulation_style,
            context_theme: data.context_theme,
            task_types: data.task_types?.length ? data.task_types.join(", ") : undefined,
            ...(data.params ?? {}),
          });

    // Если в parsed-контенте есть осмысленный title — используем его как название
    // листа, чтобы карточка /my/[id] не показывала «черновик».
    let finalTitle: string | undefined;
    try {
      const c = JSON.parse(gen.contentJson) as { title?: unknown };
      if (typeof c.title === "string" && c.title.trim()) finalTitle = c.title.trim();
    } catch { /* parsed JSON может быть пустым — оставляем исходный title */ }

    const updated = await prisma.worksheet.update({
      where: { id: ws.id },
      data: {
        status: "ready",
        contentJson: gen.contentJson,
        llmProvider: gen.provider,
        llmModel: gen.model,
        ...(finalTitle ? { title: finalTitle } : {}),
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
