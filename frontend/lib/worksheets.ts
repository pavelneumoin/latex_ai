// Общая логика создания и генерации worksheet — переиспользуется в
// POST /api/worksheets, /variants, /harder.

import { prisma } from "./db";
import { getProvider } from "./llm";
import { loadPrompt, renderTemplate, type PromptId } from "./llm/prompts";
import { searchBank, bankTaskToWorksheetTask, type BankTask } from "./bank";

export interface LimitCheck {
  ok: boolean;
  planId: string;
  used: number;
  limit: number; // -1 = безлимит
}

/**
 * Проверить лимит листов по подписке пользователя.
 * Если подписки нет — считаем как free.
 */
export async function checkWorksheetLimit(userId: string): Promise<LimitCheck> {
  const sub = await prisma.subscription.findUnique({
    where: { userId },
    include: { plan: true },
  });

  if (!sub) {
    return { ok: false, planId: "free", used: 0, limit: 0 };
  }

  const limit = sub.plan.worksheetsLimit;
  const used = sub.usedWorksheets;
  if (limit < 0) return { ok: true, planId: sub.planId, used, limit };
  return { ok: used < limit, planId: sub.planId, used, limit };
}

export async function incrementWorksheetUsage(userId: string): Promise<void> {
  await prisma.subscription.updateMany({
    where: { userId },
    data: { usedWorksheets: { increment: 1 } },
  });
}

export async function incrementVariantUsage(
  userId: string,
  by = 1
): Promise<void> {
  await prisma.subscription.updateMany({
    where: { userId },
    data: { usedVariants: { increment: by } },
  });
}

export interface GenerationVars {
  topic?: string;
  subject?: string;
  grade?: number;
  difficulty?: string;
  task_count?: number;
  template?: string;
  original?: unknown;
  complexityStep?: number;
  [k: string]: unknown;
}

/**
 * Дёрнуть LLM, отдать сырой JSON-контент.
 */
export async function generateWorksheetContent(
  promptId: PromptId,
  vars: GenerationVars
): Promise<{
  contentJson: string;
  parsed: unknown;
  provider: string;
  model: string;
}> {
  const prompt = await loadPrompt(promptId);
  const userText = renderTemplate(prompt.userTemplate, vars);

  const provider = getProvider();
  const resp = await provider.generate({
    messages: [
      { role: "system", content: prompt.system },
      { role: "user", content: userText },
    ],
    jsonSchema: prompt.outputSchema,
    temperature: 0.4,
  });

  let parsed: unknown = resp.json;
  if (parsed === undefined) {
    try {
      parsed = JSON.parse(resp.text);
    } catch {
      parsed = { raw: resp.text, _warning: "non_json_response" };
    }
  }

  // Defensive normalization: LLM иногда возвращает варианты имён полей
  // (особенно GigaChat: id/question/answer вместо n/condition/expected_answer).
  // Приводим к каноническим именам, чтобы рендер и чекер не падали.
  parsed = normalizeWorksheetContent(parsed);

  const contentJson = JSON.stringify(parsed);
  return {
    contentJson,
    parsed,
    provider: resp.provider,
    model: resp.model,
  };
}

type AnyRec = Record<string, unknown>;

function asString(v: unknown): string | undefined {
  if (v == null) return undefined;
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return undefined;
}

export function normalizeWorksheetContent(parsed: unknown): unknown {
  if (!parsed || typeof parsed !== "object") return parsed;
  const root = parsed as AnyRec;
  const rawTasks =
    (Array.isArray(root.tasks) && root.tasks) ||
    (Array.isArray(root.problems) && root.problems) ||
    (Array.isArray(root.items) && root.items) ||
    (Array.isArray(root.questions) && root.questions);

  if (!rawTasks) return parsed;

  const tasks = (rawTasks as unknown[]).map((raw, idx) => {
    const t = (raw && typeof raw === "object" ? raw : {}) as AnyRec;
    const n = Number(t.n ?? t.id ?? t.number ?? t.index ?? idx + 1) || idx + 1;
    const condition =
      asString(t.condition) ?? asString(t.question) ?? asString(t.text) ?? asString(t.problem) ?? "";
    const expected_answer =
      asString(t.expected_answer) ?? asString(t.answer) ?? asString(t.correct) ?? asString(t.result);
    const solution = asString(t.solution) ?? asString(t.solutions) ?? asString(t.explanation);
    const hint = asString(t.hint) ?? asString(t.tip);
    const answer_type = asString(t.answer_type) ?? asString(t.type) ?? "string";
    return {
      n,
      condition,
      ...(expected_answer != null ? { expected_answer } : {}),
      answer_type,
      ...(solution ? { solution } : {}),
      ...(hint ? { hint } : {}),
    };
  });

  return { ...root, tasks };
}

export interface BankFilter {
  subject?: "math" | "informatics";
  exam?: "ege" | "ege_base" | "oge";
  zadanie_n?: number;
  topic?: string;
  source?: BankTask["source"];
}

/**
 * Собрать лист из задач банка (ФИПИ/kompege/sdamgia/...).
 * Не дёргает LLM. Использует тот же `WorksheetContent`-контракт.
 */
export async function generateFromBank(
  filter: BankFilter,
  taskCount: number,
  seed?: number
): Promise<{
  contentJson: string;
  parsed: { title: string; subtitle: string; tasks: unknown[]; source_meta: unknown };
  provider: string;
  model: string;
  matched: number;
}> {
  const found = await searchBank({
    ...filter,
    limit: Math.max(taskCount, 1),
    seed: seed ?? Math.floor(Math.random() * 1e9),
  });
  if (found.length === 0) {
    throw new Error("bank_no_match");
  }
  const tasks = found.slice(0, taskCount).map((t, i) => bankTaskToWorksheetTask(t, i + 1));

  const title =
    filter.topic && filter.topic.trim()
      ? filter.topic.trim()
      : examTitle(filter);
  const subtitle = bankSubtitle(filter, found.length);

  const parsed = {
    title,
    subtitle,
    tasks,
    source_meta: {
      kind: "bank",
      filter,
      total_matched: found.length,
      task_ids: found.slice(0, taskCount).map((t) => t.id),
      task_sources: Array.from(new Set(found.slice(0, taskCount).map((t) => t.source))),
    },
  };
  return {
    contentJson: JSON.stringify(parsed),
    parsed,
    provider: "bank",
    model: "fipi+kompege+sdamgia",
    matched: found.length,
  };
}

function examTitle(f: BankFilter): string {
  const subj = f.subject === "math" ? "Математика" : "Информатика";
  const exam =
    f.exam === "ege" ? "ЕГЭ"
    : f.exam === "ege_base" ? "ЕГЭ (база)"
    : f.exam === "oge" ? "ОГЭ"
    : "";
  const zn = f.zadanie_n != null ? ` — задание №${f.zadanie_n}` : "";
  return `${subj} ${exam}${zn}`.trim();
}

function bankSubtitle(f: BankFilter, total: number): string {
  const parts: string[] = [];
  if (f.source) parts.push(`источник: ${f.source}`);
  parts.push(`выборка из ${total} задач банка`);
  return parts.join(" · ");
}

/**
 * Безопасный JSON-parse поля contentJson из БД.
 */
export function safeParseJson<T = unknown>(s: string | null | undefined): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

/**
 * Следующая буква варианта: B, C, D, ...
 * Берёт максимальную уже существующую среди детей.
 */
export async function nextVariantLetter(parentId: string): Promise<string[]> {
  const children = await prisma.worksheet.findMany({
    where: { parentId },
    select: { variant: true },
  });
  const used = new Set(children.map((c) => c.variant));
  const letters: string[] = [];
  const base = "BCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let i = 0; i < base.length; i++) {
    const ch = base[i];
    if (!used.has(ch)) letters.push(ch);
  }
  return letters;
}
