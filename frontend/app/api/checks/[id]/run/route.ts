// Запуск автопроверки загруженных работ.
//
// Если настроен vision-провайдер (LLM_PROVIDER=claude|openai|openrouter) и у продукта
// есть answerKeyJson — каждое фото прогоняется через промпт check_worksheet
// (+ checkInstructions продукта) и результат кладётся в CheckResult.
// Иначе — честный «ручной режим»: помечаем строки needsReview, учитель размечает
// в таблице, отметки считаются автоматически.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getLLMCapabilities, getProvider } from "@/lib/llm";
import { loadPrompt, renderTemplate } from "@/lib/llm/prompts";
import { extractLooseJson } from "@/lib/llm/json-extract";
import { readUploadedFile } from "@/lib/storage";
import { computeMark, computePct, DEFAULT_SCALE } from "@/lib/marks";
import { incrementChecksUsage } from "@/lib/entitlements";

export const runtime = "nodejs";
export const maxDuration = 300;

const VISION_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

interface LlmCheckOut {
  student_name?: string;
  results?: { n?: number; recognized?: string | null; correct?: boolean; points?: number }[];
  score?: number;
  max_score?: number;
  percent?: number;
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const job = await prisma.checkJob.findUnique({
    where: { id: params.id },
    include: { class: true, product: true, uploads: true },
  });
  if (!job || job.userId !== user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (job.uploads.length === 0) {
    return NextResponse.json({ error: "no_uploads" }, { status: 400 });
  }

  const scale = job.class
    ? { scale5: job.class.scale5, scale4: job.class.scale4, scale3: job.class.scale3 }
    : DEFAULT_SCALE;

  const llm = getLLMCapabilities();
  const canVision =
    llm.ready &&
    llm.vision &&
    !!job.product?.answerKeyJson &&
    job.uploads.some((u) => VISION_MIME.has(u.mimeType));

  if (!canVision) {
    // Ручной режим: строки остаются needsReview, статус → review
    await prisma.checkJob.update({
      where: { id: job.id },
      data: { status: "review" },
    });
    return NextResponse.json({
      ok: true,
      mode: "manual",
      message:
        "Автопроверка нейросетью будет доступна после подключения vision-модели. " +
        "Пока разметьте баллы в таблице — проценты и отметки считаются автоматически.",
    });
  }

  await prisma.checkJob.update({
    where: { id: job.id },
    data: { status: "processing" },
  });

  const prompt = await loadPrompt("check_worksheet");
  const provider = getProvider();
  const answerKey = job.product!.answerKeyJson!;
  const instructions = job.product!.checkInstructions ?? "";

  let processed = 0;
  let failed = 0;

  for (const up of job.uploads) {
    if (!VISION_MIME.has(up.mimeType)) continue;
    try {
      const buf = await readUploadedFile(up.path);
      let userText = renderTemplate(prompt.userTemplate, {
        answer_key: answerKey,
        student_name: "",
        image: "(изображение во вложении)",
      });
      if (instructions.trim()) {
        userText += `\n\nОсобенности проверки этого листа:\n${instructions.trim()}`;
      }
      const resp = await provider.generate({
        messages: [
          { role: "system", content: prompt.system },
          { role: "user", content: userText },
        ],
        attachments: [
          { kind: "image", data: buf.toString("base64"), mimeType: up.mimeType },
        ],
        jsonSchema: prompt.outputSchema,
        temperature: 0.1,
        maxTokens: 4096,
      });

      let out = (resp.json ?? extractLooseJson(resp.text)) as LlmCheckOut | undefined;
      if (!out || typeof out !== "object") throw new Error("llm_bad_json");

      const maxScore = out.max_score ?? job.maxScore ?? 0;
      const score = out.score ?? 0;
      const pct = computePct(score, maxScore);
      const mark = computeMark(pct, scale);
      const name = (out.student_name || up.filename).slice(0, 120);

      // Матчим по имени с префилленной строкой класса, иначе создаём новую
      const existing = await prisma.checkResult.findFirst({
        where: {
          jobId: job.id,
          studentName: { contains: name.split(" ")[0] },
          needsReview: true,
        },
      });

      const data = {
        answersJson: JSON.stringify(out.results ?? []),
        score,
        maxScore,
        pct,
        mark,
        needsReview: false,
      };
      if (existing) {
        await prisma.checkResult.update({ where: { id: existing.id }, data });
      } else {
        await prisma.checkResult.create({
          data: { jobId: job.id, studentName: name, ...data },
        });
      }
      processed++;
    } catch (e) {
      console.error("[checks/run] file failed", up.id, e);
      failed++;
    }
  }

  await prisma.checkJob.update({
    where: { id: job.id },
    data: { status: "review" },
  });
  await incrementChecksUsage(user.id, processed);

  return NextResponse.json({
    ok: true,
    mode: "llm",
    processed,
    failed,
  });
}
