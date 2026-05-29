// «Стили формулировок» — управляют тем, КАК нейросеть формулирует условия задач.
//
// Словарь стилей синхронизирован с cli/prompts/generate_from_topic.md
// (там в SYSTEM описан каждый стиль). Здесь — валидация, температура и
// данные для UI, плюс директива тематического антуража (context_theme).
//
// Зачем температура: при жёстком temperature=0.4 GigaChat пишет задачи под
// копирку. Чем выше t — тем разнообразнее формулировки. Поэтому каждый стиль
// несёт свою рекомендованную температуру.
//
// Модуль чистый (без I/O) — покрыт тестами formulation-styles.test.ts.

export type FormulationStyle =
  | "mixed"
  | "formal"
  | "friendly"
  | "practical"
  | "playful"
  | "olympiad";

export const DEFAULT_FORMULATION_STYLE: FormulationStyle = "mixed";

export interface StyleSpec {
  id: FormulationStyle;
  label: string;       // для UI
  short: string;       // короткое пояснение для UI
  temperature: number; // 0..1, чем выше — тем разнообразнее
}

const SPECS: Record<FormulationStyle, StyleSpec> = {
  mixed: {
    id: "mixed",
    label: "Разнообразный",
    short: "Максимум разных типов и оборотов в одном листе (по умолчанию)",
    temperature: 0.7,
  },
  formal: {
    id: "formal",
    label: "Академический",
    short: "Строгий язык как в КИМ ЕГЭ/ОГЭ",
    temperature: 0.35,
  },
  friendly: {
    id: "friendly",
    label: "Дружелюбный",
    short: "Тёплый тон, обращение на «ты», лёгкие пояснения",
    temperature: 0.6,
  },
  practical: {
    id: "practical",
    label: "Практический",
    short: "Жизненный контекст: деньги, расстояния, покупки, спорт",
    temperature: 0.6,
  },
  playful: {
    id: "playful",
    label: "Игровой",
    short: "Мини-истории с персонажами, для интереса школьника",
    temperature: 0.85,
  },
  olympiad: {
    id: "olympiad",
    label: "Олимпиадный",
    short: "Нестандартные формулировки с изюминкой",
    temperature: 0.8,
  },
};

export function isFormulationStyle(v: unknown): v is FormulationStyle {
  return typeof v === "string" && v in SPECS;
}

export function getStyleSpec(style: unknown): StyleSpec {
  return isFormulationStyle(style) ? SPECS[style] : SPECS[DEFAULT_FORMULATION_STYLE];
}

export function temperatureForStyle(style: unknown): number {
  return getStyleSpec(style).temperature;
}

/**
 * Директива тематического антуража для вставки в промпт ({{context_directive}}).
 * Пусто, если тема не задана. Промпт уже описывает сами стили — здесь только антураж.
 */
export function buildContextDirective(contextTheme?: string | null): string {
  const theme = (contextTheme ?? "").trim();
  if (!theme) return "";
  return (
    `Тематический антураж: по возможности вплетай в условия задач тему «${theme}» ` +
    `(имена, объекты, ситуации из этой области), не искажая математическую суть и ответы.`
  );
}

/** Список для UI. */
export function listStylesForUi(): Array<Pick<StyleSpec, "id" | "label" | "short">> {
  return (Object.values(SPECS) as StyleSpec[]).map(({ id, label, short }) => ({ id, label, short }));
}
