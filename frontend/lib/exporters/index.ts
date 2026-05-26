// Реестр экспортёров.
// Использование:
//   import { getExporter } from "@/lib/exporters";
//   const exp = getExporter("docx");
//   const result = await exp.export({ worksheetId, content, templateId, brand });

import { DocxExporter } from "./docx";
import { LatexExporter } from "./latex";
import { PdfExporter } from "./pdf";
import type { Exporter, ExportFormat } from "./types";

const registry: Record<ExportFormat, Exporter> = {
  pdf: new PdfExporter(),
  docx: new DocxExporter(),
  latex: new LatexExporter("standalone"),
  // latex-zip — отдельный путь, обрабатывается напрямую в API роуте (zipping .tex + assets).
  "latex-zip": new LatexExporter("standalone"),
  html: new LatexExporter("standalone"), // placeholder, на утро добавим HTMLExporter.
};

export function getExporter(format: ExportFormat): Exporter {
  return registry[format];
}

export function listExporters(): { format: ExportFormat; name: string }[] {
  return Object.values(registry).map((e) => ({ format: e.format, name: e.name }));
}

export type { Exporter, ExportInput, ExportResult, ExportFormat, WorksheetContent } from "./types";
