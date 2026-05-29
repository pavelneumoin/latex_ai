import { describe, it, expect } from "vitest";
import { validateWorksheet } from "./worksheet-validator";

describe("validateWorksheet", () => {
  it("чистый лист проходит без ошибок, score 100", () => {
    const r = validateWorksheet({
      title: "Проценты",
      subtitle: "Решите.",
      tasks: [
        { n: 1, condition: "Найдите $15\\%$ от $240$.", expected_answer: "36", answer_type: "number" },
        { n: 2, condition: "Сколько будет $2+2$?", expected_answer: "4", answer_type: "number" },
      ],
    });
    expect(r.ok).toBe(true);
    expect(r.score).toBe(100);
    expect(r.counts.error).toBe(0);
  });

  it("пустой лист = error no_tasks", () => {
    const r = validateWorksheet({ title: "x", tasks: [] });
    expect(r.ok).toBe(false);
    expect(r.issues.some((i) => i.code === "no_tasks")).toBe(true);
  });

  it("choice без options = error", () => {
    const r = validateWorksheet({
      title: "t",
      tasks: [{ n: 1, condition: "Выберите", expected_answer: "А", answer_type: "choice" }],
    });
    expect(r.ok).toBe(false);
    expect(r.issues.some((i) => i.code === "no_options")).toBe(true);
  });

  it("choice с ответом не из вариантов = warning", () => {
    const r = validateWorksheet({
      title: "t",
      tasks: [
        {
          n: 1,
          condition: "Выберите",
          expected_answer: "42",
          answer_type: "choice",
          options: ["1", "2", "3"],
        },
      ],
    });
    expect(r.issues.some((i) => i.code === "answer_not_in_options")).toBe(true);
  });

  it("choice: верный ответ из вариантов — без замечания", () => {
    const r = validateWorksheet({
      title: "t",
      tasks: [
        {
          n: 1,
          condition: "Выберите",
          expected_answer: "600 рублей",
          answer_type: "choice",
          options: ["500 рублей", "600 рублей", "700 рублей"],
        },
      ],
    });
    expect(r.issues.some((i) => i.code === "answer_not_in_options")).toBe(false);
  });

  it("number с нечисловым ответом = warning", () => {
    const r = validateWorksheet({
      title: "t",
      tasks: [{ n: 1, condition: "x", expected_answer: "много", answer_type: "number" }],
    });
    expect(r.issues.some((i) => i.code === "number_not_numeric")).toBe(true);
  });

  it("пустой ответ (не open) = error", () => {
    const r = validateWorksheet({
      title: "t",
      tasks: [{ n: 1, condition: "x", expected_answer: "", answer_type: "string" }],
    });
    expect(r.ok).toBe(false);
    expect(r.issues.some((i) => i.code === "empty_answer")).toBe(true);
  });

  it("open без ответа — допустимо", () => {
    const r = validateWorksheet({
      title: "t",
      tasks: [{ n: 1, condition: "Порассуждайте о бесконечности.", answer_type: "open" }],
    });
    expect(r.issues.some((i) => i.code === "empty_answer")).toBe(false);
  });

  it("голый LaTeX вне $...$ = warning bare_latex", () => {
    const r = validateWorksheet({
      title: "t",
      tasks: [{ n: 1, condition: "Найдите \\frac{1}{2} числа", expected_answer: "5", answer_type: "number" }],
    });
    expect(r.issues.some((i) => i.code === "bare_latex")).toBe(true);
  });

  it("LaTeX внутри $...$ не считается голым", () => {
    const r = validateWorksheet({
      title: "t",
      tasks: [{ n: 1, condition: "Найдите $\\frac{1}{2}$ числа $10$.", expected_answer: "5", answer_type: "number" }],
    });
    expect(r.issues.some((i) => i.code === "bare_latex")).toBe(false);
  });

  it("незакрытая формула = warning unbalanced_math", () => {
    const r = validateWorksheet({
      title: "t",
      tasks: [{ n: 1, condition: "Решите $x+1 = 3", expected_answer: "2", answer_type: "number" }],
    });
    expect(r.issues.some((i) => i.code === "unbalanced_math")).toBe(true);
  });

  it("fill_blank без ___ = info", () => {
    const r = validateWorksheet({
      title: "t",
      tasks: [{ n: 1, condition: "Вставьте пропущенное число", expected_answer: "5", answer_type: "fill_blank" }],
    });
    expect(r.issues.some((i) => i.code === "no_blank_marker")).toBe(true);
  });

  it("дубли номеров = warning", () => {
    const r = validateWorksheet({
      title: "t",
      tasks: [
        { n: 1, condition: "a", expected_answer: "1", answer_type: "number" },
        { n: 1, condition: "b", expected_answer: "2", answer_type: "number" },
      ],
    });
    expect(r.issues.some((i) => i.code === "duplicate_n")).toBe(true);
  });

  it("score снижается за ошибки", () => {
    const clean = validateWorksheet({
      title: "t",
      tasks: [{ n: 1, condition: "a", expected_answer: "1", answer_type: "number" }],
    });
    const dirty = validateWorksheet({
      title: "",
      tasks: [{ n: 1, condition: "", expected_answer: "", answer_type: "choice" }],
    });
    expect(dirty.score).toBeLessThan(clean.score);
    expect(dirty.ok).toBe(false);
  });
});
