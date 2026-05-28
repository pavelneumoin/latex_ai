import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/db";
import { getSessionUser, requireUser } from "@/lib/session";
import { safeParseJson } from "@/lib/worksheets";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  const id = params.id;

  const ws = await prisma.worksheet.findUnique({
    where: { id },
    include: { template: true },
  });

  if (!ws) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const isOwner = !!user && ws.userId === user.id;
  if (!isOwner && !ws.isPublic) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    worksheet: {
      id: ws.id,
      userId: ws.userId,
      templateId: ws.templateId,
      title: ws.title,
      topic: ws.topic,
      subject: ws.subject,
      grade: ws.grade,
      status: ws.status,
      variant: ws.variant,
      difficulty: ws.difficulty,
      parentId: ws.parentId,
      llmProvider: ws.llmProvider,
      llmModel: ws.llmModel,
      paramsJson: safeParseJson(ws.paramsJson),
      contentJson: safeParseJson(ws.contentJson),
      pdfPath: ws.pdfPath,
      answerKeyPath: ws.answerKeyPath,
      isPublic: ws.isPublic,
      publishedAt: ws.publishedAt,
      createdAt: ws.createdAt,
      updatedAt: ws.updatedAt,
      template: ws.template
        ? {
            id: ws.template.id,
            name: ws.template.name,
            description: ws.template.description,
            subject: ws.template.subject,
            layout: ws.template.layout,
            style: ws.template.style,
            taskCount: ws.template.taskCount,
          }
        : null,
    },
  });
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

  const ws = await prisma.worksheet.findUnique({ where: { id: params.id } });
  if (!ws) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (ws.userId !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Удаляем файлы артефактов на диске (если есть).
  for (const p of [ws.pdfPath, ws.answerKeyPath]) {
    if (p) {
      const abs = path.isAbsolute(p) ? p : path.join(process.cwd(), p);
      fs.unlink(abs).catch(() => { /* файл мог не существовать */ });
    }
  }

  // Удаляем сам лист. Связанные записи (Upload.worksheetId, Favorite, Publication, children)
  // сконфигурированы на onDelete: SetNull / Cascade в schema.prisma.
  await prisma.worksheet.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true, deletedId: params.id });
}
