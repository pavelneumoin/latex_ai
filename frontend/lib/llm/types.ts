// Универсальные типы для LLM-абстракции.
// Никаких model-specific полей: всё, что отличает GigaChat от Claude — внутри адаптеров.

export type LLMRole = "system" | "user" | "assistant";

export interface LLMMessage {
  role: LLMRole;
  content: string;
}

export interface LLMAttachment {
  kind: "image" | "pdf" | "text";
  // base64 или абсолютный путь к файлу — адаптер сам разбирается
  data: string;
  mimeType?: string;
}

export interface LLMGenerateOptions {
  messages: LLMMessage[];
  attachments?: LLMAttachment[];
  // Подсказка адаптеру: если выставлен — он должен валидировать JSON выход.
  jsonSchema?: Record<string, unknown>;
  temperature?: number;     // 0..2
  maxTokens?: number;
  // Если true, адаптер по возможности использует prompt cache.
  cache?: boolean;
}

export interface LLMUsage {
  inputTokens: number;
  outputTokens: number;
  cachedTokens?: number;
  costRub?: number; // оценочно
}

export interface LLMResponse {
  text: string;
  // Если адаптер смог распарсить ответ в JSON — кладёт сюда.
  json?: unknown;
  usage: LLMUsage;
  model: string;
  provider: string;
  raw?: unknown; // отладка
}

export interface LLMProvider {
  readonly name: string;
  readonly defaultModel: string;
  // Доступна ли модель прямо сейчас (есть ключ и т.п.).
  isReady(): boolean;
  generate(opts: LLMGenerateOptions): Promise<LLMResponse>;
}

// Реестр провайдеров — заполняется при подключении адаптеров.
export type ProviderKey =
  | "mock"
  | "claude"
  | "gigachat"
  | "deepseek"
  | "openai"
  | "openrouter";
