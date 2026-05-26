// Точка входа в LLM-абстракцию.
// Утром: добавьте свой провайдер в registerProvider() и переключите LLM_PROVIDER в .env.

import { MockProvider } from "./mock";
import type { LLMProvider, ProviderKey } from "./types";

const registry = new Map<ProviderKey, LLMProvider>();

registry.set("mock", new MockProvider());

// ─────────────── Заглушки для других провайдеров ───────────────
// Реальные имплементации добавляются в lib/llm/providers/<name>.ts
// и регистрируются здесь. Пока — все падают на mock, если ключа нет.

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
