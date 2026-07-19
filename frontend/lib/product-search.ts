export interface ProductSearchDocument {
  title: string;
  description?: string | null;
  course?: string | null;
  courseSlug?: string | null;
  audience?: string | null;
  subject?: string | null;
  kind?: string | null;
  lessonNo?: number | null;
}

const STOP_WORDS = new Set(["и", "в", "во", "на", "по", "для", "из", "к"]);

const SUBJECT_TERMS: Record<string, string> = {
  math: "математика алгебра геометрия",
  informatics: "информатика программирование",
};

const KIND_TERMS: Record<string, string> = {
  lesson_kit: "урок комплект презентация слайды рабочий лист домашнее задание дз",
  presentation: "презентация слайды",
  worksheet: "рабочий лист задания",
  test: "тест проверочная контрольная",
  course_bundle: "курс комплект уроков",
};

export function normalizeProductSearch(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("ru-RU")
    .replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function productSearchTerms(query: string): string[] {
  const seen = new Set<string>();
  for (const token of normalizeProductSearch(query).split(" ")) {
    if (!token || STOP_WORDS.has(token)) continue;
    if (token.length < 2 && !/^\d$/.test(token)) continue;
    seen.add(token);
  }
  return [...seen];
}

function editDistance(a: string, b: string, maxDistance: number): number {
  if (Math.abs(a.length - b.length) > maxDistance) return maxDistance + 1;

  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    let rowMinimum = current[0];
    for (let j = 1; j <= b.length; j += 1) {
      const value = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      current.push(value);
      rowMinimum = Math.min(rowMinimum, value);
    }
    if (rowMinimum > maxDistance) return maxDistance + 1;
    previous = current;
  }
  return previous[b.length];
}

function wordMatchScore(term: string, word: string): number {
  if (term === word) return 60;
  if (word.startsWith(term)) return 44;
  if (term.length >= 5 && term.startsWith(word) && word.length >= 5) return 30;

  if (term.length >= 5 && word.length >= 5) {
    const threshold = term.length >= 8 ? 2 : 1;
    const candidates = new Set([word, word.slice(0, term.length)]);
    for (const candidate of candidates) {
      if (candidate.length < 5) continue;
      if (editDistance(term, candidate, threshold) <= threshold) return 24;
    }
  }

  return 0;
}

function fieldMatchScore(field: string, term: string): number {
  if (!field) return 0;
  if (field === term) return 70;

  let best = field.includes(term) ? 34 : 0;
  for (const word of field.split(" ")) {
    best = Math.max(best, wordMatchScore(term, word));
  }
  return best;
}

function searchFields(document: ProductSearchDocument) {
  const subject = document.subject ? SUBJECT_TERMS[document.subject] ?? document.subject : "";
  const kind = document.kind ? KIND_TERMS[document.kind] ?? document.kind : "";
  const lesson = document.lessonNo == null ? "" : `урок ${document.lessonNo}`;

  return [
    { value: normalizeProductSearch(document.title), weight: 6 },
    { value: normalizeProductSearch(document.course ?? ""), weight: 4 },
    { value: normalizeProductSearch(document.audience ?? ""), weight: 3 },
    {
      value: normalizeProductSearch(
        `${subject} ${kind} ${lesson} ${document.courseSlug ?? ""}`
      ),
      weight: 2,
    },
    { value: normalizeProductSearch(document.description ?? ""), weight: 1 },
  ];
}

/** Возвращает релевантность или null, если хотя бы одно значимое слово не найдено. */
export function scoreProductSearch(
  document: ProductSearchDocument,
  query: string
): number | null {
  const terms = productSearchTerms(query);
  if (terms.length === 0) return null;

  const fields = searchFields(document);
  let score = 0;

  for (const term of terms) {
    let best = 0;
    for (const field of fields) {
      best = Math.max(best, fieldMatchScore(field.value, term) * field.weight);
    }
    if (best === 0) return null;
    score += best;
  }

  const normalizedQuery = normalizeProductSearch(query);
  const normalizedTitle = fields[0].value;
  if (normalizedTitle === normalizedQuery) score += 600;
  else if (normalizedTitle.startsWith(normalizedQuery)) score += 320;
  else if (normalizedTitle.includes(normalizedQuery)) score += 220;

  return score;
}
