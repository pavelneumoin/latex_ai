// OpenAI / OpenRouter adapter.
// Активируется при LLM_PROVIDER=openai с OPENAI_API_KEY ИЛИ LLM_PROVIDER=openrouter с OPENROUTER_API_KEY.

import type {
  LLMGenerateOptions,
  LLMProvider,
  LLMResponse,
} from "../types";

type Variant = "openai" | "openrouter";

export class OpenAIProvider implements LLMProvider {
  readonly name: Variant;
  readonly defaultModel: string;
  private apiUrl: string;
  private apiKeyEnv: string;

  constructor(variant: Variant) {
    this.name = variant;
    if (variant === "openrouter") {
      this.defaultModel = process.env.LLM_MODEL || "openai/gpt-4o-mini";
      this.apiUrl = "https://openrouter.ai/api/v1/chat/completions";
      this.apiKeyEnv = "OPENROUTER_API_KEY";
    } else {
      this.defaultModel = process.env.LLM_MODEL || "gpt-4o-mini";
      this.apiUrl = "https://api.openai.com/v1/chat/completions";
      this.apiKeyEnv = "OPENAI_API_KEY";
    }
  }

  isReady(): boolean {
    return Boolean(process.env[this.apiKeyEnv]);
  }

  async generate(opts: LLMGenerateOptions): Promise<LLMResponse> {
    if (!this.isReady()) throw new Error(`${this.name}_not_configured`);

    const messages = opts.messages.map((m) => {
      // Если есть изображения и это последнее user-сообщение — переводим в OpenAI vision формат.
      if (m.role === "user" && opts.attachments?.length) {
        const parts: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
          { type: "text", text: m.content },
        ];
        for (const a of opts.attachments) {
          if (a.kind === "image") {
            const url = a.data.startsWith("http")
              ? a.data
              : `data:${a.mimeType || "image/jpeg"};base64,${a.data}`;
            parts.push({ type: "image_url", image_url: { url } });
          }
        }
        return { role: m.role, content: parts };
      }
      return { role: m.role, content: m.content };
    });

    const body: Record<string, unknown> = {
      model: this.defaultModel,
      messages,
      temperature: opts.temperature ?? 0.4,
      max_tokens: opts.maxTokens ?? 2048,
    };
    if (opts.jsonSchema) body.response_format = { type: "json_object" };

    const headers: Record<string, string> = {
      Authorization: `Bearer ${process.env[this.apiKeyEnv]}`,
      "Content-Type": "application/json",
    };
    if (this.name === "openrouter") {
      headers["HTTP-Referer"] = process.env.NEXTAUTH_URL || "https://rabochiilist.ru";
      headers["X-Title"] = "РабочийЛист.ai";
    }

    const res = await fetch(this.apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`${this.name}_api_${res.status}: ${errText.slice(0, 300)}`);
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
