// Sber GigaChat adapter.
// Активируется при LLM_PROVIDER=gigachat + GIGACHAT_AUTH_KEY в .env.
//
// Документация: https://developers.sber.ru/docs/ru/gigachat/api/overview
//
// Особенность: GigaChat требует получить access_token через OAuth2 client_credentials,
// и он живёт ~30 минут. Кэшируем в памяти.

import type {
  LLMGenerateOptions,
  LLMProvider,
  LLMResponse,
} from "../types";
import { extractLooseJson } from "../json-extract";

const DEFAULT_MODEL = process.env.LLM_MODEL || "GigaChat";
const OAUTH_URL = "https://ngw.devices.sberbank.ru:9443/api/v2/oauth";
const API_URL = "https://gigachat.devices.sberbank.ru/api/v1/chat/completions";

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60_000) return cachedToken.token;

  const authKey = process.env.GIGACHAT_AUTH_KEY;
  const scope = process.env.GIGACHAT_SCOPE || "GIGACHAT_API_PERS";
  if (!authKey) throw new Error("gigachat_no_auth_key");

  const res = await fetch(OAUTH_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${authKey}`,
      RqUID: crypto.randomUUID(),
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: `scope=${scope}`,
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`gigachat_oauth_${res.status}: ${t.slice(0, 300)}`);
  }
  const data = (await res.json()) as { access_token: string; expires_at: number };
  // expires_at у GigaChat возвращается в миллисекундах unix timestamp.
  cachedToken = { token: data.access_token, expiresAt: data.expires_at || now + 25 * 60_000 };
  return cachedToken.token;
}

export class GigaChatProvider implements LLMProvider {
  readonly name = "gigachat";
  readonly defaultModel = DEFAULT_MODEL;

  isReady(): boolean {
    return Boolean(process.env.GIGACHAT_AUTH_KEY);
  }

  async generate(opts: LLMGenerateOptions): Promise<LLMResponse> {
    if (!this.isReady()) throw new Error("gigachat_not_configured");
    const token = await getAccessToken();

    // GigaChat ожидает OpenAI-совместимый формат messages[{role, content}].
    const messages = opts.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // На MVP не отправляем attachments в GigaChat — у него отдельная Vision-модель и формат.
    // Если есть изображения, утром нужно подключить multipart endpoint /v1/files и vision-модель.

    const body: Record<string, unknown> = {
      model: this.defaultModel,
      messages,
      temperature: opts.temperature ?? 0.4,
      max_tokens: opts.maxTokens ?? 2048,
    };

    if (opts.jsonSchema) {
      // GigaChat поддерживает поле "response_format": { type: "json_object" } (как у OpenAI).
      body.response_format = { type: "json_object" };
    }

    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`gigachat_api_${res.status}: ${errText.slice(0, 300)}`);
    }

    const data = (await res.json()) as {
      choices: { message: { role: string; content: string } }[];
      usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
      model: string;
    };

    const text = data.choices?.[0]?.message?.content ?? "";
    // GigaChat вставляет LaTeX с одинарным \ прямо в JSON-строки ("$20\%$",
    // "\frac") — это невалидные escape и ломают JSON.parse. extractLooseJson
    // чинит слэши и markdown-обёртки.
    const json: unknown = opts.jsonSchema ? extractLooseJson(text) : undefined;

    return {
      text,
      json,
      usage: {
        inputTokens: data.usage?.prompt_tokens ?? 0,
        outputTokens: data.usage?.completion_tokens ?? 0,
      },
      model: data.model ?? this.defaultModel,
      provider: this.name,
      raw: data,
    };
  }
}
