// Сравнение ученического ответа с эталоном.
// Используется в текстовом чекере (POST /api/check-text).
// Не зависит от LLM — детерминированно.

export type AnswerType = "number" | "fraction" | "expression" | "string" | "list";

export interface CompareInput {
  expected: string;
  got: string;
  type?: AnswerType;
  tolerance?: number; // для number, относительная (0.01 → 1%)
}

export interface CompareResult {
  correct: boolean;
  reason?: string;
  normalized_expected?: string;
  normalized_got?: string;
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

export function compareAnswer(input: CompareInput): CompareResult {
  const exp = trimSpaces(input.expected ?? "");
  const got = trimSpaces(input.got ?? "");
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
    case "expression":
    case "string":
    default:
      // Для expression — попробуем сравнить как строки после удаления пробелов.
      if (type === "expression") {
        const e = exp.replace(SPACE_RE, "");
        const g = got.replace(SPACE_RE, "");
        return { correct: e === g, normalized_expected: e, normalized_got: g };
      }
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
