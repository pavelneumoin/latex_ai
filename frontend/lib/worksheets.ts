// Общая логика создания и генерации worksheet — переиспользуется в
// POST /api/worksheets, /variants, /harder.

import { prisma } from "./db";
import { getProvider } from "./llm";
import { loadPrompt, renderTemplate, type PromptId } from "./llm/prompts";

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

  const contentJson = JSON.stringify(parsed);
  return {
    contentJson,
    parsed,
    provider: resp.provider,
    model: resp.model,
  };
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
