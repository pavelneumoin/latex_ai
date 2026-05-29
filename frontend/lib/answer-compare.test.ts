import { describe, expect, it } from "vitest";
import { compareAnswer, percentToMark } from "./answer-compare";

describe("compareAnswer · number", () => {
  it("exact integer match", () => {
    expect(compareAnswer({ expected: "42", got: "42", type: "number" }).correct).toBe(true);
  });
  it("integer mismatch", () => {
    expect(compareAnswer({ expected: "42", got: "43", type: "number" }).correct).toBe(false);
  });
  it("decimal with comma vs dot", () => {
    expect(compareAnswer({ expected: "3.14", got: "3,14", type: "number" }).correct).toBe(true);
  });
  it("negative numbers", () => {
    expect(compareAnswer({ expected: "-7", got: "-7", type: "number" }).correct).toBe(true);
  });
  it("tolerance allows close enough", () => {
    expect(compareAnswer({ expected: "100", got: "101", type: "number", tolerance: 0.02 }).correct).toBe(true);
  });
  it("tolerance rejects too far", () => {
    expect(compareAnswer({ expected: "100", got: "150", type: "number", tolerance: 0.02 }).correct).toBe(false);
  });
  it("fraction-as-answer to number-expected", () => {
    expect(compareAnswer({ expected: "0.5", got: "1/2", type: "number" }).correct).toBe(true);
  });
  it("trim spaces", () => {
    expect(compareAnswer({ expected: "5", got: "  5  ", type: "number" }).correct).toBe(true);
  });
  it("empty got → incorrect", () => {
    expect(compareAnswer({ expected: "5", got: "", type: "number" }).correct).toBe(false);
  });
});

describe("compareAnswer · fraction", () => {
  it("identical fraction", () => {
    expect(compareAnswer({ expected: "3/4", got: "3/4", type: "fraction" }).correct).toBe(true);
  });
  it("reduced equivalent", () => {
    expect(compareAnswer({ expected: "6/8", got: "3/4", type: "fraction" }).correct).toBe(true);
  });
  it("decimal answer to fraction expected", () => {
    expect(compareAnswer({ expected: "1/2", got: "0.5", type: "fraction" }).correct).toBe(true);
  });
  it("wrong fraction", () => {
    expect(compareAnswer({ expected: "1/2", got: "1/3", type: "fraction" }).correct).toBe(false);
  });
  it("negative fraction", () => {
    expect(compareAnswer({ expected: "-1/2", got: "1/-2", type: "fraction" }).correct).toBe(true);
  });
});

describe("compareAnswer · string", () => {
  it("case insensitive", () => {
    expect(compareAnswer({ expected: "Москва", got: "москва", type: "string" }).correct).toBe(true);
  });
  it("ё normalization", () => {
    expect(compareAnswer({ expected: "ёлка", got: "елка", type: "string" }).correct).toBe(true);
  });
  it("whitespace trim", () => {
    expect(compareAnswer({ expected: "ответ", got: "  Ответ  ", type: "string" }).correct).toBe(true);
  });
  it("different string", () => {
    expect(compareAnswer({ expected: "да", got: "нет", type: "string" }).correct).toBe(false);
  });
});

describe("compareAnswer · list", () => {
  it("order-independent", () => {
    expect(compareAnswer({ expected: "1,2,3", got: "3,2,1", type: "list" }).correct).toBe(true);
  });
  it("space separator", () => {
    expect(compareAnswer({ expected: "1 2 3", got: "1,2,3", type: "list" }).correct).toBe(true);
  });
  it("missing item", () => {
    expect(compareAnswer({ expected: "1,2,3", got: "1,2", type: "list" }).correct).toBe(false);
  });
});

describe("compareAnswer · expression", () => {
  it("whitespace-insensitive equal", () => {
    expect(compareAnswer({ expected: "x^2+1", got: " x^2 + 1 ", type: "expression" }).correct).toBe(true);
  });
  it("not equal", () => {
    expect(compareAnswer({ expected: "x^2+1", got: "x^2-1", type: "expression" }).correct).toBe(false);
  });
});

describe("compareAnswer · auto-detect type", () => {
  it("detects number", () => {
    expect(compareAnswer({ expected: "42", got: "42" }).correct).toBe(true);
  });
  it("detects fraction", () => {
    expect(compareAnswer({ expected: "1/2", got: "1/2" }).correct).toBe(true);
  });
  it("falls back to string", () => {
    expect(compareAnswer({ expected: "Москва", got: "Москва" }).correct).toBe(true);
  });
});

describe("compareAnswer · choice", () => {
  const options = ["500 рублей", "600 рублей", "640 рублей", "775 рублей"];
  it("matches by exact option text", () => {
    expect(compareAnswer({ expected: "600 рублей", got: "600 рублей", type: "choice", options }).correct).toBe(true);
  });
  it("matches by Cyrillic letter (Б = 2nd option)", () => {
    expect(compareAnswer({ expected: "600 рублей", got: "Б", type: "choice", options }).correct).toBe(true);
  });
  it("matches by letter with parenthesis (б))", () => {
    expect(compareAnswer({ expected: "600 рублей", got: "б)", type: "choice", options }).correct).toBe(true);
  });
  it("matches by Latin letter (B)", () => {
    expect(compareAnswer({ expected: "600 рублей", got: "B", type: "choice", options }).correct).toBe(true);
  });
  it("matches by 1-based number (2)", () => {
    expect(compareAnswer({ expected: "600 рублей", got: "2", type: "choice", options }).correct).toBe(true);
  });
  it("wrong letter is incorrect", () => {
    expect(compareAnswer({ expected: "600 рублей", got: "А", type: "choice", options }).correct).toBe(false);
  });
  it("falls back to string compare when no options", () => {
    expect(compareAnswer({ expected: "600 рублей", got: "600 РУБЛЕЙ", type: "choice" }).correct).toBe(true);
  });
});

describe("compareAnswer · true_false", () => {
  const options = ["Верно", "Неверно"];
  it("text match", () => {
    expect(compareAnswer({ expected: "Неверно", got: "неверно", type: "true_false", options }).correct).toBe(true);
  });
  it("letter Б → Неверно", () => {
    expect(compareAnswer({ expected: "Неверно", got: "Б", type: "true_false", options }).correct).toBe(true);
  });
});

describe("compareAnswer · multiple_choice", () => {
  const options = ["2", "3", "5", "9"];
  it("order-independent set match by text", () => {
    expect(compareAnswer({ expected: "3; 5", got: "5; 3", type: "multiple_choice", options }).correct).toBe(true);
  });
  it("matches by letters", () => {
    // Б=3, В=5
    expect(compareAnswer({ expected: "3; 5", got: "Б, В", type: "multiple_choice", options }).correct).toBe(true);
  });
  it("missing one selection is incorrect", () => {
    expect(compareAnswer({ expected: "3; 5", got: "3", type: "multiple_choice", options }).correct).toBe(false);
  });
  it("extra selection is incorrect", () => {
    expect(compareAnswer({ expected: "3; 5", got: "3; 5; 9", type: "multiple_choice", options }).correct).toBe(false);
  });
});

describe("compareAnswer · matching", () => {
  it("order-independent pair set, separator-insensitive", () => {
    expect(compareAnswer({ expected: "А-3; Б-1; В-2", got: "В-2; А-3; Б-1", type: "matching" }).correct).toBe(true);
  });
  it("dash vs em-dash vs colon normalized", () => {
    expect(compareAnswer({ expected: "А-3; Б-1", got: "А — 3; Б : 1", type: "matching" }).correct).toBe(true);
  });
  it("wrong pairing is incorrect", () => {
    expect(compareAnswer({ expected: "А-3; Б-1", got: "А-1; Б-3", type: "matching" }).correct).toBe(false);
  });
});

describe("compareAnswer · fill_blank / short_text", () => {
  it("numeric fill_blank matches", () => {
    expect(compareAnswer({ expected: "800", got: "800", type: "fill_blank" }).correct).toBe(true);
  });
  it("word fill_blank matches case-insensitively", () => {
    expect(compareAnswer({ expected: "переменная", got: "Переменная", type: "fill_blank" }).correct).toBe(true);
  });
  it("short_text trims and lowercases", () => {
    expect(compareAnswer({ expected: "цикл", got: " ЦИКЛ ", type: "short_text" }).correct).toBe(true);
  });
});

describe("compareAnswer · open (manual review)", () => {
  it("is flagged manual and not auto-correct", () => {
    const r = compareAnswer({ expected: "любой осмысленный ответ", got: "что-то написал", type: "open" });
    expect(r.manual).toBe(true);
    expect(r.correct).toBe(false);
  });
  it("manual even when answer is blank", () => {
    const r = compareAnswer({ expected: "критерий", got: "", type: "open" });
    expect(r.manual).toBe(true);
  });
});

describe("percentToMark · mesh scale", () => {
  it("≥86 → 5", () => {
    expect(percentToMark(100)).toBe(5);
    expect(percentToMark(86)).toBe(5);
  });
  it("70-85 → 4", () => {
    expect(percentToMark(85)).toBe(4);
    expect(percentToMark(70)).toBe(4);
  });
  it("50-69 → 3", () => {
    expect(percentToMark(69)).toBe(3);
    expect(percentToMark(50)).toBe(3);
  });
  it("<50 → 2", () => {
    expect(percentToMark(49)).toBe(2);
    expect(percentToMark(0)).toBe(2);
  });
});
