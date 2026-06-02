// POST /api/worksheets/from-image
//   FormData: file (1..4 изображений, поле "file" повторяется), templateId?, topic?, subject?, grade?
//
// Распознаёт задачи прямо с фотографии через vision-LLM (Claude / OpenAI).
// Если активный провайдер не умеет vision — честно отвечает 503 с подсказкой.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import {
  checkWorksheetLimit,
  generateWorksheetFromImages,
  incrementWorksheetUsage,
  providerSupportsVision,
  safeParseJson,
  type InputImage,
} from "@/lib/worksheets";
import { checkRate, rateLimited } from "@/lib/rate-limit";

export const runtime = "nodejs";

const MAX_SIZE = 8 * 1024 * 1024; // 8 MB на изображение
const MAX_IMAGES = 4;
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!providerSupportsVision()) {
    return NextResponse.json(
      {
        error: "vision_unavailable",
        hint:
          "Распознавание по фото временно недоступно на этом сервере. " +
          "Загрузите PDF с текстом на странице «Загрузить» — это работает уже сейчас.",
      },
      { status: 503 }
    );
  }

  const r = checkRate("worksheets-from-image", user.id, { limit: 10, windowMs: 60 * 60_000 });
  if (!r.ok) return rateLimited(r);

  let form: FormData;
  try {
    form = await req.formData();
  } catch (e) {
    return NextResponse.json({ error: "invalid_multipart", detail: (e as Error).message }, { status: 400 });
  }

  const rawFiles = form.getAll("file").filter((f): f is File => f instanceof File);
  const templateId = (form.get("templateId") as string) || "T1";
  const topic = (form.get("topic") as string) || "";
  const subject = (form.get("subject") as string) || "math";
  const gradeRaw = form.get("grade") as string | null;
  const grade = gradeRaw ? Math.min(11, Math.max(5, Number(gradeRaw))) : undefined;

  if (rawFiles.length === 0) {
    return NextResponse.json({ error: "missing_file", hint: "Прикрепите хотя бы одно фото" }, { status: 400 });
  }
  if (rawFiles.length > MAX_IMAGES) {
    return NextResponse.json({ error: "too_many_images", limit: MAX_IMAGES }, { status: 413 });
  }

  const images: InputImage[] = [];
  for (const file of rawFiles) {
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "file_too_large", limit: MAX_SIZE, filename: file.name },
        { status: 413 }
      );
    }
    if (!ALLOWED_MIME.includes(file.type)) {
      return NextResponse.json(
        {
          error: "unsupported_mime",
          allowed: ALLOWED_MIME,
          filename: file.name,
          hint:
            file.type === "image/heic" || file.type === "image/heif"
              ? "Формат HEIC (айфон) пока не поддерживается. В настройках камеры выберите «Наиболее совместимый» (JPEG) или загрузите скриншот."
              : "Поддерживаются JPG, PNG, WEBP.",
        },
        { status: 415 }
      );
    }
    const buf = Buffer.from(await file.arrayBuffer());
    images.push({ data: buf.toString("base64"), mimeType: file.type });
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

  const ws = await prisma.worksheet.create({
    data: {
      userId: user.id,
      templateId: tpl.id,
      title: topic.trim() || "Лист с фото",
      topic: topic.trim() || null,
      subject: subject || tpl.subject,
      grade: grade ?? tpl.grade ?? null,
      difficulty: "medium",
      status: "generating",
      promptUsed: "parse_image_to_tasks",
      paramsJson: JSON.stringify({ source: "image", images: rawFiles.length }),
    },
  });

  try {
    const gen = await generateWorksheetFromImages(images, {
      topic: topic || tpl.name,
      subject: subject || tpl.subject,
      grade: grade ?? tpl.grade ?? undefined,
    });

    // Проверяем, что хоть что-то распозналось.
    let taskCount = 0;
    let finalTitle: string | undefined;
    try {
      const c = JSON.parse(gen.contentJson) as { title?: unknown; tasks?: unknown[] };
      if (Array.isArray(c.tasks)) taskCount = c.tasks.length;
      if (typeof c.title === "string" && c.title.trim()) finalTitle = c.title.trim();
    } catch {
      /* */
    }

    if (taskCount === 0) {
      await prisma.worksheet.update({ where: { id: ws.id }, data: { status: "failed" } });
      return NextResponse.json(
        {
          error: "no_tasks_found",
          worksheetId: ws.id,
          hint: "На фото не удалось разобрать задачи. Сфотографируйте ближе и при хорошем свете, без бликов.",
        },
        { status: 422 }
      );
    }

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
      tasks: taskCount,
      images: rawFiles.length,
    });
  } catch (e) {
    console.error("[from-image] generation error", e);
    await prisma.worksheet.update({ where: { id: ws.id }, data: { status: "failed" } });
    return NextResponse.json(
      { error: "generation_failed", detail: (e as Error).message, worksheetId: ws.id },
      { status: 500 }
    );
  }
}
