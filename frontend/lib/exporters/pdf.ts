// PDF-экспортёр через xelatex.
// Стратегия: рендерим standalone .tex во временную папку, запускаем xelatex -interaction=nonstopmode,
// читаем .pdf обратно как Buffer.
//
// Если LATEX_CMD не настроен / не установлен — isReady() = false, маршрутизатор отдаст 503
// с подсказкой подключить LaTeX-окружение.

import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { renderLatexStandalone } from "./render-latex";
import type { Exporter, ExportInput, ExportResult } from "./types";

const LATEX_CMD = process.env.LATEX_CMD || "xelatex";

async function commandExists(cmd: string): Promise<boolean> {
  return new Promise((resolve) => {
    const which = process.platform === "win32" ? "where" : "which";
    const p = spawn(which, [cmd], { shell: true });
    let ok = false;
    p.stdout.on("data", () => (ok = true));
    p.on("close", (code) => resolve(ok && code === 0));
    p.on("error", () => resolve(false));
  });
}

export class PdfExporter implements Exporter {
  readonly format = "pdf" as const;
  readonly name = "pdf-xelatex";

  private readyCache: boolean | null = null;

  async isReady() {
    if (this.readyCache !== null) return this.readyCache;
    this.readyCache = await commandExists(LATEX_CMD);
    return this.readyCache;
  }

  async export(input: ExportInput): Promise<ExportResult> {
    const ready = await this.isReady();
    if (!ready) {
      throw new Error(
        `latex_not_installed: команда "${LATEX_CMD}" недоступна. Установите TeX Live / MiKTeX или задайте LATEX_CMD в .env.local.`
      );
    }

    const styleSlug = await pickStyle(input.templateId);
    const rendered = await renderLatexStandalone(input.content, styleSlug, input.brand);

    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "rl-pdf-"));
    const texPath = path.join(tmpDir, "ws.tex");
    await fs.writeFile(texPath, rendered.texSource, "utf-8");

    // Запускаем дважды, чтобы zref-savepos сошёлся (если используется).
    for (let i = 0; i < 2; i++) {
      await runLatex(LATEX_CMD, ["-interaction=nonstopmode", "-halt-on-error", texPath], tmpDir);
    }

    const pdfPath = path.join(tmpDir, "ws.pdf");
    const data = await fs.readFile(pdfPath);

    // Чистим временную папку асинхронно (не блокируем ответ).
    fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});

    const safeTitle = slugifyAscii(input.content.title);
    return {
      format: "pdf",
      filename: `${safeTitle || "worksheet"}-${input.worksheetId}.pdf`,
      mimeType: "application/pdf",
      data,
    };
  }
}

async function pickStyle(templateId: string): Promise<string> {
  try {
    const { prisma } = await import("../db");
    const tpl = await prisma.template.findUnique({ where: { id: templateId } });
    return tpl?.style || "classic_wildcat_purple";
  } catch {
    return "classic_wildcat_purple";
  }
}

function runLatex(cmd: string, args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { cwd, shell: true });
    let stderr = "";
    p.stderr.on("data", (d) => (stderr += d.toString()));
    p.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`xelatex exit ${code}: ${stderr.slice(0, 500)}`));
    });
    p.on("error", reject);
  });
}

function slugifyAscii(s: string): string {
  return s
    .toLowerCase()
    .replace(/[а-яё]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
