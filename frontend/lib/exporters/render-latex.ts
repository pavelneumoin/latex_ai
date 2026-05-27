// Рендер JSON contentJson → .tex по выбранному шаблону.
// Базовая стратегия: берём skeleton-шаблон (frontend/lib/exporters/templates/<id>.tex.tpl)
// или fallback на универсальный skeleton, подставляем title/subtitle/задачи.
//
// На утро: можно расширить — каждый шаблон T1-T35 может иметь свой .tex.tpl с уникальной вёрсткой.
// Сейчас же — один универсальный skeleton с переопределением `wcprimary` и `\TaskBox` под style-слаг.

import { promises as fs } from "node:fs";
import path from "node:path";
import type { WorksheetContent } from "./types";

interface StyleSpec {
  /** HTML цвет акцента (без #) */
  accent: string;
  /** Шрифт-команда: \sffamily, \rmfamily, \ttfamily */
  fontCmd: string;
  /** Дополнительный preamble (например, \pagecolor{black}) */
  extraPreamble?: string;
  /** Кастомный TaskBox-renewcommand (опционально) */
  taskBoxOverride?: string;
}

// Карта style-слаг → визуальные параметры. Утром можно расширять без изменения движка.
const STYLE_MAP: Record<string, StyleSpec> = {
  classic_wildcat_purple: { accent: "5B2E91", fontCmd: "" },
  compact_underline: { accent: "5B2E91", fontCmd: "" },
  minimal_gray: { accent: "475569", fontCmd: "\\sffamily" },
  newspaper_navy: { accent: "1E3A8A", fontCmd: "" },
  journal_amber: { accent: "B45309", fontCmd: "\\sffamily" },
  cards_emerald: { accent: "047857", fontCmd: "\\sffamily" },
  control_graphite: { accent: "1F2937", fontCmd: "" },
  notebook_ink: { accent: "1E40AF", fontCmd: "\\sffamily" },
  terminal_green: { accent: "059669", fontCmd: "\\ttfamily" },
  pastel_three_tones: { accent: "A78BFA", fontCmd: "\\sffamily" },
  oge_official_bw: { accent: "991B1B", fontCmd: "" },
  trainer_teal: { accent: "0D9488", fontCmd: "\\sffamily" },
  scandi_white: { accent: "1A1A1A", fontCmd: "\\sffamily" },
  retro_typewriter: { accent: "000000", fontCmd: "\\ttfamily" },
  space_dark: {
    accent: "A78BFA",
    fontCmd: "\\sffamily\\color{white}",
    extraPreamble: "\\pagecolor{black}\\color{white}",
  },
  victorian_ornate: { accent: "7C2D12", fontCmd: "" },
  exam_form: { accent: "4B5563", fontCmd: "" },
  quick_15min: { accent: "EA580C", fontCmd: "\\sffamily" },
  mental_grid_5x5: { accent: "0891B2", fontCmd: "\\sffamily" },
  code_python: { accent: "1D4ED8", fontCmd: "\\sffamily" },
  graphs_grid: { accent: "065F46", fontCmd: "\\sffamily" },
  olympiad_premium: { accent: "B45309", fontCmd: "" },
  sea_navy: { accent: "075985", fontCmd: "\\sffamily" },
  forest_green: { accent: "166534", fontCmd: "\\sffamily" },
  bingo_card: { accent: "DB2777", fontCmd: "\\sffamily" },
  maze_flow: { accent: "6D28D9", fontCmd: "\\sffamily" },
  table_grid: { accent: "374151", fontCmd: "\\sffamily" },
  algo_flowchart: { accent: "0EA5E9", fontCmd: "\\sffamily" },
  final_year_premium: { accent: "1E3A8A", fontCmd: "" },
  letter_format: { accent: "713F12", fontCmd: "" },
  flashcards_dual: { accent: "7C3AED", fontCmd: "\\sffamily" },
  wabisabi_asymmetric: { accent: "57534E", fontCmd: "\\sffamily" },
};

function escapeLatex(s: string): string {
  // Минимально безопасный escape для текстовых строк, идущих в LaTeX.
  // Формулы $...$ оставляем как есть — они уже LaTeX.
  return s
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}");
}

function escapeButPreserveMath(s: string): string {
  // Сохраняем $...$ и $$...$$ блоки нетронутыми, остальное escape'им.
  const parts = s.split(/(\$[^$]+\$)/);
  return parts
    .map((p) => (p.startsWith("$") && p.endsWith("$") ? p : escapeLatex(p)))
    .join("");
}

export interface RenderedLatex {
  texSource: string;
  /** Список файлов, которые нужны для компиляции (относительные пути от .tex). */
  auxFiles: { sourcePath: string; targetRelPath: string }[];
}

export async function renderLatex(
  content: WorksheetContent,
  styleSlug: string,
  brand?: { teacherName?: string; school?: string }
): Promise<RenderedLatex> {
  const style = STYLE_MAP[styleSlug] ?? STYLE_MAP.classic_wildcat_purple;

  const titleSafe = escapeButPreserveMath(content.title);
  const subtitleSafe = content.subtitle
    ? escapeButPreserveMath(content.subtitle)
    : `${content.subject ?? ""}${content.grade ? ` · ${content.grade} класс` : ""} · ${content.templateId}`;

  const tasksTex = content.tasks
    .map((t) => {
      const cond = escapeButPreserveMath(t.condition);
      return `\\TaskBox{${t.n}}{%\n  ${cond}\\par\n  \\vspace{1.5mm}\\hfill\\textbf{\\color{wcprimary}Ответ:}~\\AnswerField{${t.n}}%\n}`;
    })
    .join("\n\n");

  const teacherLine = brand?.teacherName
    ? `\\WorksheetSubtitle{${escapeLatex(brand.teacherName)}${brand.school ? ` · ${escapeLatex(brand.school)}` : ""}}`
    : "";

  const texSource = `% Сгенерировано автоматически РабочийЛист.ai
% Шаблон: ${content.templateId}  стиль: ${styleSlug}
\\documentclass[a4paper,11pt]{article}

\\usepackage{../../../../Lessons/_templates/preamble_worksheet}
\\usepackage{../_shared/worksheet_check}

\\definecolor{wcprimary}{HTML}{${style.accent}}
${style.extraPreamble ?? ""}

\\begin{document}
${style.fontCmd}

\\WorksheetTitle{${titleSafe}}
\\WorksheetSubtitle{${subtitleSafe}}
${teacherLine}
\\FirstPageHeader

${tasksTex}

\\WorksheetQR{${content.templateId}-${escapeLatex((content.topic || "").slice(0, 24)).replace(/\s+/g, "-")}/L1/v1}

\\end{document}
`;

  return {
    texSource,
    auxFiles: [],
  };
}

/** Stand-alone версия LaTeX-кода — без \usepackage путей к локальной Lessons-преамбуле.
 *  Используется для выгрузки в Overleaf (где соседнего Lessons-репо нет).
 *  Подключает минимальный набор пакетов из CTAN.
 *  brand.accentColor (HEX `#RRGGBB`) переопределяет цвет шаблона — это «брендинг учителя».
 *  brand.watermark — серый полупрозрачный диагональный знак на каждой странице. */
export async function renderLatexStandalone(
  content: WorksheetContent,
  styleSlug: string,
  brand?: {
    teacherName?: string;
    school?: string;
    accentColor?: string;
    watermark?: string;
    logoPath?: string;
  }
): Promise<RenderedLatex> {
  const style = STYLE_MAP[styleSlug] ?? STYLE_MAP.classic_wildcat_purple;
  // Брендинг переопределяет цвет шаблона, если указан (HEX «#RRGGBB» → без #).
  const accentHex = brand?.accentColor && /^#?[0-9a-fA-F]{6}$/.test(brand.accentColor)
    ? brand.accentColor.replace(/^#/, "")
    : style.accent;
  const titleSafe = escapeButPreserveMath(content.title);
  const subtitleSafe = content.subtitle
    ? escapeButPreserveMath(content.subtitle)
    : `${content.subject ?? ""}${content.grade ? ` · ${content.grade} класс` : ""}`;

  const tasksTex = content.tasks
    .map((t) => {
      const cond = escapeButPreserveMath(t.condition);
      return `\\begin{taskbox}{${t.n}}\n${cond}\\par\\vspace{1.5mm}\n\\hfill\\textbf{\\color{wcprimary}Ответ:}~\\AnswerField{${t.n}}\n\\end{taskbox}`;
    })
    .join("\n\n");

  const teacherLine = brand?.teacherName
    ? `\\textit{${escapeLatex(brand.teacherName)}${brand.school ? ` --- ${escapeLatex(brand.school)}` : ""}}\\par\\vspace{2mm}`
    : "";

  // Брендинг: водяной знак на каждой странице, если задан.
  const watermarkPreamble = brand?.watermark
    ? `\\usepackage{eso-pic}
\\AddToShipoutPictureBG{%
  \\AtPageCenter{%
    \\makebox(0,0){%
      \\rotatebox{45}{\\color{gray!18}\\fontsize{60pt}{72pt}\\bfseries\\sffamily ${escapeLatex(brand.watermark)}}%
    }%
  }%
}`
    : "";

  // Самодостаточный standalone: всё из CTAN, никаких ссылок на Lessons/_templates.
  const texSource = `% РабочийЛист.ai — самодостаточный LaTeX для Overleaf / локальной правки.
% Чтобы скомпилировать: xelatex (рекомендуется) или pdflatex.

\\documentclass[a4paper,11pt]{article}

\\usepackage[T2A]{fontenc}
\\usepackage[utf8]{inputenc}
\\usepackage[russian]{babel}
\\usepackage[margin=18mm]{geometry}
\\usepackage{xcolor}
\\usepackage{tikz}
\\usepackage{tcolorbox}
\\tcbuselibrary{skins,breakable}
\\usepackage{amsmath,amssymb}
\\usepackage{enumitem}
\\usepackage{fancyhdr}

\\definecolor{wcprimary}{HTML}{${accentHex}}
${style.extraPreamble ?? ""}
${watermarkPreamble}

% Поле для ответа ученика
\\newcommand{\\AnswerField}[1]{%
  \\tikz[baseline=-0.5ex]\\draw[thick,wcprimary] (0,0) rectangle (30mm,10mm);%
}

% Контейнер задачи
\\newtcolorbox{taskbox}[1]{%
  enhanced, breakable,
  colframe=wcprimary, colback=white, boxrule=0.8pt,
  arc=2mm, left=3mm, right=3mm, top=2mm, bottom=2mm,
  title={\\textbf{Задача №#1}}, coltitle=white,
  colbacktitle=wcprimary, fonttitle=\\small\\bfseries,
  attach boxed title to top left={yshift=-1mm, xshift=2mm},
  boxed title style={size=small, colframe=wcprimary, sharp corners, arc=0pt}
}

\\pagestyle{empty}

\\begin{document}
${style.fontCmd}

\\begin{center}
{\\Large\\bfseries\\color{wcprimary}${titleSafe}}\\\\[1mm]
{\\small\\itshape ${subtitleSafe}}
\\end{center}
\\vspace{2mm}

${teacherLine}

${tasksTex}

\\vfill
\\begin{center}\\tiny\\color{gray}Сгенерировано на \\textbf{РабочийЛист.ai}\\end{center}

\\end{document}
`;

  return { texSource, auxFiles: [] };
}

export async function loadCustomTemplate(templateId: string): Promise<string | null> {
  // На случай, если в будущем для конкретного шаблона лежит свой .tex.tpl.
  const tplPath = path.join(
    process.cwd(),
    "lib",
    "exporters",
    "templates",
    `${templateId}.tex.tpl`
  );
  try {
    return await fs.readFile(tplPath, "utf-8");
  } catch {
    return null;
  }
}
