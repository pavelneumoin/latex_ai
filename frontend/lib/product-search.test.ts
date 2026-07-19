import { describe, expect, it } from "vitest";
import {
  normalizeProductSearch,
  productSearchTerms,
  scoreProductSearch,
} from "./product-search";

const logarithms = {
  title: "Логарифмические уравнения. Часть 1",
  description: "Комплект материалов для подготовки к ЕГЭ",
  course: "Задание 6. Уравнения",
  audience: "10–11 класс · ЕГЭ",
  subject: "math",
  kind: "lesson_kit",
  lessonNo: 4,
};

describe("product search", () => {
  it("нормализует регистр, ё, дефисы и пунктуацию", () => {
    expect(normalizeProductSearch("  Ёмкость: 5–6 класс! ")).toBe(
      "емкость 5 6 класс"
    );
  });

  it("оставляет одноцифровые номера и удаляет повторы", () => {
    expect(productSearchTerms("урок 4, урок 4")).toEqual(["урок", "4"]);
  });

  it("ищет по теме, классу и номеру урока", () => {
    expect(scoreProductSearch(logarithms, "логарифмические 11 класс")).not.toBeNull();
    expect(scoreProductSearch(logarithms, "урок 4")).not.toBeNull();
  });

  it("понимает названия состава комплекта", () => {
    expect(scoreProductSearch(logarithms, "презентация дз")).not.toBeNull();
  });

  it("терпит одну опечатку в длинном слове", () => {
    expect(scoreProductSearch(logarithms, "логарифмическия")).not.toBeNull();
  });

  it("ставит точный заголовок выше совпадения в описании", () => {
    const exact = scoreProductSearch(logarithms, "логарифмические уравнения")!;
    const descriptionOnly = scoreProductSearch(
      { title: "Другой материал", description: "Логарифмические уравнения" },
      "логарифмические уравнения"
    )!;
    expect(exact).toBeGreaterThan(descriptionOnly);
  });

  it("не возвращает нерелевантный материал", () => {
    expect(scoreProductSearch(logarithms, "комбинаторика")).toBeNull();
  });
});
