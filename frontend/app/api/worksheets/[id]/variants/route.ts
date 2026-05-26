import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import {
  generateWorksheetContent,
  incrementVariantUsage,
  nextVariantLetter,
  safeParseJson,
} from "@/lib/worksheets";

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

  const letters = (await nextVariantLetter(parent.id)).slice(0, n);
  if (letters.length < n) {
    return NextResponse.json(
      { error: "too_many_variants", detail: "Закончились буквы вариантов" },
      { status: 409 }
    );
  }

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
        promptUsed: "generate_more_variants",
      },
    });

    try {
      const gen = await generateWorksheetContent("generate_more_variants", {
        original,
        topic: parent.topic ?? undefined,
        subject: parent.subject ?? undefined,
        grade: parent.grade ?? undefined,
        difficulty: parent.difficulty,
        variant: letter,
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
