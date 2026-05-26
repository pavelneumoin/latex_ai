// Mock-провайдер. Используется по умолчанию (LLM_PROVIDER=mock).
// Утром при подключении настоящего ключа — переключиться через переменную окружения,
// никакой код менять не нужно.

import type {
  LLMGenerateOptions,
  LLMProvider,
  LLMResponse,
} from "./types";

export class MockProvider implements LLMProvider {
  readonly name = "mock";
  readonly defaultModel = "mock-1";

  isReady(): boolean {
    return true;
  }

  async generate(opts: LLMGenerateOptions): Promise<LLMResponse> {
    const lastUser =
      [...opts.messages].reverse().find((m) => m.role === "user")?.content ??
      "";

    // Если попросили JSON — отдаём шаблонный ответ под промпт generate_from_topic.
    if (opts.jsonSchema) {
      const fallback = {
        title: "Демо-лист (mock)",
        subtitle: "Сгенерировано mock-провайдером — подключите API ключ для боевого режима",
        tasks: [
          {
            n: 1,
            condition:
              "Решите уравнение $x^2 - 5x + 6 = 0$. В ответ запишите меньший из корней.",
            expected_answer: "2",
            answer_type: "number",
            tolerance: 0.001,
          },
          {
            n: 2,
            condition:
              "Найдите значение выражения $\\dfrac{3^{10}}{3^8}$.",
            expected_answer: "9",
            answer_type: "number",
            tolerance: 0.001,
          },
          {
            n: 3,
            condition: "Сколько целых чисел расположено между $\\sqrt{17}$ и $\\sqrt{82}$?",
            expected_answer: "5",
            answer_type: "number",
            tolerance: 0.001,
          },
        ],
        coverage: "full",
        warnings: [
          "MOCK PROVIDER — это заглушка. Подключите GigaChat / Claude / DeepSeek через .env.local.",
        ],
        _echo_prompt_preview: lastUser.slice(0, 200),
      };
      return {
        text: JSON.stringify(fallback, null, 2),
        json: fallback,
        usage: { inputTokens: 0, outputTokens: 0, costRub: 0 },
        model: this.defaultModel,
        provider: this.name,
      };
    }

    return {
      text:
        "[MOCK LLM] Это заглушка. Подключите реальный провайдер через переменную LLM_PROVIDER " +
        "(claude | gigachat | deepseek | openai | openrouter) в .env.local.",
      usage: { inputTokens: 0, outputTokens: 0, costRub: 0 },
      model: this.defaultModel,
      provider: this.name,
    };
  }
}
