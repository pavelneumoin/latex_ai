import { describe, expect, it } from "vitest";
import { normalizeWorksheetContent } from "./worksheets";

type Result = {
  title?: string;
  tasks?: Array<{
    n: number;
    condition: string;
    expected_answer?: string;
    answer_type?: string;
    solution?: string;
    hint?: string;
  }>;
};

describe("normalizeWorksheetContent", () => {
  it("passes canonical shape through", () => {
    const input = {
      title: "T",
      subtitle: "S",
      tasks: [
        { n: 1, condition: "C", expected_answer: "1", answer_type: "number", solution: "S" },
      ],
    };
    const out = normalizeWorksheetContent(input) as Result;
    expect(out.tasks?.[0].n).toBe(1);
    expect(out.tasks?.[0].condition).toBe("C");
    expect(out.tasks?.[0].expected_answer).toBe("1");
    expect(out.tasks?.[0].solution).toBe("S");
  });

  it("renames GigaChat-style aliases (id/question/answer)", () => {
    const input = {
      title: "T",
      tasks: [
        { id: 7, question: "Q1", answer: "42", answer_type: "number" },
        { id: 8, question: "Q2", answer: "x+1", answer_type: "expression" },
      ],
    };
    const out = normalizeWorksheetContent(input) as Result;
    expect(out.tasks?.length).toBe(2);
    expect(out.tasks?.[0]).toMatchObject({ n: 7, condition: "Q1", expected_answer: "42", answer_type: "number" });
    expect(out.tasks?.[1]).toMatchObject({ n: 8, condition: "Q2", expected_answer: "x+1" });
  });

  it("renames `problems` to `tasks`", () => {
    const input = {
      title: "T",
      problems: [{ id: 1, text: "P1", answer: "10" }],
    };
    const out = normalizeWorksheetContent(input) as Result;
    expect(out.tasks?.[0]).toMatchObject({ n: 1, condition: "P1", expected_answer: "10" });
  });

  it("uses solutions alias and explanation", () => {
    const input = {
      tasks: [{ n: 1, condition: "C", expected_answer: "1", solutions: "Sol-text", answer_type: "number" }],
    };
    const out = normalizeWorksheetContent(input) as Result;
    expect(out.tasks?.[0].solution).toBe("Sol-text");
  });

  it("fills n from index when missing", () => {
    const input = {
      tasks: [
        { question: "Q1", answer: "1" },
        { question: "Q2", answer: "2" },
      ],
    };
    const out = normalizeWorksheetContent(input) as Result;
    expect(out.tasks?.[0].n).toBe(1);
    expect(out.tasks?.[1].n).toBe(2);
  });

  it("defaults answer_type to 'string' when absent", () => {
    const input = { tasks: [{ n: 1, condition: "C", expected_answer: "x" }] };
    const out = normalizeWorksheetContent(input) as Result;
    expect(out.tasks?.[0].answer_type).toBe("string");
  });

  it("returns input unchanged when no tasks-like array", () => {
    const input = { foo: "bar" };
    expect(normalizeWorksheetContent(input)).toBe(input);
  });

  it("handles non-object input", () => {
    expect(normalizeWorksheetContent(null)).toBe(null);
    expect(normalizeWorksheetContent("string")).toBe("string");
  });
});
