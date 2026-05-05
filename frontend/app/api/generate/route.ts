import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import { promises as fs } from "node:fs";

// MVP: возвращает уже собранный PDF и answer_key.json для одного из 5 готовых шаблонов.
// Позже здесь будет реальный пайплайн: LLM генерирует задачи → LaTeX рендер → PDF.
const VALID_TEMPLATES = ["T1", "T2", "T3", "T4", "T5"] as const;

type ValidTemplate = (typeof VALID_TEMPLATES)[number];

// Папка с pre-built PDF/JSON относительно процесса (next dev / next start)
// frontend/ -> ../cli/output/{T}/ ...
const CLI_OUTPUT = path.join(process.cwd(), "..", "cli", "output");

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const tpl = (body as { template?: string })?.template;
  if (!tpl || !VALID_TEMPLATES.includes(tpl as ValidTemplate)) {
    return NextResponse.json({ error: "invalid_template" }, { status: 400 });
  }

  const t = tpl as ValidTemplate;
  const pdfPath = path.join(CLI_OUTPUT, t, `${t}.pdf`);
  const keyPath = path.join(CLI_OUTPUT, t, `${t}.answer_key.json`);

  try {
    await fs.access(pdfPath);
    const keyRaw = await fs.readFile(keyPath, "utf-8");
    const answerKey = JSON.parse(keyRaw);
    return NextResponse.json({
      pdfUrl: `/api/pdf/${t}`,
      answerKey,
      template: t,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "pdf_not_found", detail: (e as Error).message, pdfPath },
      { status: 500 }
    );
  }
}
