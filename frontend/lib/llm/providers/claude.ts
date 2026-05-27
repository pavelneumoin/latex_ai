// Anthropic Claude adapter.
// Активируется автоматически при LLM_PROVIDER=claude + ANTHROPIC_API_KEY в .env.
//
// Документация: https://docs.anthropic.com/en/api/messages
// Поддерживает text + изображения + PDF (base64 в content blocks).
// Prompt-caching через `cache_control: {type: "ephemeral"}` на system блоке.

import type {
  LLMGenerateOptions,
  LLMProvider,
  LLMResponse,
} from "../types";

const DEFAULT_MODEL = process.env.LLM_MODEL || "claude-haiku-4-5";
const API_URL = "https://api.anthropic.com/v1/messages";
const API_VERSION = "2023-06-01";

interface AnthropicContentBlock {
  type: "text" | "image" | "document";
  text?: string;
  source?: { type: "base64"; media_type: string; data: string };
  cache_control?: { type: "ephemeral" };
}

interface AnthropicMessage {
  role: "user" | "assistant";
  content: AnthropicContentBlock[] | string;
}

export class ClaudeProvider implements LLMProvider {
  readonly name = "claude";
  readonly defaultModel = DEFAULT_MODEL;

  isReady(): boolean {
    return Boolean(process.env.ANTHROPIC_API_KEY);
  }

  async generate(opts: LLMGenerateOptions): Promise<LLMResponse> {
    if (!this.isReady()) throw new Error("claude_not_configured");

    const systemMsgs = opts.messages.filter((m) => m.role === "system");
    const chatMsgs = opts.messages.filter((m) => m.role !== "system");

    const messages: AnthropicMessage[] = chatMsgs.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // Attach images / PDFs to the LAST user message (стандартный паттерн Claude).
    if (opts.attachments?.length && messages.length) {
      const last = messages[messages.length - 1];
      if (last.role === "user") {
        const blocks: AnthropicContentBlock[] = [
          { type: "text", text: typeof last.content === "string" ? last.content : "" },
        ];
        for (const att of opts.attachments) {
          if (att.kind === "image") {
            blocks.push({
              type: "image",
              source: {
                type: "base64",
                media_type: att.mimeType || "image/jpeg",
                data: att.data,
              },
            });
          } else if (att.kind === "pdf") {
            blocks.push({
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: att.data,
              },
            });
          }
        }
        last.content = blocks;
      }
    }

    const body: Record<string, unknown> = {
      model: opts.cache ? this.defaultModel : this.defaultModel,
      max_tokens: opts.maxTokens ?? 4096,
      temperature: opts.temperature ?? 0.4,
      messages,
    };

    if (systemMsgs.length) {
      body.system = opts.cache
        ? [
            {
              type: "text",
              text: systemMsgs.map((m) => m.content).join("\n\n"),
              cache_control: { type: "ephemeral" },
            },
          ]
        : systemMsgs.map((m) => m.content).join("\n\n");
    }

    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": API_VERSION,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`claude_api_${res.status}: ${errText.slice(0, 300)}`);
    }

    const data = (await res.json()) as {
      content: { type: string; text: string }[];
      usage: { input_tokens: number; output_tokens: number; cache_read_input_tokens?: number };
      model: string;
    };

    const text = data.content.find((c) => c.type === "text")?.text ?? "";
    let json: unknown;
    if (opts.jsonSchema) {
      json = extractJson(text);
    }

    return {
      text,
      json,
      usage: {
        inputTokens: data.usage.input_tokens,
        outputTokens: data.usage.output_tokens,
        cachedTokens: data.usage.cache_read_input_tokens,
      },
      model: data.model,
      provider: this.name,
      raw: data,
    };
  }
}

function extractJson(text: string): unknown {
  // Иногда модель оборачивает JSON в ```json ... ``` — снимаем код-фенс.
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fence ? fence[1] : text;
  try {
    return JSON.parse(body);
  } catch {
    return undefined;
  }
}
