// Точка входа в LLM-абстракцию.
// Утром: добавьте свой провайдер в registerProvider() и переключите LLM_PROVIDER в .env.

import { MockProvider } from "./mock";
import { ClaudeProvider } from "./providers/claude";
import { GigaChatProvider } from "./providers/gigachat";
import { DeepSeekProvider } from "./providers/deepseek";
import { OpenAIProvider } from "./providers/openai";
import type { LLMProvider, ProviderKey } from "./types";

const registry = new Map<ProviderKey, LLMProvider>();

registry.set("mock", new MockProvider());
registry.set("claude", new ClaudeProvider());
registry.set("gigachat", new GigaChatProvider());
registry.set("deepseek", new DeepSeekProvider());
registry.set("openai", new OpenAIProvider("openai"));
registry.set("openrouter", new OpenAIProvider("openrouter"));

// Активный провайдер выбирается через LLM_PROVIDER в .env.local.
// Если ключ не задан — isReady() вернёт false и пройдёт fallback на mock.

export function registerProvider(key: ProviderKey, provider: LLMProvider) {
  registry.set(key, provider);
}

export function getProvider(key?: string): LLMProvider {
  const k = (key || process.env.LLM_PROVIDER || "mock") as ProviderKey;
  const p = registry.get(k);
  if (p && p.isReady()) return p;
  // Тихий фолбэк на mock с пометкой в логе.
  if (k !== "mock") {
    console.warn(
      `[llm] provider "${k}" not registered/ready — falling back to mock`
    );
  }
  return registry.get("mock")!;
}

export function listProviders(): { key: ProviderKey; ready: boolean }[] {
  return Array.from(registry.entries()).map(([key, p]) => ({
    key,
    ready: p.isReady(),
  }));
}

export type { LLMProvider, LLMResponse, LLMMessage, LLMGenerateOptions } from "./types";
