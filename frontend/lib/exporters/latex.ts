// Экспортёр LaTeX: отдаём готовый .tex как файл.
// Поддерживает 2 режима:
//  - "standalone"  — самодостаточный .tex без зависимостей от Lessons/_templates
//                    (для Overleaf, для скачивания учителем на свой компьютер).
//  - "linked"      — .tex с \usepackage{../../../../Lessons/_templates/...}
//                    (для локальной компиляции внутри репо).
//
// По умолчанию — standalone (самый универсальный).

import { renderLatex, renderLatexStandalone } from "./render-latex";
import type { Exporter, ExportInput, ExportResult } from "./types";

export class LatexExporter implements Exporter {
  readonly format = "latex" as const;
  readonly name = "latex";

  constructor(private mode: "standalone" | "linked" = "standalone") {}

  isReady() {
    return true;
  }

  async export(input: ExportInput): Promise<ExportResult> {
    const styleSlug = await pickStyle(input.templateId);
    const rendered =
      this.mode === "standalone"
        ? await renderLatexStandalone(input.content, styleSlug, input.brand)
        : await renderLatex(input.content, styleSlug, input.brand);

    const data = Buffer.from(rendered.texSource, "utf-8");
    const safeTitle = slugifyAscii(input.content.title);

    return {
      format: "latex",
      filename: `${safeTitle || "worksheet"}-${input.worksheetId}.tex`,
      mimeType: "application/x-tex",
      data,
    };
  }
}

async function pickStyle(templateId: string): Promise<string> {
  // Ленивая зависимость на Prisma, чтобы lib/exporters/ можно было unit-тестировать без БД.
  try {
    const { prisma } = await import("../db");
    const tpl = await prisma.template.findUnique({ where: { id: templateId } });
    return tpl?.style || "classic_wildcat_purple";
  } catch {
    return "classic_wildcat_purple";
  }
}

function slugifyAscii(s: string): string {
  return s
    .toLowerCase()
    .replace(/[а-яё]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
