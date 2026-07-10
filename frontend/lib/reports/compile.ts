// Компиляция LaTeX-отчётов в PDF через xelatex (если установлен).
// .tex сохраняется в storage всегда; PDF — при доступном xelatex.

import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { getStorageRoot } from "../storage";

const LATEX_CMD = process.env.LATEX_CMD || "xelatex";

let readyCache: boolean | null = null;

export async function latexAvailable(): Promise<boolean> {
  if (readyCache !== null) return readyCache;
  readyCache = await new Promise<boolean>((resolve) => {
    const which = process.platform === "win32" ? "where" : "which";
    const p = spawn(which, [LATEX_CMD], { shell: true });
    let ok = false;
    p.stdout.on("data", () => (ok = true));
    p.on("close", (code) => resolve(ok && code === 0));
    p.on("error", () => resolve(false));
  });
  return readyCache;
}

function runLatex(args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const p = spawn(LATEX_CMD, args, { cwd, shell: true });
    let stderr = "";
    let stdout = "";
    p.stdout.on("data", (d) => (stdout += d.toString()));
    p.stderr.on("data", (d) => (stderr += d.toString()));
    p.on("close", (code) => {
      if (code === 0) resolve();
      else
        reject(
          new Error(`xelatex exit ${code}: ${(stderr || stdout).slice(-600)}`)
        );
    });
    p.on("error", reject);
  });
}

export interface SavedReportFiles {
  texPath: string; // относительный путь в storage
  pdfPath: string | null;
}

/**
 * Сохранить .tex в storage/reports/<userId>/<reportId>.tex и попытаться собрать PDF.
 */
export async function saveAndCompileReport(
  userId: string,
  reportId: string,
  texSource: string
): Promise<SavedReportFiles> {
  const root = getStorageRoot();
  const safeUser = userId.replace(/[^a-zA-Z0-9_\-]/g, "_").slice(0, 80);
  const dir = path.join(root, "reports", safeUser);
  await fs.mkdir(dir, { recursive: true });

  const texAbs = path.join(dir, `${reportId}.tex`);
  await fs.writeFile(texAbs, texSource, "utf-8");
  const texRel = path.relative(root, texAbs).split(path.sep).join("/");

  if (!(await latexAvailable())) {
    return { texPath: texRel, pdfPath: null };
  }

  // Компилируем во временной папке, чтобы не мусорить .aux в storage.
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "rl-report-"));
  try {
    const tmpTex = path.join(tmp, "report.tex");
    await fs.writeFile(tmpTex, texSource, "utf-8");
    await runLatex(["-interaction=nonstopmode", "-halt-on-error", "report.tex"], tmp);

    const pdfAbs = path.join(dir, `${reportId}.pdf`);
    await fs.copyFile(path.join(tmp, "report.pdf"), pdfAbs);
    const pdfRel = path.relative(root, pdfAbs).split(path.sep).join("/");
    return { texPath: texRel, pdfPath: pdfRel };
  } catch (e) {
    console.error("[reports] xelatex failed:", (e as Error).message);
    return { texPath: texRel, pdfPath: null };
  } finally {
    fs.rm(tmp, { recursive: true, force: true }).catch(() => {});
  }
}
