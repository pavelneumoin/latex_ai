import { describe, expect, it } from "vitest";
import {
  canReadWorksheet,
  isWorksheetOwner,
  ownerOnlyAnswerFields,
  redactWorksheetAnswers,
} from "./worksheet-privacy";

describe("worksheet privacy", () => {
  it("allows a private worksheet only to its owner", () => {
    const privateWorksheet = { isPublic: false, userId: "teacher-1" };

    expect(canReadWorksheet(privateWorksheet, "teacher-1")).toBe(true);
    expect(canReadWorksheet(privateWorksheet, "teacher-2")).toBe(false);
    expect(canReadWorksheet(privateWorksheet, null)).toBe(false);
    expect(isWorksheetOwner(null, "teacher-1")).toBe(false);
  });

  it("allows public worksheets without treating the reader as the owner", () => {
    const publicWorksheet = { isPublic: true, userId: "teacher-1" };

    expect(canReadWorksheet(publicWorksheet, null)).toBe(true);
    expect(isWorksheetOwner(publicWorksheet.userId, null)).toBe(false);
    expect(isWorksheetOwner(publicWorksheet.userId, "teacher-2")).toBe(false);
  });

  it("adds raw answer fields only for the authenticated owner", () => {
    const fields = {
      expected: "42",
      normalized_expected: "42",
      answerKeyPath: "storage/answer-key.json",
    };

    expect(ownerOnlyAnswerFields(false, fields)).toEqual({});
    expect(ownerOnlyAnswerFields(true, fields)).toEqual(fields);
  });

  it("removes answer fields and aliases recursively without mutating content", () => {
    const content = {
      title: "Дроби",
      tasks: [
        {
          n: 1,
          condition: "2 + 2",
          expected_answer: "4",
          solution: "Складываем два и два",
          options: [
            { text: "3", correct: false },
            { text: "4", isCorrect: true },
          ],
          meta: { answerKeyPath: "storage/secret.json" },
        },
        {
          n: 2,
          condition: "Продолжите ряд",
          expected: "8",
          explanation: "Удваиваем число",
        },
      ],
    };

    const safe = redactWorksheetAnswers(content);

    expect(safe).toEqual({
      title: "Дроби",
      tasks: [
        {
          n: 1,
          condition: "2 + 2",
          options: [{ text: "3" }, { text: "4" }],
          meta: {},
        },
        {
          n: 2,
          condition: "Продолжите ряд",
        },
      ],
    });
    expect(content.tasks[0].expected_answer).toBe("4");
    expect(content.tasks[0].solution).toBe("Складываем два и два");
  });
});
