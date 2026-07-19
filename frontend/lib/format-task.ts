// Движок «mini-markdown» для условий задач:
//   - $...$ и $$...$$ → настоящий KaTeX (v3: раньше был литерал — выглядело как баг)
//   - **bold** → жирный
//   - *italic* → курсив
//   - переносы строк сохраняются
//
// Используется в WorksheetPreview, /share/[id], превью конструктора и маркетплейса.
// Стили: katex/dist/katex.min.css подключён глобально в app/layout.tsx.
//
// Возвращает безопасный HTML-фрагмент: текст пробежан через htmlEscape,
// формулы — через katex.renderToString(throwOnError:false); при ошибке
// парсинга формула откатывается в моноширинный <span class="math">.

import katex from "katex";

const PROTECTED_HTML_REGEX = /[&<>"']/g;
const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function htmlEscape(s: string): string {
  return s.replace(PROTECTED_HTML_REGEX, (m) => HTML_ESCAPES[m] ?? m);
}

function renderFormula(expr: string, displayMode: boolean): string {
  try {
    return katex.renderToString(expr, {
      throwOnError: false,
      strict: false,
      displayMode,
      output: "htmlAndMathml",
    });
  } catch {
    // совсем битый TeX — показываем моноширинно, но не роняем страницу
    return `<span class="math">${htmlEscape(expr)}</span>`;
  }
}

// Плейсхолдер формулы обрамляется символом из Private Use Area — в реальном
// тексте он не встречается, поэтому фрагменты вроде «в ячейке F2» не путаются
// с плейсхолдером (раньше литерал " F2 " съедался финальной заменой).
const FORMULA_SENTINEL = "\uE000";

export function renderTaskCondition(condition: string): string {
  if (!condition) return "";
  // 1) Защищаем формулы плейсхолдерами: сначала $$...$$ (display), потом $...$ (inline)
  const formulas: { expr: string; display: boolean }[] = [];
  let s = condition.replace(/\$\$([^$]+)\$\$/g, (_, expr: string) => {
    formulas.push({ expr, display: true });
    return `${FORMULA_SENTINEL}${formulas.length - 1}${FORMULA_SENTINEL}`;
  });
  s = s.replace(/\$([^$\n]+)\$/g, (_, expr: string) => {
    formulas.push({ expr, display: false });
    return `${FORMULA_SENTINEL}${formulas.length - 1}${FORMULA_SENTINEL}`;
  });

  // 2) Escape HTML
  s = htmlEscape(s);

  // 3) **bold**
  s = s.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
  // 4) *italic*
  s = s.replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s)\.,;:!?]|$)/g, "$1<em>$2</em>");
  // 5) Переносы
  s = s.replace(/\n/g, "<br>");

  // 6) Возвращаем формулы — уже отрендеренные KaTeX
  s = s.replace(/\uE000(\d+)\uE000/g, (_, idx: string) => {
    const f = formulas[Number(idx)];
    if (!f) return "";
    return renderFormula(f.expr, f.display);
  });

  return s;
}

export function renderTaskAnswer(answer: string | undefined | null): string {
  if (answer == null || answer === "") return "—";
  return htmlEscape(String(answer));
}
