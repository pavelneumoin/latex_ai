import { describe, expect, it } from "vitest";
import {
  buildBankIndex,
  searchBankFromIndex,
  bankTaskToWorksheetTask,
  dedupByCondition,
  dedupKey,
  type BankTask,
} from "./bank";

// ─── Fixture helpers ──────────────────────────────────────────────────────────

function makeTask(overrides: Partial<BankTask> = {}): BankTask {
  return {
    id: "T1",
    source: "kompege",
    subject: "informatics",
    exam: "ege",
    zadanie_n: 1,
    topic: "системы счисления",
    subtype: "перевод",
    condition: "Переведи 10 из десятичной в двоичную",
    expected_answer: "1010",
    answer_type: "string",
    solution: null,
    tags: ["binary", "conversion"],
    ...overrides,
  };
}

const TASKS: BankTask[] = [
  makeTask({ id: "A1", subject: "informatics", exam: "ege", zadanie_n: 1, topic: "системы счисления", condition: "условие А1", source: "kompege" }),
  makeTask({ id: "A2", subject: "informatics", exam: "ege", zadanie_n: 2, topic: "алгоритмы", condition: "условие А2", source: "fipi" }),
  makeTask({ id: "A3", subject: "informatics", exam: "oge", zadanie_n: 1, topic: "системы счисления", condition: "условие А3", source: "sdamgia" }),
  makeTask({ id: "B1", subject: "math", exam: "ege", zadanie_n: 7, topic: "производная", condition: "найди производную функции sin(x)", source: "mathege", tags: ["тригонометрия"] }),
  makeTask({ id: "B2", subject: "math", exam: "ege_base", zadanie_n: 1, topic: "проценты", condition: "задача на проценты", source: "mathege_base" }),
  makeTask({ id: "B3", subject: "math", exam: "ege", zadanie_n: 7, topic: "тангенс производная", condition: "найди производную tan(x)", source: "mathege", tags: ["тригонометрия", "производная"] }),
];

// ─── buildBankIndex ───────────────────────────────────────────────────────────

describe("buildBankIndex", () => {
  it("indexes all tasks in .all", () => {
    const idx = buildBankIndex(TASKS);
    expect(idx.all).toHaveLength(TASKS.length);
  });

  it("bySubject groups correctly", () => {
    const idx = buildBankIndex(TASKS);
    expect(idx.bySubject.get("informatics")).toHaveLength(3);
    expect(idx.bySubject.get("math")).toHaveLength(3);
  });

  it("bySubjectExam groups correctly", () => {
    const idx = buildBankIndex(TASKS);
    expect(idx.bySubjectExam.get("informatics|ege")).toHaveLength(2);
    expect(idx.bySubjectExam.get("informatics|oge")).toHaveLength(1);
    expect(idx.bySubjectExam.get("math|ege_base")).toHaveLength(1);
  });

  it("byZadanie groups correctly", () => {
    const idx = buildBankIndex(TASKS);
    expect(idx.byZadanie.get("informatics|ege|1")).toHaveLength(1);
    expect(idx.byZadanie.get("math|ege|7")).toHaveLength(2); // B1 + B3
  });

  it("empty input produces empty index", () => {
    const idx = buildBankIndex([]);
    expect(idx.all).toHaveLength(0);
    expect(idx.bySubject.size).toBe(0);
  });
});

// ─── searchBankFromIndex ──────────────────────────────────────────────────────

describe("searchBankFromIndex · filters", () => {
  const idx = buildBankIndex(TASKS);

  it("no filter returns all tasks", () => {
    const res = searchBankFromIndex(idx, {});
    expect(res).toHaveLength(TASKS.length);
  });

  it("subject=informatics returns only informatics tasks", () => {
    const res = searchBankFromIndex(idx, { subject: "informatics" });
    expect(res.every((t) => t.subject === "informatics")).toBe(true);
    expect(res).toHaveLength(3);
  });

  it("subject+exam narrows pool", () => {
    const res = searchBankFromIndex(idx, { subject: "math", exam: "ege" });
    expect(res.every((t) => t.exam === "ege")).toBe(true);
    expect(res).toHaveLength(2); // B1 + B3
  });

  it("subject+exam+zadanie_n narrows to zadanie", () => {
    const res = searchBankFromIndex(idx, { subject: "informatics", exam: "ege", zadanie_n: 2 });
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe("A2");
  });

  it("unknown zadanie_n returns empty array", () => {
    const res = searchBankFromIndex(idx, { subject: "informatics", exam: "ege", zadanie_n: 99 });
    expect(res).toHaveLength(0);
  });

  it("source filter works across subjects", () => {
    const res = searchBankFromIndex(idx, { source: "kompege" });
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe("A1");
  });

  it("limit trims results", () => {
    const res = searchBankFromIndex(idx, { limit: 2 });
    expect(res).toHaveLength(2);
  });

  it("limit=0 is ignored (returns all)", () => {
    const res = searchBankFromIndex(idx, { limit: 0 });
    expect(res).toHaveLength(TASKS.length);
  });
});

describe("searchBankFromIndex · topic search", () => {
  const idx = buildBankIndex(TASKS);

  it("single word match in topic field", () => {
    const res = searchBankFromIndex(idx, { topic: "системы" });
    // A1 and A3 have "системы счисления" in topic
    expect(res.length).toBeGreaterThanOrEqual(2);
    expect(res.every((t) => t.id === "A1" || t.id === "A3")).toBe(true);
  });

  it("multi-word AND search — both words must match", () => {
    // "тангенс производная" → only B3 has "тангенс" in topic AND "производная" in topic+tags
    // B1 has "производная" in topic but NOT "тангенс" anywhere
    const res = searchBankFromIndex(idx, { subject: "math", topic: "тангенс производная" });
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe("B3");
  });

  it("partial mismatch returns nothing", () => {
    const res = searchBankFromIndex(idx, { topic: "производная отсутствует_слово" });
    expect(res).toHaveLength(0);
  });

  it("ё/е normalization: ёщё matches ещё", () => {
    const task = makeTask({ id: "YO", condition: "ещё одна задача", topic: "сложение" });
    const localIdx = buildBankIndex([task]);
    const res = searchBankFromIndex(localIdx, { topic: "ёщё" });
    expect(res).toHaveLength(1);
  });

  it("short words (<= 2 chars) use substring search", () => {
    // Topic "по" (2 chars) → words.length === 0 after filter, uses hay.includes(needle)
    const task = makeTask({ id: "SH", topic: "по условию" });
    const localIdx = buildBankIndex([task]);
    // "по" is in the hay text
    const res = searchBankFromIndex(localIdx, { topic: "по" });
    expect(res.length).toBeGreaterThanOrEqual(1);
  });

  it("empty topic string matches everything", () => {
    const res = searchBankFromIndex(idx, { topic: "" });
    expect(res).toHaveLength(TASKS.length);
  });
});

describe("searchBankFromIndex · deterministic shuffle", () => {
  const idx = buildBankIndex(TASKS);

  it("same seed returns same order", () => {
    const r1 = searchBankFromIndex(idx, { seed: 42 }).map((t) => t.id);
    const r2 = searchBankFromIndex(idx, { seed: 42 }).map((t) => t.id);
    expect(r1).toEqual(r2);
  });

  it("different seeds return different orders (with very high probability)", () => {
    const r1 = searchBankFromIndex(idx, { seed: 42 }).map((t) => t.id);
    const r2 = searchBankFromIndex(idx, { seed: 999 }).map((t) => t.id);
    expect(r1).not.toEqual(r2);
  });

  it("shuffle keeps all elements (no duplicates, none dropped)", () => {
    const res = searchBankFromIndex(idx, { seed: 7 });
    const ids = res.map((t) => t.id).sort();
    expect(ids).toEqual(TASKS.map((t) => t.id).sort());
  });

  it("seed + limit returns first N of shuffled result", () => {
    const full = searchBankFromIndex(idx, { seed: 3 });
    const limited = searchBankFromIndex(idx, { seed: 3, limit: 2 });
    expect(limited).toHaveLength(2);
    expect(limited[0].id).toBe(full[0].id);
    expect(limited[1].id).toBe(full[1].id);
  });
});

// ─── bankTaskToWorksheetTask ──────────────────────────────────────────────────

describe("bankTaskToWorksheetTask", () => {
  it("maps fields correctly", () => {
    const t = makeTask({ condition: "Условие", expected_answer: "42", answer_type: "number", solution: null });
    const ws = bankTaskToWorksheetTask(t, 3);
    expect(ws.n).toBe(3);
    expect(ws.condition).toBe("Условие");
    expect(ws.expected_answer).toBe("42");
    expect(ws.answer_type).toBe("number");
  });

  it("includes solution when present", () => {
    const t = makeTask({ solution: "Решение: 2+2=4" });
    const ws = bankTaskToWorksheetTask(t, 1);
    expect(ws.solution).toBe("Решение: 2+2=4");
  });

  it("omits solution key when null", () => {
    const t = makeTask({ solution: null });
    const ws = bankTaskToWorksheetTask(t, 1);
    expect("solution" in ws).toBe(false);
  });
});

// ─── dedup ────────────────────────────────────────────────────────────────────

describe("dedupKey", () => {
  it("collapses case, ё/е, spaces and punctuation to one key", () => {
    expect(dedupKey("Найдите 15% от 240.")).toBe(dedupKey("найдите  15 % от 240"));
  });
  it("ё and е produce the same key", () => {
    expect(dedupKey("Найдём ответ")).toBe(dedupKey("Найдем ответ"));
  });
  it("different conditions → different keys", () => {
    expect(dedupKey("Найдите 15% от 240")).not.toBe(dedupKey("Найдите 20% от 300"));
  });
});

describe("dedupByCondition", () => {
  it("removes same-condition tasks from different sources, keeps first", () => {
    const dups: BankTask[] = [
      makeTask({ id: "K1", source: "kompege", condition: "Найдите 15% от 240." }),
      makeTask({ id: "F1", source: "fipi", condition: "найдите 15 % от 240" }), // same after norm
      makeTask({ id: "S1", source: "sdamgia", condition: "Совсем другая задача" }),
    ];
    const out = dedupByCondition(dups);
    expect(out).toHaveLength(2);
    expect(out[0].id).toBe("K1"); // first occurrence kept
    expect(out.map((t) => t.id)).not.toContain("F1");
  });
  it("keeps tasks with empty conditions (does not collapse them)", () => {
    const out = dedupByCondition([
      makeTask({ id: "E1", condition: "" }),
      makeTask({ id: "E2", condition: "" }),
    ]);
    expect(out).toHaveLength(2);
  });
});

describe("searchBankFromIndex · dedup", () => {
  const withDups: BankTask[] = [
    makeTask({ id: "A", subject: "math", exam: "ege", zadanie_n: 7, condition: "Решите уравнение x+1=2" }),
    makeTask({ id: "B", subject: "math", exam: "ege", zadanie_n: 7, condition: "решите уравнение x + 1 = 2" }), // dup of A
    makeTask({ id: "C", subject: "math", exam: "ege", zadanie_n: 7, condition: "Решите уравнение x+1=5" }),
  ];
  const idx = buildBankIndex(withDups);

  it("dedups by default", () => {
    const res = searchBankFromIndex(idx, { subject: "math", exam: "ege", zadanie_n: 7 });
    expect(res).toHaveLength(2);
  });
  it("dedup:false keeps duplicates", () => {
    const res = searchBankFromIndex(idx, { subject: "math", exam: "ege", zadanie_n: 7, dedup: false });
    expect(res).toHaveLength(3);
  });
  it("dedup applies before limit", () => {
    const res = searchBankFromIndex(idx, { subject: "math", exam: "ege", zadanie_n: 7, limit: 3 });
    // only 2 unique exist, so limit 3 still yields 2
    expect(res).toHaveLength(2);
  });
});
