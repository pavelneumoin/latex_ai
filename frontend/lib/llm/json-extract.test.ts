import { describe, expect, it } from "vitest";
import { extractLooseJson, repairJsonBackslashes } from "./json-extract";

describe("extractLooseJson · valid input", () => {
  it("parses plain valid JSON", () => {
    expect(extractLooseJson('{"a":1,"b":"x"}')).toEqual({ a: 1, b: "x" });
  });
  it("strips ```json markdown fences", () => {
    expect(extractLooseJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });
  it("strips bare ``` fences", () => {
    expect(extractLooseJson('```\n{"a":1}\n```')).toEqual({ a: 1 });
  });
  it("returns undefined for empty/garbage", () => {
    expect(extractLooseJson("")).toBeUndefined();
    expect(extractLooseJson("   ")).toBeUndefined();
    expect(extractLooseJson("totally not json")).toBeUndefined();
  });
});

describe("extractLooseJson · LaTeX backslashes (the real GigaChat bug)", () => {
  it("repairs unescaped \\% (invalid JSON escape that used to throw)", () => {
    // JS source "$20\\%$" === the 6-char string $20\%$  (single backslash)
    const r = extractLooseJson('{"c":"$20\\%$"}') as { c: string };
    expect(r.c).toBe("$20\\%$");
  });
  it("repairs \\frac (which direct JSON.parse would corrupt into a formfeed)", () => {
    const r = extractLooseJson('{"c":"\\frac{a}{b}"}') as { c: string };
    expect(r.c).toBe("\\frac{a}{b}");
  });
  it("repairs \\times / \\sqrt / \\, mix", () => {
    const r = extractLooseJson('{"c":"$\\sqrt{2}\\times 3\\,000$"}') as { c: string };
    expect(r.c).toBe("$\\sqrt{2}\\times 3\\,000$");
  });
  it("keeps already-correctly-escaped \\\\ pairs intact", () => {
    // JS source "\\\\times" === the 7-char string \\times → valid JSON → \times
    const r = extractLooseJson('{"c":"\\\\times"}') as { c: string };
    expect(r.c).toBe("\\times");
  });
  it("preserves escaped quotes inside strings", () => {
    const r = extractLooseJson('{"c":"a \\"b\\" c"}') as { c: string };
    expect(r.c).toBe('a "b" c');
  });
  it("handles a realistic broken worksheet blob (mixed single/double escaping)", () => {
    const broken =
      '{"title":"Проценты","tasks":[' +
      '{"n":1,"condition":"Найдите $15\\%$ от $240$.","expected_answer":"36","answer_type":"number","solution":"$240\\cdot0{,}15=36$"},' +
      '{"n":2,"condition":"Вычислите $\\frac{3}{4}$ от $80$.","expected_answer":"60","answer_type":"number"}' +
      "]}";
    const r = extractLooseJson(broken) as {
      title: string;
      tasks: Array<{ n: number; condition: string; expected_answer: string }>;
    };
    expect(r.title).toBe("Проценты");
    expect(r.tasks).toHaveLength(2);
    expect(r.tasks[0].condition).toContain("15\\%");
    expect(r.tasks[1].condition).toContain("\\frac{3}{4}");
    expect(r.tasks[1].expected_answer).toBe("60");
  });
  it("recovers JSON embedded after a preamble line", () => {
    const r = extractLooseJson('Вот ваш лист:\n{"a":1,"c":"$\\pi$"}') as { a: number; c: string };
    expect(r.a).toBe(1);
    expect(r.c).toBe("$\\pi$");
  });
});

describe("repairJsonBackslashes", () => {
  it("does not touch backslashes outside strings (none in JSON structure)", () => {
    expect(repairJsonBackslashes('{"a":1}')).toBe('{"a":1}');
  });
  it("doubles a lone backslash inside a string", () => {
    // input string: {"c":"\x"} (single backslash) → output {"c":"\\x"}
    expect(repairJsonBackslashes('{"c":"\\x"}')).toBe('{"c":"\\\\x"}');
  });
});
