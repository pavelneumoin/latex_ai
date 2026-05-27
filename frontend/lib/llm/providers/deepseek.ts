// DeepSeek adapter.
// Активируется при LLM_PROVIDER=deepseek + DEEPSEEK_API_KEY в .env.
//
// Документация: https://api-docs.deepseek.com/
// API совместим с OpenAI Chat Completions — это сильно упрощает интеграцию.

import type {
  LLMGenerateOptions,
  LLMProvider,
  LLMResponse,
} from "../types";

const DEFAULT_MODEL = process.env.LLM_MODEL || "deepseek-chat";
const API_URL = "https://api.deepseek.com/chat/completions";

export class DeepSeekProvider implements LLMProvider {
  readonly name = "deepseek";
  readonly defaultModel = DEFAULT_MODEL;

  isReady(): boolean {
    return Boolean(process.env.DEEPSEEK_API_KEY);
  }

  async generate(opts: LLMGenerateOptions): Promise<LLMResponse> {
    if (!this.isReady()) throw new Error("deepseek_not_configured");

    const messages = opts.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const body: Record<string, unknown> = {
      model: this.defaultModel,
      messages,
      temperature: opts.temperature ?? 0.4,
      max_tokens: opts.maxTokens ?? 2048,
    };
    if (opts.jsonSchema) {
      body.response_format = { type: "json_object" };
    }

    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`deepseek_api_${res.status}: ${errText.slice(0, 300)}`);
    }

    const data = (await res.json()) as {
      choices: { message: { role: string; content: string } }[];
      usage?: { prompt_tokens: number; completion_tokens: number };
      model: string;
    };

    const text = data.choices?.[0]?.message?.content ?? "";
    let json: unknown;
    if (opts.jsonSchema) {
      try { json = JSON.parse(text); } catch {
        const m = text.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (m) try { json = JSON.parse(m[1]); } catch { /* */ }
      }
    }

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
