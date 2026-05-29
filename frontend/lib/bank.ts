// Модуль чтения банка задач (ФИПИ ЕГЭ/ОГЭ, kompege, sdamgia/решуЕГЭ).
//
// Источник: `frontend/data/bank.json` — собран из Lessons/vault через
// `cli/build_bank_index.py`. ~8.5k задач, ~17 МБ. Не коммитится в git (см. .gitignore).
//
// На сервере читается один раз в память при первом обращении.

import { promises as fs } from "node:fs";
import path from "node:path";

export interface BankTask {
  id: string;
  source: "kompege" | "fipi" | "sdamgia" | "umschool" | "mathege" | "mathege_base";
  subject: "math" | "informatics";
  exam: "ege" | "ege_base" | "oge";
  zadanie_n: number | null;
  topic: string;
  subtype: string;
  condition: string;
  expected_answer: string;
  answer_type: "number" | "fraction" | "expression" | "string";
  solution: string | null;
  tags: string[];
}

export interface BankIndex {
  all: BankTask[];
  bySubject: Map<string, BankTask[]>;
  bySubjectExam: Map<string, BankTask[]>;
  byZadanie: Map<string, BankTask[]>; // key = `${subject}|${exam}|${zadanie_n}`
}

let cached: BankIndex | null = null;
let loadPromise: Promise<BankIndex> | null = null;

/** Build an in-memory index from a flat task array. Exported for tests. */
export function buildBankIndex(all: BankTask[]): BankIndex {
  const bySubject = new Map<string, BankTask[]>();
  const bySubjectExam = new Map<string, BankTask[]>();
  const byZadanie = new Map<string, BankTask[]>();

  for (const t of all) {
    const subjKey = t.subject;
    const seKey = `${t.subject}|${t.exam}`;
    const zkey = `${t.subject}|${t.exam}|${t.zadanie_n ?? 0}`;

    (bySubject.get(subjKey) ?? bySubject.set(subjKey, []).get(subjKey)!).push(t);
    (bySubjectExam.get(seKey) ?? bySubjectExam.set(seKey, []).get(seKey)!).push(t);
    (byZadanie.get(zkey) ?? byZadanie.set(zkey, []).get(zkey)!).push(t);
  }

  return { all, bySubject, bySubjectExam, byZadanie };
}

async function loadIndex(): Promise<BankIndex> {
  const filePath = path.join(process.cwd(), "data", "bank.json");
  const raw = await fs.readFile(filePath, "utf-8");
  const all = JSON.parse(raw) as BankTask[];
  return buildBankIndex(all);
}

export async function getBank(): Promise<BankIndex> {
  if (cached) return cached;
  if (!loadPromise) loadPromise = loadIndex().then((idx) => (cached = idx));
  return loadPromise;
}

export interface BankQuery {
  subject?: "math" | "informatics";
  exam?: "ege" | "ege_base" | "oge";
  zadanie_n?: number;
  topic?: string;            // строка для поиска по condition/topic/tags
  source?: BankTask["source"];
  limit?: number;            // максимум выборки
  seed?: number;             // детерминированный shuffle
}

function lowerNormalize(s: string): string {
  return s.toLowerCase().replace(/[ёё]/g, "е");
}

function matchesTopic(t: BankTask, q: string): boolean {
  if (!q.trim()) return true;
  const needle = lowerNormalize(q);
  const hay = [t.topic, t.condition, t.subtype, ...t.tags].map(lowerNormalize).join(" ");
  // Все слова длиной > 2 должны встретиться (AND-поиск).
  const words = needle.split(/\s+/).filter((w) => w.length > 2);
  if (words.length === 0) return hay.includes(needle);
  return words.every((w) => hay.includes(w));
}

// Простой mulberry32 для детерминированного shuffle (без зависимостей).
function rng(seed: number): () => number {
  let a = seed >>> 0 || 1;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], r: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Synchronous search on a pre-built index. Exported for unit tests. */
export function searchBankFromIndex(idx: BankIndex, q: BankQuery): BankTask[] {
  let pool: BankTask[];

  if (q.subject && q.exam && q.zadanie_n != null) {
    pool = idx.byZadanie.get(`${q.subject}|${q.exam}|${q.zadanie_n}`) ?? [];
  } else if (q.subject && q.exam) {
    pool = idx.bySubjectExam.get(`${q.subject}|${q.exam}`) ?? [];
  } else if (q.subject) {
    pool = idx.bySubject.get(q.subject) ?? [];
  } else {
    pool = idx.all;
  }

  if (q.source) pool = pool.filter((t) => t.source === q.source);
  if (q.topic) pool = pool.filter((t) => matchesTopic(t, q.topic!));

  if (q.seed !== undefined) pool = shuffle(pool, rng(q.seed));

  if (q.limit && q.limit > 0) pool = pool.slice(0, q.limit);
  return pool;
}

export async function searchBank(q: BankQuery): Promise<BankTask[]> {
  const idx = await getBank();
  return searchBankFromIndex(idx, q);
}

export async function bankStats(): Promise<{ total: number; by_source: Record<string, number>; by_subject_exam: Record<string, number> }> {
  const idx = await getBank();
  const by_source: Record<string, number> = {};
  const by_subject_exam: Record<string, number> = {};
  for (const t of idx.all) {
    by_source[t.source] = (by_source[t.source] ?? 0) + 1;
    const k = `${t.subject}|${t.exam}`;
    by_subject_exam[k] = (by_subject_exam[k] ?? 0) + 1;
  }
  return { total: idx.all.length, by_source, by_subject_exam };
}

/** Преобразование bank-задачи к формату task для worksheet content. */
export function bankTaskToWorksheetTask(t: BankTask, n: number) {
  return {
    n,
    condition: t.condition,
    expected_answer: t.expected_answer,
    answer_type: t.answer_type,
    ...(t.solution ? { solution: t.solution } : {}),
  };
}
