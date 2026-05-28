// POST /api/worksheets/from-pdf
//   FormData: file (application/pdf, max 10MB), templateId, topic?, subject?, grade?
//
// Извлекает текст из PDF через pdf-parse → отправляет в LLM с промптом parse_pdf_to_tasks →
// получает JSON-задач → создаёт worksheet. Никакого vision не требует — для text-based PDF.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import {
  checkWorksheetLimit,
  generateWorksheetContent,
  incrementWorksheetUsage,
  safeParseJson,
} from "@/lib/worksheets";
import { checkRate, ipFromReq, rateLimited } from "@/lib/rate-limit";

export const runtime = "nodejs";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME = ["application/pdf"];

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const r = checkRate("worksheets-from-pdf", user.id, { limit: 10, windowMs: 60 * 60_000 });
  if (!r.ok) return rateLimited(r);

  let form: FormData;
  try { form = await req.formData(); } catch (e) {
    return NextResponse.json({ error: "invalid_multipart", detail: (e as Error).message }, { status: 400 });
  }

  const file = form.get("file");
  const templateId = (form.get("templateId") as string) || "T1";
  const topic = (form.get("topic") as string) || "";
  const subject = (form.get("subject") as string) || "math";
  const gradeRaw = form.get("grade") as string | null;
  const grade = gradeRaw ? Math.min(11, Math.max(5, Number(gradeRaw))) : undefined;

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing_file" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "file_too_large", limit: MAX_SIZE }, { status: 413 });
  }
  if (!ALLOWED_MIME.includes(file.type)) {
    return NextResponse.json({ error: "unsupported_mime", allowed: ALLOWED_MIME }, { status: 415 });
  }

  // Извлекаем текст
  let pdfText = "";
  try {
    const buf = Buffer.from(await file.arrayBuffer());
    // pdf-parse — динамический импорт, чтобы Next-сборка не запускала его при build (он трогает test-файлы)
    const { default: pdfParse } = await import("pdf-parse");
    const parsed = await pdfParse(buf);
    pdfText = (parsed.text ?? "").trim();
  } catch (e) {
    return NextResponse.json(
      { error: "pdf_parse_failed", detail: (e as Error).message, hint: "Возможно, PDF — это скан (картинка). Для сканов нужен vision-чекер." },
      { status: 422 }
    );
  }

  if (!pdfText || pdfText.length < 30) {
    return NextResponse.json(
      { error: "pdf_empty", hint: "Не удалось извлечь текст из PDF. Если это скан — нужен vision-чекер (в разработке)." },
      { status: 422 }
    );
  }

  // Лимит по плану
  const lim = await checkWorksheetLimit(user.id);
  if (!lim.ok) {
    return NextResponse.json(
      { error: "limit_reached", plan: lim.planId, limit: lim.limit, used: lim.used },
      { status: 402 }
    );
  }

  const tpl = await prisma.template.findUnique({ where: { id: templateId } });
  if (!tpl) return NextResponse.json({ error: "template_not_found" }, { status: 404 });

  // Создаём worksheet с status: generating
  const ws = await prisma.worksheet.create({
    data: {
      userId: user.id,
      templateId: tpl.id,
      title: topic.trim() || "Лист из PDF",
      topic: topic.trim() || null,
      subject: subject || tpl.subject,
      grade: grade ?? tpl.grade ?? null,
      difficulty: "medium",
      status: "generating",
      promptUsed: "parse_pdf_to_tasks",
      paramsJson: JSON.stringify({ source: "pdf", filename: file.name, size: file.size }),
    },
  });

  try {
    const gen = await generateWorksheetContent("parse_pdf_to_tasks", {
      pdf_text: pdfText.slice(0, 20_000), // cap input → ~5k токенов
      topic: topic || tpl.name,
      subject: subject || tpl.subject,
      grade: grade ?? tpl.grade ?? undefined,
    });

    let finalTitle: string | undefined;
    try {
      const c = JSON.parse(gen.contentJson) as { title?: unknown };
      if (typeof c.title === "string" && c.title.trim()) finalTitle = c.title.trim();
    } catch { /* */ }

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
      pdf_chars: pdfText.length,
    });
  } catch (e) {
    console.error("[from-pdf] generation error", e);
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
