/**
 * Поля с эталонами не должны попадать в ученическую/публичную выдачу.
 * Удаляем также распространённые алиасы: разные LLM могут вернуть один и тот
 * же ответ под разными именами.
 */
const PRIVATE_ANSWER_FIELDS = new Set([
  "expected_answer",
  "expectedAnswer",
  "expected",
  "answer",
  "solution",
  "solutions",
  "explanation",
  "correct",
  "isCorrect",
  "result",
  "answer_key",
  "answerKey",
  "answerKeyPath",
]);

export function isWorksheetOwner(
  worksheetUserId: string | null,
  sessionUserId: string | null | undefined
): boolean {
  return Boolean(worksheetUserId && sessionUserId && worksheetUserId === sessionUserId);
}

export function canReadWorksheet(
  worksheet: { isPublic: boolean; userId: string | null },
  sessionUserId: string | null | undefined
): boolean {
  return worksheet.isPublic || isWorksheetOwner(worksheet.userId, sessionUserId);
}

export function ownerOnlyAnswerFields<T extends Record<string, unknown>>(
  isOwner: boolean,
  fields: T
): Partial<T> {
  return isOwner ? fields : {};
}

/**
 * Возвращает новую JSON-структуру без ответов и решений, не изменяя оригинал.
 */
export function redactWorksheetAnswers(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactWorksheetAnswers);
  }
  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).flatMap(([key, nested]) =>
      PRIVATE_ANSWER_FIELDS.has(key)
        ? []
        : [[key, redactWorksheetAnswers(nested)]]
    )
  );
}
