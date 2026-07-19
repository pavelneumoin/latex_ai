// Хелперы каталога готовых материалов (v2).

export const ASSET_KIND_LABEL: Record<string, string> = {
  presentation_pdf: "Презентация",
  worksheet_pdf: "Рабочий лист",
  cheatsheet_pdf: "Шпаргалка",
  homework_pdf: "Домашняя работа",
  test_pdf: "Зачёт",
  answers_pdf: "Ответы и решения",
  marp_src: "Исходник Marp (.md)",
  tex_src: "Исходник LaTeX (.tex)",
  zip: "Архив комплекта",
};

export const PRODUCT_KIND_LABEL: Record<string, string> = {
  lesson_kit: "Комплект урока",
  presentation: "Презентация",
  worksheet: "Рабочий лист",
};

export function formatKopecks(kopecks: number): string {
  return `${Math.round(kopecks / 100).toLocaleString("ru-RU")} ₽`;
}

/** Короткий состав комплекта для карточки: ["Презентация", "Лист", "ДЗ", "2 зачёта"] */
export function kitSummary(assets: { kind: string; tier: string }[]): string[] {
  const basic = assets.filter((a) => a.tier === "basic");
  const counts = new Map<string, number>();
  for (const a of basic) counts.set(a.kind, (counts.get(a.kind) ?? 0) + 1);
  const order = [
    "presentation_pdf",
    "worksheet_pdf",
    "cheatsheet_pdf",
    "homework_pdf",
    "test_pdf",
    "answers_pdf",
  ];
  const short: Record<string, [string, string]> = {
    presentation_pdf: ["Презентация", "Презентации"],
    worksheet_pdf: ["Лист", "Листа"],
    cheatsheet_pdf: ["Шпаргалка", "Шпаргалки"],
    homework_pdf: ["ДЗ", "ДЗ"],
    test_pdf: ["Зачёт", "Зачёта"],
    answers_pdf: ["Ответы", "Ответы"],
  };
  const out: string[] = [];
  for (const k of order) {
    const n = counts.get(k);
    if (!n) continue;
    const [one, many] = short[k] ?? [k, k];
    out.push(n === 1 ? one : `${n} ${many.toLowerCase()}`);
  }
  const hasSource = assets.some((a) => a.tier === "source");
  if (hasSource) out.push("исходники");
  return out;
}

export function subjectName(s: string): string {
  return s === "informatics" ? "Информатика" : "Математика";
}
