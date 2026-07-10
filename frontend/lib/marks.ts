// Отметки по процентам: пороги настраиваются на класс (scale5/scale4/scale3).

export interface MarkScale {
  scale5: number; // % на «5»
  scale4: number;
  scale3: number;
}

export const DEFAULT_SCALE: MarkScale = { scale5: 85, scale4: 65, scale3: 40 };

export function computeMark(pct: number, scale: MarkScale = DEFAULT_SCALE): number {
  if (pct >= scale.scale5) return 5;
  if (pct >= scale.scale4) return 4;
  if (pct >= scale.scale3) return 3;
  return 2;
}

export function computePct(score: number, maxScore: number): number {
  if (maxScore <= 0) return 0;
  return Math.round((score / maxScore) * 1000) / 10;
}

export interface MarksDistribution {
  m5: number;
  m4: number;
  m3: number;
  m2: number;
  absent: number;
  total: number;
  avgPct: number;
  avgMark: number;
}

export function distribution(
  results: { pct: number; mark: number | null; absent: boolean }[]
): MarksDistribution {
  const d: MarksDistribution = {
    m5: 0,
    m4: 0,
    m3: 0,
    m2: 0,
    absent: 0,
    total: results.length,
    avgPct: 0,
    avgMark: 0,
  };
  let pctSum = 0;
  let markSum = 0;
  let counted = 0;
  for (const r of results) {
    if (r.absent) {
      d.absent++;
      continue;
    }
    counted++;
    pctSum += r.pct;
    const m = r.mark ?? computeMark(r.pct);
    markSum += m;
    if (m >= 5) d.m5++;
    else if (m === 4) d.m4++;
    else if (m === 3) d.m3++;
    else d.m2++;
  }
  d.avgPct = counted ? Math.round((pctSum / counted) * 10) / 10 : 0;
  d.avgMark = counted ? Math.round((markSum / counted) * 100) / 100 : 0;
  return d;
}
