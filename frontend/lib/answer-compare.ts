// Сравнение ученического ответа с эталоном.
// Используется в текстовом чекере (POST /api/check-text).
// Не зависит от LLM — детерминированно.

export type AnswerType =
  | "number"
  | "fraction"
  | "expression"
  | "string"
  | "list"
  | "choice"
  | "multiple_choice"
  | "true_false"
  | "fill_blank"
  | "matching"
  | "short_text"
  | "open";

export interface CompareInput {
  expected: string;
  got: string;
  type?: AnswerType;
  tolerance?: number; // для number, относительная (0.01 → 1%)
  /** Варианты ответа — нужны для choice / multiple_choice / true_false / matching,
   *  чтобы засчитывать как текст варианта, так и его букву (А/Б/В) или номер. */
  options?: string[];
}

export interface CompareResult {
  correct: boolean;
  reason?: string;
  normalized_expected?: string;
  normalized_got?: string;
  /** true → задание нельзя проверить автоматически (open) — нужна ручная оценка. */
  manual?: boolean;
}

const SPACE_RE = /\s+/g;
const COMMA_DOT_RE = /,/g;

function trimSpaces(s: string): string {
  return s.replace(SPACE_RE, " ").trim();
}

function asNumberStrict(s: string): number | null {
  const t = s.replace(COMMA_DOT_RE, ".").replace(SPACE_RE, "");
  if (!/^-?\d+(\.\d+)?$/.test(t)) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function asFraction(s: string): { num: number; den: number } | null {
  const t = s.replace(SPACE_RE, "");
  // Allow minus in numerator and/or denominator: 1/2, -1/2, 1/-2, -1/-2
  const m = t.match(/^(-?\d+)\/(-?\d+)$/);
  if (!m) return null;
  const num = Number(m[1]);
  const den = Number(m[2]);
  if (!Number.isFinite(num) || !Number.isFinite(den) || den === 0) return null;
  return { num, den };
}

function reduceFrac(a: number, b: number): [number, number] {
  const g = gcd(Math.abs(a), Math.abs(b));
  return [a / g, b / g];
}
function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function compareNumber(expected: string, got: string, tol = 0): CompareResult {
  const e = asNumberStrict(expected);
  const g = asNumberStrict(got);
  if (e == null) return { correct: false, reason: "expected_not_number" };
  if (g == null) {
    // Возможно ученик написал дробь — приведём дробь к числу и сравним.
    const f = asFraction(got);
    if (f) {
      const v = f.num / f.den;
      const ok = tol > 0 ? Math.abs(v - e) <= Math.abs(e) * tol + 1e-9 : Math.abs(v - e) < 1e-9;
      return { correct: ok, normalized_expected: String(e), normalized_got: String(v) };
    }
    return { correct: false, reason: "got_not_number", normalized_expected: String(e) };
  }
  const ok = tol > 0 ? Math.abs(g - e) <= Math.abs(e) * tol + 1e-9 : Math.abs(g - e) < 1e-9;
  return { correct: ok, normalized_expected: String(e), normalized_got: String(g) };
}

function compareFraction(expected: string, got: string): CompareResult {
  const e = asFraction(expected);
  const g = asFraction(got);
  // Допускаем что ученик записал десятичной дробью.
  if (e && !g) {
    const gn = asNumberStrict(got);
    if (gn != null) {
      const ev = e.num / e.den;
      return { correct: Math.abs(gn - ev) < 1e-6, normalized_expected: `${e.num}/${e.den}`, normalized_got: String(gn) };
    }
  }
  if (!e || !g) return { correct: false, reason: "fraction_parse" };
  const [a1, b1] = reduceFrac(e.num, e.den);
  const [a2, b2] = reduceFrac(g.num, g.den);
  // Учтём знак: -1/2 == 1/-2
  const sign1 = (a1 < 0) !== (b1 < 0) ? -1 : 1;
  const sign2 = (a2 < 0) !== (b2 < 0) ? -1 : 1;
  const ok = sign1 === sign2 && Math.abs(a1) === Math.abs(a2) && Math.abs(b1) === Math.abs(b2);
  return { correct: ok, normalized_expected: `${a1}/${b1}`, normalized_got: `${a2}/${b2}` };
}

function compareString(expected: string, got: string): CompareResult {
  const e = trimSpaces(expected).toLowerCase().replace(/ё/g, "е");
  const g = trimSpaces(got).toLowerCase().replace(/ё/g, "е");
  return { correct: e === g, normalized_expected: e, normalized_got: g };
}

function compareList(expected: string, got: string): CompareResult {
  // Запятые или пробелы как разделитель, порядок неважен.
  const split = (s: string) => trimSpaces(s).split(/[,\s]+/).filter(Boolean).map((x) => x.toLowerCase());
  const e = split(expected).sort();
  const g = split(got).sort();
  if (e.length !== g.length) return { correct: false, normalized_expected: e.join(","), normalized_got: g.join(",") };
  for (let i = 0; i < e.length; i++) if (e[i] !== g[i]) return { correct: false, normalized_expected: e.join(","), normalized_got: g.join(",") };
  return { correct: true, normalized_expected: e.join(","), normalized_got: g.join(",") };
}

function norm(s: string): string {
  return trimSpaces(s).toLowerCase().replace(/ё/g, "е");
}

// Буква варианта → индекс (0-based). Поддержка кириллицы А-З и латиницы A-H.
const CYR_LETTERS = "абвгдежз";
const LAT_LETTERS = "abcdefgh";
function letterToIndex(s: string): number | null {
  const t = norm(s).replace(/[).:]+$/, "");
  if (t.length !== 1) return null;
  const c = CYR_LETTERS.indexOf(t);
  if (c >= 0) return c;
  const l = LAT_LETTERS.indexOf(t);
  return l >= 0 ? l : null;
}

// Привести ученический токен к «личности» варианта: совпадение по тексту,
// по букве (А/Б/В) или по номеру (1-based). Возвращает нормализованный текст
// варианта либо null, если не распознан.
function resolveOption(token: string, options: string[]): string | null {
  const t = norm(token);
  const byText = options.find((o) => norm(o) === t);
  if (byText) return norm(byText);
  const li = letterToIndex(token);
  if (li != null && li < options.length) return norm(options[li]);
  const ni = asNumberStrict(token);
  if (ni != null && Number.isInteger(ni) && ni >= 1 && ni <= options.length) {
    return norm(options[ni - 1]);
  }
  return null;
}

function splitTokens(s: string): string[] {
  return s.split(/[;,]+/).map((x) => x.trim()).filter(Boolean);
}

function compareChoice(expected: string, got: string, options?: string[]): CompareResult {
  const opts = (options ?? []).map(String).filter(Boolean);
  if (opts.length === 0) return compareString(expected, got);
  const expId = resolveOption(expected, opts) ?? norm(expected);
  const gotId = resolveOption(got, opts) ?? norm(got);
  return { correct: expId === gotId, normalized_expected: expId, normalized_got: gotId };
}

function compareMultiple(expected: string, got: string, options?: string[]): CompareResult {
  const opts = (options ?? []).map(String).filter(Boolean);
  const toSet = (s: string) =>
    new Set(splitTokens(s).map((tok) => (opts.length ? resolveOption(tok, opts) ?? norm(tok) : norm(tok))));
  const e = toSet(expected);
  const g = toSet(got);
  const ok = e.size > 0 && e.size === g.size && [...e].every((x) => g.has(x));
  return {
    correct: ok,
    normalized_expected: [...e].sort().join("; "),
    normalized_got: [...g].sort().join("; "),
  };
}

function compareMatching(expected: string, got: string): CompareResult {
  const normPair = (p: string) => norm(p).replace(/\s*[-—:→=]\s*/g, "-").replace(/\s+/g, "");
  const toSet = (s: string) => new Set(splitTokens(s).map(normPair).filter(Boolean));
  const e = toSet(expected);
  const g = toSet(got);
  const ok = e.size > 0 && e.size === g.size && [...e].every((x) => g.has(x));
  return {
    correct: ok,
    normalized_expected: [...e].sort().join("; "),
    normalized_got: [...g].sort().join("; "),
  };
}

function compareShort(expected: string, got: string, tol = 0): CompareResult {
  // Число — если эталон числовой; иначе строковое сравнение.
  if (asNumberStrict(expected) != null) {
    const r = compareNumber(expected, got, tol);
    if (r.correct) return r;
  }
  return compareString(expected, got);
}

export function compareAnswer(input: CompareInput): CompareResult {
  const exp = trimSpaces(input.expected ?? "");
  const got = trimSpaces(input.got ?? "");

  // open — развёрнутый ответ, автопроверке не подлежит (нужна ручная оценка).
  if (input.type === "open") {
    return { correct: false, manual: true, reason: "manual_review", normalized_expected: norm(exp) };
  }

  if (!got) return { correct: false, reason: "empty" };
  if (!exp) return { correct: false, reason: "no_expected" };

  // Если type не указан — попытаемся auto-detect.
  let type = input.type;
  if (!type) {
    if (asNumberStrict(exp) != null) type = "number";
    else if (asFraction(exp)) type = "fraction";
    else if (/[,\s]/.test(exp)) type = "list";
    else type = "string";
  }

  switch (type) {
    case "number": return compareNumber(exp, got, input.tolerance);
    case "fraction": return compareFraction(exp, got);
    case "list": return compareList(exp, got);
    case "choice":
    case "true_false":
      return compareChoice(exp, got, input.options);
    case "multiple_choice":
      return compareMultiple(exp, got, input.options);
    case "matching":
      return compareMatching(exp, got);
    case "fill_blank":
    case "short_text":
      return compareShort(exp, got, input.tolerance);
    case "expression":
      // Для expression — сравним как строки после удаления пробелов.
      {
        const e = exp.replace(SPACE_RE, "");
        const g = got.replace(SPACE_RE, "");
        return { correct: e === g, normalized_expected: e, normalized_got: g };
      }
    case "string":
    default:
      return compareString(exp, got);
  }
}

/** Шкала отметок (как в mesh-marks). */
export function percentToMark(percent: number): number {
  if (percent >= 86) return 5;
  if (percent >= 70) return 4;
  if (percent >= 50) return 3;
  return 2;
}
