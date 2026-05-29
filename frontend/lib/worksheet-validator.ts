// Валидатор сгенерированного контента рабочего листа.
//
// Зачем: нейросеть иногда отдаёт некорректные задачи — пустой ответ, choice без
// options, верный ответ не из списка вариантов, «голый» LaTeX вне $...$,
// пропущенный ___ в fill_blank. Этот модуль детерминированно проверяет JSON и
// возвращает список замечаний + оценку качества. Повышает доверие к нейрофункции.
//
// Чистый модуль (без I/O), покрыт worksheet-validator.test.ts.

export type IssueSeverity = "error" | "warning" | "info";

export interface ValidationIssue {
  severity: IssueSeverity;
  taskN?: number;      // номер задачи (undefined = проблема всего листа)
  code: string;        // машинный код
  message: string;     // человекочитаемое сообщение
}

export interface ValidationResult {
  ok: boolean;             // нет ошибок уровня error
  score: number;           // 0..100 — оценка качества листа
  issues: ValidationIssue[];
  counts: { error: number; warning: number; info: number };
}

interface VTask {
  n?: number | string;
  condition?: string;
  expected_answer?: string;
  expected?: string;
  answer?: string;
  answer_type?: string;
  options?: unknown;
  solution?: string;
}

interface VContent {
  title?: string;
  subtitle?: string;
  tasks?: VTask[];
}

const CHOICE_TYPES = new Set(["choice", "multiple_choice", "true_false", "matching"]);

// LaTeX-команды, которые НЕ должны встречаться в тексте условия вне $...$.
const BARE_LATEX_RE = /\\(frac|dfrac|sqrt|sum|int|cdot|times|le|ge|alpha|beta|pi|begin|end|left|right)\b/;

function getAnswer(t: VTask): string {
  return String(t.expected_answer ?? t.expected ?? t.answer ?? "").trim();
}

function getOptions(t: VTask): string[] {
  if (!Array.isArray(t.options)) return [];
  return t.options.map((o) => String(o)).filter(Boolean);
}

function stripMath(s: string): string {
  // Убираем содержимое $...$, чтобы искать «голый» LaTeX только вне формул.
  return s.replace(/\$[^$]*\$/g, " ");
}

function isNumberLike(s: string): boolean {
  const t = s.replace(/,/g, ".").replace(/\s+/g, "");
  return /^-?\d+(\.\d+)?$/.test(t);
}

function normForCompare(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").replace(/[.,;]+$/, "").trim();
}

export function validateWorksheet(content: unknown): ValidationResult {
  const issues: ValidationIssue[] = [];
  const add = (severity: IssueSeverity, code: string, message: string, taskN?: number) =>
    issues.push({ severity, code, message, taskN });

  const c = (content && typeof content === "object" ? content : {}) as VContent;
  const tasks = Array.isArray(c.tasks) ? c.tasks : [];

  // Лист целиком
  if (!c.title || !c.title.trim()) {
    add("warning", "no_title", "У листа нет заголовка.");
  }
  if (tasks.length === 0) {
    add("error", "no_tasks", "В листе нет ни одной задачи.");
    return finalize(issues);
  }

  const seenN = new Set<number>();
  tasks.forEach((t, idx) => {
    const n = Number(t.n ?? idx + 1) || idx + 1;
    const type = (t.answer_type ?? "string").toString();
    const condition = (t.condition ?? "").toString().trim();
    const answer = getAnswer(t);
    const options = getOptions(t);

    // 1. Условие
    if (!condition) {
      add("error", "empty_condition", "Пустое условие задачи.", n);
    } else {
      const bare = stripMath(condition).match(BARE_LATEX_RE);
      if (bare) {
        add(
          "warning",
          "bare_latex",
          `Похоже на LaTeX-команду «\\${bare[1]}» вне формулы $...$ — может сломать вёрстку.`,
          n
        );
      }
    }

    // 2. Ответ (open не требует ответа)
    if (type !== "open" && !answer) {
      add("error", "empty_answer", "Не указан ответ.", n);
    }

    // 3. Варианты для choice-подобных
    if (CHOICE_TYPES.has(type)) {
      if (options.length < 2) {
        add("error", "no_options", `Тип «${type}» требует минимум 2 варианта (поле options).`, n);
      } else if (type === "choice" || type === "true_false") {
        // Верный ответ должен быть среди вариантов
        const found = options.some((o) => normForCompare(o) === normForCompare(answer));
        if (answer && !found) {
          add(
            "warning",
            "answer_not_in_options",
            "Правильный ответ не совпадает ни с одним из вариантов.",
            n
          );
        }
      }
      if (type === "true_false" && options.length !== 2) {
        add("info", "tf_two_options", "Для «верно/неверно» ожидается ровно 2 варианта.", n);
      }
    }

    // 4. number — ответ должен быть числом
    if (type === "number" && answer && !isNumberLike(answer)) {
      add("warning", "number_not_numeric", `Тип «number», но ответ «${answer}» не похож на число.`, n);
    }

    // 5. fill_blank — пропуск в условии
    if (type === "fill_blank" && condition && !condition.includes("___")) {
      add("info", "no_blank_marker", "Для fill_blank в условии ожидается пропуск «___».", n);
    }

    // 6. Несбалансированные доллары формул
    const dollars = (condition.match(/\$/g) || []).length;
    if (dollars % 2 !== 0) {
      add("warning", "unbalanced_math", "Нечётное число символов $ — формула не закрыта.", n);
    }

    // 7. Дубли номеров
    if (seenN.has(n)) {
      add("warning", "duplicate_n", `Номер задачи ${n} повторяется.`, n);
    }
    seenN.add(n);
  });

  // 8. Последовательность нумерации 1..N
  const expectedSeq = Array.from({ length: tasks.length }, (_, i) => i + 1);
  const actualSeq = tasks.map((t, idx) => Number(t.n ?? idx + 1) || idx + 1);
  if (JSON.stringify(actualSeq) !== JSON.stringify(expectedSeq)) {
    add("info", "nonsequential", "Нумерация задач не идёт подряд 1, 2, 3…", undefined);
  }

  return finalize(issues);
}

function finalize(issues: ValidationIssue[]): ValidationResult {
  const counts = { error: 0, warning: 0, info: 0 };
  for (const i of issues) counts[i.severity]++;
  // Оценка: старт 100, −25 за error, −8 за warning, −2 за info, низ 0.
  const score = Math.max(
    0,
    100 - counts.error * 25 - counts.warning * 8 - counts.info * 2
  );
  return {
    ok: counts.error === 0,
    score,
    issues,
    counts,
  };
}
