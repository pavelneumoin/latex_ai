import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
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
