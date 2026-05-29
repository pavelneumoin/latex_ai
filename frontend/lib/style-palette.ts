// Палитра стилей шаблонов — общая между TemplateGallery, WorksheetPreview, share-страницей.
// Утром: при добавлении нового шаблона достаточно добавить запись сюда + в registry.json + seed.

export type StylePalette = {
  primary: string;       // основной цвет шаблона (HEX)
  bg?: string;           // фон страницы превью (опц.)
  accent2?: string;      // дополнительный цвет (опц.)
  fontFamily?: string;   // CSS font-family override
  textColor?: string;    // цвет текста на тёмных темах
  label?: string;        // короткий лейбл стиля
  vibe?: "card" | "minimal" | "newspaper" | "monospace" | "ornate" | "dark" | "pastel" | "official";
};

export const STYLE_PALETTE: Record<string, StylePalette> = {
  classic_wildcat_purple: { primary: "#5B2E91", label: "Классика", vibe: "card" },
  compact_underline: { primary: "#5B2E91", vibe: "minimal" },
  minimal_gray: { primary: "#475569", label: "Минимал", vibe: "minimal", fontFamily: "Inter, system-ui, sans-serif" },
  newspaper_navy: { primary: "#1E3A8A", label: "Газета", vibe: "newspaper", fontFamily: "'Source Serif Pro', Georgia, serif" },
  journal_amber: { primary: "#B45309", label: "Журнал", vibe: "card", fontFamily: "Inter, system-ui, sans-serif" },
  cards_emerald: { primary: "#047857", label: "Карточки", vibe: "card", fontFamily: "Inter, system-ui, sans-serif" },
  control_graphite: { primary: "#1F2937", label: "Контрольная", vibe: "official" },
  notebook_ink: { primary: "#1E40AF", label: "Тетрадь", vibe: "card", fontFamily: "Inter, system-ui, sans-serif" },
  terminal_green: { primary: "#10B981", bg: "#0B1220", textColor: "#E5F5F0", label: "Терминал", vibe: "dark", fontFamily: "'JetBrains Mono', 'Fira Code', monospace" },
  pastel_three_tones: { primary: "#A78BFA", label: "Пастель", vibe: "pastel", fontFamily: "Inter, system-ui, sans-serif" },
  oge_official_bw: { primary: "#991B1B", label: "ОГЭ", vibe: "official" },
  trainer_teal: { primary: "#0D9488", label: "Тренажёр", vibe: "card", fontFamily: "Inter, system-ui, sans-serif" },
  scandi_white: { primary: "#1A1A1A", label: "Скандинав", vibe: "minimal", fontFamily: "Inter, system-ui, sans-serif" },
  retro_typewriter: { primary: "#000000", label: "Ретро", vibe: "monospace", fontFamily: "'Courier Prime', 'Courier New', monospace" },
  space_dark: { primary: "#A78BFA", bg: "#0B0B14", textColor: "#E2E2F0", label: "Космос", vibe: "dark", fontFamily: "Inter, system-ui, sans-serif" },
  victorian_ornate: { primary: "#7C2D12", label: "Викториан", vibe: "ornate", fontFamily: "Georgia, 'Times New Roman', serif" },
  exam_form: { primary: "#4B5563", label: "Бланк ЕГЭ", vibe: "official" },
  quick_15min: { primary: "#EA580C", label: "15 минут", vibe: "card", fontFamily: "Inter, system-ui, sans-serif" },
  mental_grid_5x5: { primary: "#0891B2", label: "Устный", vibe: "card", fontFamily: "Inter, system-ui, sans-serif" },
  code_python: { primary: "#1D4ED8", bg: "#F0F4FF", label: "Python", vibe: "card", fontFamily: "Inter, system-ui, sans-serif" },
  graphs_grid: { primary: "#065F46", label: "Графики", vibe: "card", fontFamily: "Inter, system-ui, sans-serif" },
  olympiad_premium: { primary: "#B45309", label: "Олимпиада", vibe: "ornate", fontFamily: "Georgia, serif" },
  sea_navy: { primary: "#075985", label: "Море", vibe: "card", fontFamily: "Inter, system-ui, sans-serif" },
  forest_green: { primary: "#166534", label: "Лес", vibe: "card", fontFamily: "Inter, system-ui, sans-serif" },
  bingo_card: { primary: "#DB2777", label: "Бинго", vibe: "card", fontFamily: "Inter, system-ui, sans-serif" },
  maze_flow: { primary: "#6D28D9", label: "Лабиринт", vibe: "card", fontFamily: "Inter, system-ui, sans-serif" },
  table_grid: { primary: "#374151", label: "Таблица", vibe: "minimal", fontFamily: "Inter, system-ui, sans-serif" },
  algo_flowchart: { primary: "#0EA5E9", label: "Блок-схемы", vibe: "card", fontFamily: "Inter, system-ui, sans-serif" },
  final_year_premium: { primary: "#1E3A8A", label: "Итоговая", vibe: "official" },
  letter_format: { primary: "#713F12", label: "Письмо", vibe: "ornate", fontFamily: "Georgia, serif" },
  flashcards_dual: { primary: "#7C3AED", label: "Флешкарты", vibe: "card", fontFamily: "Inter, system-ui, sans-serif" },
  wabisabi_asymmetric: { primary: "#57534E", label: "Ваби-саби", vibe: "minimal", fontFamily: "Inter, system-ui, sans-serif" },
};

export function getStylePalette(styleSlug: string | undefined | null): StylePalette {
  if (!styleSlug) return STYLE_PALETTE.classic_wildcat_purple;
  return STYLE_PALETTE[styleSlug] ?? STYLE_PALETTE.classic_wildcat_purple;
}
