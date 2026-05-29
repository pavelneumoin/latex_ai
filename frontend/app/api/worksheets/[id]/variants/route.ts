import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import {
  generateFromBank,
  generateWorksheetContent,
  incrementVariantUsage,
  nextVariantLetter,
  safeParseJson,
} from "@/lib/worksheets";

type ParentParams = {
  source?: "llm" | "bank";
  formulation_style?: string;
  context_theme?: string;
  bank_filter?: {
    subject?: "math" | "informatics";
    exam?: "ege" | "ege_base" | "oge";
    zadanie_n?: number;
    topic?: string;
    source?: "kompege" | "fipi" | "sdamgia" | "umschool" | "mathege" | "mathege_base";
  };
};

export const runtime = "nodejs";

const schema = z.object({
  n: z.number().int().min(1).max(3).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  const n = parsed.data.n ?? 1;

  const parent = await prisma.worksheet.findUnique({
    where: { id: params.id },
  });
  if (!parent) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (parent.userId !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const original = safeParseJson(parent.contentJson);
  if (!original) {
    return NextResponse.json(
      { error: "parent_not_ready", detail: "contentJson отсутствует" },
      { status: 409 }
    );
  }

  // Определяем — был ли parent сделан из банка; если да, вариант тоже берём из банка
  // (другая случайная выборка по тем же фильтрам), а не дёргаем LLM.
  const parentParams = safeParseJson<ParentParams>(parent.paramsJson) ?? {};
  const isBankParent = parentParams.source === "bank" || parent.promptUsed === "bank_filter";

  const letters = (await nextVariantLetter(parent.id)).slice(0, n);
  if (letters.length < n) {
    return NextResponse.json(
      { error: "too_many_variants", detail: "Закончились буквы вариантов" },
      { status: 409 }
    );
  }

  // taskCount берём из шаблона parent.
  const tpl = await prisma.template.findUnique({ where: { id: parent.templateId } });
  const taskCount = tpl?.taskCount ?? 5;

  const created: unknown[] = [];

  for (const letter of letters) {
    const ws = await prisma.worksheet.create({
      data: {
        userId: user.id,
        templateId: parent.templateId,
        title: `${parent.title} (Вариант ${letter})`,
        topic: parent.topic,
        subject: parent.subject,
        grade: parent.grade,
        difficulty: parent.difficulty,
        parentId: parent.id,
        variant: letter,
        status: "generating",
        promptUsed: isBankParent ? "bank_filter" : "generate_more_variants",
        paramsJson: parent.paramsJson,
      },
    });

    try {
      const gen = isBankParent
        ? await generateFromBank(
            {
              subject: parentParams.bank_filter?.subject,
              exam: parentParams.bank_filter?.exam,
              zadanie_n: parentParams.bank_filter?.zadanie_n,
              topic: parentParams.bank_filter?.topic ?? parent.topic ?? undefined,
              source: parentParams.bank_filter?.source,
            },
            taskCount
          )
        : await generateWorksheetContent("generate_more_variants", {
            original,
            topic: parent.topic ?? undefined,
            subject: parent.subject ?? undefined,
            grade: parent.grade ?? undefined,
            difficulty: parent.difficulty,
            variant: letter,
            // Наследуем стиль формулировок и антураж от родителя — вариант
            // остаётся в том же стиле и получает повышенную температуру (разнообразие).
            formulation_style: parentParams.formulation_style,
            context_theme: parentParams.context_theme,
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
      created.push({
        id: updated.id,
        variant: updated.variant,
        status: updated.status,
        title: updated.title,
        contentJson: safeParseJson(updated.contentJson),
        createdAt: updated.createdAt,
      });
    } catch (e) {
      console.error("[variants] generation error", e);
      await prisma.worksheet.update({
        where: { id: ws.id },
        data: { status: "failed" },
      });
      created.push({
        id: ws.id,
        variant: ws.variant,
        status: "failed",
        error: (e as Error).message,
      });
    }
  }

  await incrementVariantUsage(user.id, letters.length);

  return NextResponse.json({ variants: created });
}
