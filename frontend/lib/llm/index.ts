// Точка входа в LLM-абстракцию.
// Провайдер выбирается через LLM_PROVIDER. Mock остаётся доступен для тестов
// и явно включённого demo-режима, но API пользовательской генерации проверяет
// getLLMCapabilities().ready и не создаёт с ним листы.

import { MockProvider } from "./mock";
import { ClaudeProvider } from "./providers/claude";
import { GigaChatProvider } from "./providers/gigachat";
import { DeepSeekProvider } from "./providers/deepseek";
import { OpenAIProvider } from "./providers/openai";
import type { LLMProvider, ProviderKey } from "./types";

const registry = new Map<ProviderKey, LLMProvider>();
const VISION_PROVIDERS = new Set<ProviderKey>([
  "claude",
  "openai",
  "openrouter",
]);

registry.set("mock", new MockProvider());
registry.set("claude", new ClaudeProvider());
registry.set("gigachat", new GigaChatProvider());
registry.set("deepseek", new DeepSeekProvider());
registry.set("openai", new OpenAIProvider("openai"));
registry.set("openrouter", new OpenAIProvider("openrouter"));

export interface LLMCapabilities {
  provider: string;
  model: string;
  ready: boolean;
  vision: boolean;
}

function selectedProviderKey(key?: string): string {
  return (key?.trim() || process.env.LLM_PROVIDER?.trim() || "mock").toLowerCase();
}

function modelSupportsVision(provider: string, model: string): boolean {
  const override = process.env.LLM_VISION_ENABLED?.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(override ?? "")) return true;
  if (["0", "false", "no", "off"].includes(override ?? "")) return false;

  if (provider === "claude") return true;
  const normalized = model.toLowerCase();
  if (provider === "openai") {
    return /^(gpt-4o|gpt-4\.1|gpt-5)/.test(normalized);
  }
  if (provider === "openrouter") {
    return /(gpt-4o|gpt-4\.1|gpt-5|claude|gemini|vision|[-/]vl(?:[-/]|$))/.test(
      normalized
    );
  }
  return false;
}

export function registerProvider(key: ProviderKey, provider: LLMProvider) {
  registry.set(key, provider);
}

export function getProvider(key?: string): LLMProvider {
  const selected = selectedProviderKey(key);
  const provider = registry.get(selected as ProviderKey);
  if (!provider) {
    throw new Error(`llm_provider_unknown:${selected}`);
  }
  return provider;
}

/**
 * Безопасный публичный статус выбранного LLM-провайдера.
 *
 * ready означает готовность к реальной пользовательской генерации:
 * mock намеренно возвращает false, даже если его generate() доступен тестам.
 * vision описывает возможность провайдера; для запуска vision нужны оба флага.
 */
export function getLLMCapabilities(key?: string): LLMCapabilities {
  const selected = selectedProviderKey(key);
  const provider = registry.get(selected as ProviderKey);
  const isMock = selected === "mock";

  return {
    provider: selected,
    model: provider?.defaultModel ?? "",
    ready: Boolean(provider && !isMock && provider.isReady()),
    vision: Boolean(
      provider &&
        VISION_PROVIDERS.has(selected as ProviderKey) &&
        modelSupportsVision(selected, provider.defaultModel)
    ),
  };
}

export function listProviders(): { key: ProviderKey; ready: boolean }[] {
  return Array.from(registry.entries()).map(([key, p]) => ({
    key,
    ready: p.isReady(),
  }));
}

export type { LLMProvider, LLMResponse, LLMMessage, LLMGenerateOptions } from "./types";
