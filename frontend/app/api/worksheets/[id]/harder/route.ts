import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import {
  generateWorksheetContent,
  incrementVariantUsage,
  safeParseJson,
} from "@/lib/worksheets";

export const runtime = "nodejs";

const schema = z.object({
  complexityStep: z.number().int().min(1).max(3).optional(),
});

const DIFF_ORDER = ["easy", "medium", "hard"] as const;

function bumpDifficulty(d: string, step: number): string {
  const i = DIFF_ORDER.indexOf(d as (typeof DIFF_ORDER)[number]);
  const cur = i < 0 ? 1 : i;
  const next = Math.min(DIFF_ORDER.length - 1, cur + step);
  return DIFF_ORDER[next];
}

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
  const complexityStep = parsed.data.complexityStep ?? 2;

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

  // Стиль формулировок и антураж родителя — чтобы усложнённый лист остался
  // в том же стиле.
  const parentParams =
    safeParseJson<{ formulation_style?: string; context_theme?: string }>(parent.paramsJson) ?? {};

  const newDiff = bumpDifficulty(parent.difficulty, complexityStep);

  const ws = await prisma.worksheet.create({
    data: {
      userId: user.id,
      templateId: parent.templateId,
      title: `${parent.title} (усложнённый)`,
      topic: parent.topic,
      subject: parent.subject,
      grade: parent.grade,
      difficulty: newDiff,
      parentId: parent.id,
      variant: "A",
      status: "generating",
      promptUsed: "generate_harder",
    },
  });

  try {
    const gen = await generateWorksheetContent("generate_harder", {
      original,
      topic: parent.topic ?? undefined,
      subject: parent.subject ?? undefined,
      grade: parent.grade ?? undefined,
      from_difficulty: parent.difficulty,
      to_difficulty: newDiff,
      complexityStep,
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

    await incrementVariantUsage(user.id, 1);

    return NextResponse.json({
      worksheet: {
        id: updated.id,
        status: updated.status,
        title: updated.title,
        difficulty: updated.difficulty,
        parentId: updated.parentId,
        contentJson: safeParseJson(updated.contentJson),
        createdAt: updated.createdAt,
      },
    });
  } catch (e) {
    console.error("[harder] generation error", e);
    await prisma.worksheet.update({
      where: { id: ws.id },
      data: { status: "failed" },
    });
    return NextResponse.json(
      { error: "generation_failed", detail: (e as Error).message, worksheetId: ws.id },
      { status: 500 }
    );
  }
}
