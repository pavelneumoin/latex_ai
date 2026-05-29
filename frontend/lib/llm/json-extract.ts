// Robust JSON extraction for LLM output.
//
// Проблема: GigaChat (и другие LLM) при ответе JSON-ом вставляют LaTeX с
// ОДИНАРНЫМ обратным слэшем прямо в строки: "$20\%$", "\frac{a}{b}", "\times".
// Это невалидные JSON-escape-последовательности → JSON.parse падает → лист
// уходит пустым. Раньше это ломало почти любую генерацию по математике.
//
// Решение: перед разбором удваиваем «одинокие» обратные слэши внутри строк,
// сохраняя корректные пары \\ и экранированные кавычки \". Так LaTeX доезжает
// в распарсенное значение как есть.

/**
 * Удвоить «одинокие» обратные слэши внутри JSON-строк.
 * Корректные пары \\ и \" сохраняются. Структура JSON (вне строк) не трогается.
 */
export function repairJsonBackslashes(s: string): string {
  let out = "";
  let inString = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (!inString) {
      out += ch;
      if (ch === '"') inString = true;
      continue;
    }
    // Внутри строки.
    if (ch === '"') {
      out += ch;
      inString = false;
      continue;
    }
    if (ch === "\\") {
      const next = s[i + 1];
      if (next === '"' || next === "\\") {
        // Уже валидная пара (\" или \\) — сохраняем как есть, пропускаем next.
        out += ch + next;
        i++;
        continue;
      }
      // Одинокий слэш (LaTeX: \frac, \%, \times, ...) — удваиваем.
      out += "\\\\";
      continue;
    }
    out += ch;
  }
  return out;
}

function stripFences(text: string): string {
  const t = text.trim();
  const m = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (m ? m[1] : t).trim();
}

/**
 * Извлечь JSON из текста LLM, устойчиво к LaTeX-слэшам и markdown-обёрткам.
 * Возвращает распарсенное значение или undefined, если совсем не вышло.
 *
 * Порядок: чиним слэши → parse; если нет — прямой parse; если нет —
 * вырезаем от первой `{`/`[` до последней `}`/`]` и чиним.
 */
export function extractLooseJson(text: string): unknown | undefined {
  if (!text || !text.trim()) return undefined;
  const body = stripFences(text);

  // 1) Repair-first: в нашем домене строки почти всегда содержат LaTeX, а не
  //    настоящие JSON-escape вроде \n. Поэтому сначала чиним.
  try {
    return JSON.parse(repairJsonBackslashes(body));
  } catch {
    /* next */
  }
  // 2) Прямой разбор (на случай уже-валидного JSON без LaTeX).
  try {
    return JSON.parse(body);
  } catch {
    /* next */
  }
  // 3) Вырезать внешний объект/массив и починить.
  const start = firstBraceIndex(body);
  const end = lastBraceIndex(body);
  if (start >= 0 && end > start) {
    const sliced = body.slice(start, end + 1);
    try {
      return JSON.parse(repairJsonBackslashes(sliced));
    } catch {
      /* give up */
    }
  }
  return undefined;
}

function firstBraceIndex(s: string): number {
  const obj = s.indexOf("{");
  const arr = s.indexOf("[");
  if (obj < 0) return arr;
  if (arr < 0) return obj;
  return Math.min(obj, arr);
}

function lastBraceIndex(s: string): number {
  return Math.max(s.lastIndexOf("}"), s.lastIndexOf("]"));
}
