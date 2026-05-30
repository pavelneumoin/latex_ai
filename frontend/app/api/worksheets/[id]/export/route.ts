// Единый эндпоинт экспорта рабочего листа.
// Использование:
//   GET /api/worksheets/<id>/export?format=pdf
//   GET /api/worksheets/<id>/export?format=docx
//   GET /api/worksheets/<id>/export?format=latex
//
// Auth: владелец листа ИЛИ публичный (isPublic=true).
// Если pdf и xelatex недоступен — 503 с подсказкой. docx всегда работает (fallback).

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getExporter } from "@/lib/exporters";
import type { ExportFormat, WorksheetContent } from "@/lib/exporters/types";

const VALID: ExportFormat[] = ["pdf", "docx", "latex"];

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const url = new URL(req.url);
  const format = (url.searchParams.get("format") || "pdf").toLowerCase() as ExportFormat;
  const includeAnswers = ["1", "true", "yes"].includes((url.searchParams.get("answers") || "").toLowerCase());

  if (!VALID.includes(format)) {
    return NextResponse.json(
      { error: "invalid_format", allowed: VALID },
      { status: 400 }
    );
  }

  const ws = await prisma.worksheet.findUnique({
    where: { id: params.id },
    include: { template: true, user: true },
  });
  if (!ws) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (!ws.isPublic) {
    const session = await getServerSession(authOptions);
    const uid = (session?.user as { id?: string } | undefined)?.id;
    if (!uid || uid !== ws.userId) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  }

  let content: WorksheetContent;
  try {
    const parsed = ws.contentJson ? JSON.parse(ws.contentJson) : null;
    if (!parsed?.tasks?.length) {
      return NextResponse.json(
        { error: "no_content", detail: "Лист пустой — сначала сгенерируйте контент." },
        { status: 422 }
      );
    }
    content = {
      title: parsed.title || ws.title || "Рабочий лист",
      subtitle: parsed.subtitle,
      subject: ws.subject ?? undefined,
      grade: ws.grade ?? undefined,
      topic: ws.topic ?? undefined,
      templateId: ws.templateId,
      tasks: parsed.tasks,
    };
  } catch (e) {
    return NextResponse.json(
      { error: "bad_content_json", detail: (e as Error).message },
      { status: 500 }
    );
  }

  const exporter = getExporter(format);
  if (!(await exporter.isReady())) {
    return NextResponse.json(
      {
        error: "exporter_not_ready",
        format,
        hint:
          format === "pdf"
            ? "Установите xelatex (TeX Live / MiKTeX) или задайте LATEX_CMD в .env.local."
            : "Экспортёр не настроен.",
      },
      { status: 503 }
    );
  }

  try {
    const result = await exporter.export({
      worksheetId: ws.id,
      content,
      templateId: ws.templateId,
      includeAnswers,
      brand: ws.user
        ? {
            teacherName: ws.user.name ?? undefined,
            school: ws.user.school ?? undefined,
            logoPath: ws.user.logoPath ?? undefined,
            watermark: ws.user.watermark ?? undefined,
            accentColor: ws.user.accentColor ?? undefined,
          }
        : undefined,
    });

    if (!result.data) {
      return NextResponse.json({ error: "empty_export" }, { status: 500 });
    }

    const filename = includeAnswers
      ? result.filename.replace(/(\.[^.]+)$/, "_ключ$1")
      : result.filename;

    return new NextResponse(new Uint8Array(result.data), {
      status: 200,
      headers: {
        "Content-Type": result.mimeType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    const msg = (e as Error).message;
    const code = msg.startsWith("latex_not_installed") ? 503 : 500;
    return NextResponse.json({ error: "export_failed", detail: msg }, { status: code });
  }
}
