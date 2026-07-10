// Генератор LaTeX-отчёта о проверке: статистика класса в красивом PDF.
// Философия v2: интерфейс не перегружаем — вся аналитика уезжает в документ.

import { distribution } from "../marks";

export interface ReportResultRow {
  studentName: string;
  score: number;
  maxScore: number;
  pct: number;
  mark: number | null;
  absent: boolean;
  answersJson?: string;
}

export interface CheckReportInput {
  title: string;
  className?: string | null;
  productTitle?: string | null;
  subject?: string | null; // math | informatics
  date: Date;
  teacherName?: string | null;
  results: ReportResultRow[];
  scale: { scale5: number; scale4: number; scale3: number };
}

export function escapeLatex(s: string): string {
  return s
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/([#$%&_{}])/g, "\\$1")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

function markCell(mark: number | null, absent: boolean): string {
  if (absent) return "\\markn{н}";
  if (mark == null) return "\\markn{—}";
  if (mark >= 5) return "\\markfive{5}";
  if (mark === 4) return "\\markfour{4}";
  if (mark === 3) return "\\markthree{3}";
  return "\\marktwo{2}";
}

/** Гистограмма распределения отметок из цветных \rule. */
function marksBar(counts: { m5: number; m4: number; m3: number; m2: number }): string {
  const max = Math.max(counts.m5, counts.m4, counts.m3, counts.m2, 1);
  const H = 20; // высота максимального столбика, мм
  const bar = (n: number, color: string, label: string) => {
    const h = Math.max((n / max) * H, n > 0 ? 1.5 : 0.4);
    return [
      `\\begin{minipage}[b]{13mm}\\centering`,
      `{\\footnotesize\\textbf{${n}}}\\\\[1mm]`,
      `{\\color{${color}}\\rule{8mm}{${h.toFixed(1)}mm}}\\\\[1mm]`,
      `{\\footnotesize ${label}}`,
      `\\end{minipage}`,
    ].join("\n");
  };
  // Без \hspace: 4 minipage по 13mm = 52mm — гарантированно входит в колонку 0.42\linewidth.
  return [
    bar(counts.m5, "mark5", "«5»"),
    bar(counts.m4, "mark4", "«4»"),
    bar(counts.m3, "mark3", "«3»"),
    bar(counts.m2, "mark2", "«2»"),
  ].join("%\n");
}

/** Разбор по заданиям: доля решивших каждое (если в answersJson есть данные). */
function taskBreakdown(results: ReportResultRow[]): { n: number; okPct: number }[] {
  const byTask = new Map<number, { ok: number; total: number }>();
  for (const r of results) {
    if (r.absent || !r.answersJson) continue;
    try {
      const arr = JSON.parse(r.answersJson) as { n?: number; ok?: boolean; correct?: boolean }[];
      if (!Array.isArray(arr)) continue;
      for (const a of arr) {
        const n = typeof a.n === "number" ? a.n : null;
        if (n == null) continue;
        const cur = byTask.get(n) ?? { ok: 0, total: 0 };
        cur.total++;
        if (a.ok === true || a.correct === true) cur.ok++;
        byTask.set(n, cur);
      }
    } catch {
      // пропускаем битые
    }
  }
  return Array.from(byTask.entries())
    .filter(([, v]) => v.total > 0)
    .sort((a, b) => a[0] - b[0])
    .map(([n, v]) => ({ n, okPct: Math.round((v.ok / v.total) * 100) }));
}

export function buildCheckReportTex(input: CheckReportInput): string {
  const d = distribution(
    input.results.map((r) => ({ pct: r.pct, mark: r.mark, absent: r.absent }))
  );
  const subjectName =
    input.subject === "informatics" ? "Информатика" : input.subject === "math" ? "Математика" : "";

  const rows = input.results
    .map((r, i) => {
      const name = escapeLatex(r.studentName);
      if (r.absent) {
        return `${i + 1} & ${name} & — & — & ${markCell(null, true)} \\\\`;
      }
      return `${i + 1} & ${name} & ${r.score} из ${r.maxScore} & ${r.pct.toFixed(0)}\\,\\% & ${markCell(
        r.mark,
        false
      )} \\\\`;
    })
    .join("\n");

  const tasks = taskBreakdown(input.results);
  const tasksBlock =
    tasks.length > 0
      ? `
\\section*{Решаемость по заданиям}
\\begin{tabular}{@{}l${"c".repeat(tasks.length)}@{}}
\\toprule
Задание ${tasks.map((t) => `& №${t.n}`).join(" ")} \\\\
\\midrule
Решили ${tasks
          .map(
            (t) =>
              `& ${
                t.okPct >= 70
                  ? `\\textcolor{mark5}{${t.okPct}\\,\\%}`
                  : t.okPct >= 40
                    ? `\\textcolor{mark3}{${t.okPct}\\,\\%}`
                    : `\\textcolor{mark2}{${t.okPct}\\,\\%}`
              }`
          )
          .join(" ")} \\\\
\\bottomrule
\\end{tabular}

\\medskip
{\\small Западающие задания (решаемость $<$ 40\\,\\%) стоит разобрать на следующем уроке.}
`
      : "";

  return `% Отчёт сгенерирован РабочийЛист.ai — ${new Date().toISOString()}
% Компиляция: xelatex report.tex
\\documentclass[11pt,a4paper]{article}
\\usepackage[margin=18mm,top=16mm,bottom=18mm]{geometry}
\\usepackage{fontspec}
\\setmainfont{${process.env.REPORT_FONT_MAIN || "Georgia"}}[Ligatures=TeX]
\\newfontfamily\\headfont{${process.env.REPORT_FONT_HEAD || "Segoe UI"}}[Ligatures=TeX]
\\usepackage{polyglossia}
\\setdefaultlanguage{russian}
\\usepackage{booktabs}
\\usepackage{longtable}
\\usepackage{xcolor}
\\usepackage{tikz}

% Палитра v2 «Тетрадь в клетку»
\\definecolor{ink}{HTML}{1C1917}
\\definecolor{paper}{HTML}{FDFCFA}
\\definecolor{primary}{HTML}{4F46E5}
\\definecolor{mark5}{HTML}{10B981}
\\definecolor{mark4}{HTML}{34D399}
\\definecolor{mark3}{HTML}{F59E0B}
\\definecolor{mark2}{HTML}{EF4444}
\\definecolor{soft}{HTML}{F7F5F0}

\\newcommand{\\markfive}[1]{\\textcolor{mark5}{\\textbf{#1}}}
\\newcommand{\\markfour}[1]{\\textcolor{mark4}{\\textbf{#1}}}
\\newcommand{\\markthree}[1]{\\textcolor{mark3}{\\textbf{#1}}}
\\newcommand{\\marktwo}[1]{\\textcolor{mark2}{\\textbf{#1}}}
\\newcommand{\\markn}[1]{\\textcolor{gray}{#1}}

\\pagestyle{empty}
\\setlength{\\parindent}{0pt}
\\color{ink}

\\begin{document}

% ── Шапка ──────────────────────────────────────────────
{\\headfont
{\\color{primary}\\Large\\textbf{РабочийЛист.ai}} \\hfill {\\small ${fmtDate(input.date)}}

\\vspace{2mm}
{\\huge\\textbf{Отчёт о проверке}}

\\vspace{1.5mm}
{\\large ${escapeLatex(input.title)}}
}

\\vspace{2mm}
\\textcolor{primary}{\\rule{\\linewidth}{1.2pt}}
\\vspace{2mm}

${input.className ? `\\textbf{Класс:} ${escapeLatex(input.className)} \\quad` : ""}${
    subjectName ? `\\textbf{Предмет:} ${subjectName} \\quad` : ""
  }${input.productTitle ? `\\textbf{Материал:} ${escapeLatex(input.productTitle)}` : ""}

\\section*{Итоги}

\\begin{minipage}[t]{0.54\\linewidth}
\\vspace{0pt}
\\begin{tabular}{@{}ll@{}}
Писали работу & \\textbf{${d.total - d.absent}} из ${d.total} \\\\[1mm]
Средний результат & \\textbf{${d.avgPct.toFixed(1).replace(".", ",")}\\,\\%} \\\\[1mm]
Средняя отметка & \\textbf{${d.avgMark.toFixed(2).replace(".", ",")}} \\\\[1mm]
Качество (4--5) & \\textbf{${
    d.total - d.absent > 0
      ? Math.round(((d.m5 + d.m4) / (d.total - d.absent)) * 100)
      : 0
  }\\,\\%} \\\\[1mm]
Успеваемость (3--5) & \\textbf{${
    d.total - d.absent > 0
      ? Math.round(((d.m5 + d.m4 + d.m3) / (d.total - d.absent)) * 100)
      : 0
  }\\,\\%} \\\\
\\end{tabular}
\\end{minipage}%
\\begin{minipage}[t]{0.42\\linewidth}
\\vspace{0pt}
\\centering
${marksBar(d)}
\\end{minipage}

\\medskip
{\\small Шкала: «5» от ${input.scale.scale5}\\,\\%, «4» от ${input.scale.scale4}\\,\\%, «3» от ${input.scale.scale3}\\,\\%.}

\\section*{Результаты}

\\begin{longtable}{@{}rlccc@{}}
\\toprule
№ & Ученик & Баллы & \\% & Отметка \\\\
\\midrule
\\endhead
${rows}
\\bottomrule
\\end{longtable}

${tasksBlock}

\\vfill
\\textcolor{primary}{\\rule{\\linewidth}{0.6pt}}

{\\footnotesize\\headfont Отчёт сформирован автоматически в кабинете учителя на \\textbf{РабочийЛист.ai}. ${
    input.teacherName ? `Учитель: ${escapeLatex(input.teacherName)}.` : ""
  }}

\\end{document}
`;
}
