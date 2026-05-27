// Vision-чекер заполненной работы.
//
// POST /api/check
//   FormData: file (image/jpeg|png|webp), worksheetId, studentName?
//
// Логика:
//   1. Загружаем worksheet + answer_key (поля и эталонные ответы) из БД.
//   2. Кодируем фото в base64.
//   3. Прогоняем через LLM-абстракцию с промптом check_worksheet.
//   4. Сохраняем фото на 5 минут (по 152-ФЗ), возвращаем результат.
//
// Утром: подключить vision-модель (Claude Sonnet или GigaChat-Vision).
// На mock-провайдере возвращает stub-ответ для отладки UI.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getProvider } from "@/lib/llm";
import { loadPrompt, renderTemplate } from "@/lib/llm/prompts";

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const uid = (session?.user as { id?: string } | undefined)?.id;
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch (e) {
    return NextResponse.json(
      { error: "invalid_multipart", detail: (e as Error).message },
      { status: 400 }
    );
  }

  const worksheetId = form.get("worksheetId");
  const file = form.get("file");
  const studentName = (form.get("studentName") as string) || "";

  if (typeof worksheetId !== "string" || !worksheetId) {
    return NextResponse.json({ error: "missing_worksheetId" }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing_file" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "file_too_large", limit: MAX_SIZE },
      { status: 413 }
    );
  }
  if (!ALLOWED_MIME.includes(file.type)) {
    return NextResponse.json(
      { error: "unsupported_mime", allowed: ALLOWED_MIME },
      { status: 415 }
    );
  }

  const ws = await prisma.worksheet.findUnique({ where: { id: worksheetId } });
  if (!ws) return NextResponse.json({ error: "worksheet_not_found" }, { status: 404 });
  if (ws.userId && ws.userId !== uid) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Загружаем answer_key — может лежать как файл (answerKeyPath) или быть в contentJson.
  let answerKey: { fields?: Array<{ task_id: string; expected: string; tolerance?: number }> } | null = null;
  if (ws.answerKeyPath) {
    try {
      const raw = await fs.readFile(ws.answerKeyPath, "utf-8");
      answerKey = JSON.parse(raw);
    } catch { /* пробуем contentJson ниже */ }
  }
  if (!answerKey) {
    try {
      const c = ws.contentJson ? JSON.parse(ws.contentJson) : null;
      if (c?.tasks) {
        answerKey = {
          fields: c.tasks.map((t: { n: number; expected_answer?: string; tolerance?: number }) => ({
            task_id: String(t.n),
            expected: t.expected_answer ?? "",
            tolerance: t.tolerance,
          })),
        };
      }
    } catch { /* */ }
  }
  if (!answerKey?.fields?.length) {
    return NextResponse.json(
      { error: "no_answer_key", detail: "У этого листа нет эталонов — сначала сгенерируйте контент." },
      { status: 422 }
    );
  }

  // Сохраняем фото временно (152-ФЗ: удалим через 5 мин cron-ом).
  const storageRoot = process.env.STORAGE_DIR || "./storage";
  const tempDir = path.join(storageRoot, "_temp_uploads", uid);
  await fs.mkdir(tempDir, { recursive: true });
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const tempPath = path.join(tempDir, `${randomUUID()}.${ext}`);
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(tempPath, buf);

  // Вызываем LLM с промптом check_worksheet.
  let llmResult: { text: string; json?: unknown; provider: string; model: string };
  try {
    const prompt = await loadPrompt("check_worksheet");
    const userText = renderTemplate(prompt.userTemplate, {
      worksheet_id: ws.id,
      student_name: studentName || "—",
      answer_key: JSON.stringify(answerKey, null, 2),
    });

    const provider = getProvider();
    const resp = await provider.generate({
      messages: [
        { role: "system", content: prompt.system },
        { role: "user", content: userText },
      ],
      attachments: [
        {
          kind: "image",
          data: buf.toString("base64"),
          mimeType: file.type,
        },
      ],
      jsonSchema: prompt.outputSchema as Record<string, unknown> | undefined,
      temperature: 0.2,
      maxTokens: 4096,
    });
    llmResult = {
      text: resp.text,
      json: resp.json,
      provider: resp.provider,
      model: resp.model,
    };
  } catch (e) {
    return NextResponse.json(
      { error: "llm_failed", detail: (e as Error).message },
      { status: 502 }
    );
  } finally {
    // Удаляем фото сразу после обработки — мы не оператор персданных.
    fs.unlink(tempPath).catch(() => {});
  }

  return NextResponse.json({
    ok: true,
    worksheetId: ws.id,
    studentName: studentName || null,
    provider: llmResult.provider,
    model: llmResult.model,
    result: llmResult.json ?? null,
    rawText: llmResult.json ? undefined : llmResult.text,
  });
}
