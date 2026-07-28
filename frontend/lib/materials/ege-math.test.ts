import { describe, expect, it } from "vitest";
import {
  EGE_MATH_MATERIALS_META,
  EGE_MATH_PROGRESS_KEYS,
  EGE_MATH_SUBTOPIC_COUNT,
  EGE_MATH_TOPICS,
  materialProgressKey,
} from "./ege-math";

describe("EGE math materials taxonomy", () => {
  it("contains the complete exam structure snapshot", () => {
    expect(EGE_MATH_TOPICS).toHaveLength(19);
    expect(EGE_MATH_TOPICS.filter((topic) => topic.part === 1)).toHaveLength(12);
    expect(EGE_MATH_TOPICS.filter((topic) => topic.part === 2)).toHaveLength(7);
    expect(EGE_MATH_SUBTOPIC_COUNT).toBe(95);
  });

  it("keeps stable unique progress keys", () => {
    const keys = EGE_MATH_TOPICS.flatMap((topic) =>
      topic.subtopics.map((subtopic) => materialProgressKey(topic, subtopic))
    );

    expect(new Set(keys).size).toBe(keys.length);
    expect(EGE_MATH_PROGRESS_KEYS.size).toBe(keys.length);
  });

  it("stores source attribution and snapshot date", () => {
    expect(EGE_MATH_MATERIALS_META.sourceUrl).toBe(
      "https://bank-zadach.ru/build"
    );
    expect(EGE_MATH_MATERIALS_META.fetchedAt).toBe("2026-07-28");
  });
});
