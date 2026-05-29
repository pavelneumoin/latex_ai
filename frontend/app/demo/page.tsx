import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "../_components/Header";
import { WorksheetPreview } from "../my/[id]/WorksheetPreview";
import { getStylePalette, STYLE_PALETTE } from "@/lib/style-palette";

export const metadata: Metadata = {
  title: "Пример рабочего листа — РабочийЛист.ai",
  description:
    "Живой пример рабочего листа: разные типы заданий (выбор, верно/неверно, пропуск, соответствие) и оформление под выбранный шаблон.",
};

export const dynamic = "force-dynamic";

// Фиксированный демо-лист — показывает все типы заданий разом.
const DEMO_CONTENT = {
  title: "Проценты вокруг нас",
  subtitle: "Демонстрация: 8 заданий разных форматов на одну тему.",
  tasks: [
    {
      n: 1,
      condition: "Вычислите $15\\%$ от числа $240$.",
      expected_answer: "36",
      answer_type: "number",
    },
    {
      n: 2,
      condition:
        "Товар стоил $800$ рублей, цену снизили на $25\\%$. Сколько он стал стоить? Выберите верный ответ.",
      expected_answer: "600 рублей",
      answer_type: "choice",
      options: ["500 рублей", "600 рублей", "640 рублей", "775 рублей"],
    },
    {
      n: 3,
      condition:
        "Верно ли: если число увеличить на $20\\%$, а потом результат уменьшить на $20\\%$, получится исходное число?",
      expected_answer: "Неверно",
      answer_type: "true_false",
      options: ["Верно", "Неверно"],
    },
    {
      n: 4,
      condition:
        "Вклад $10\\,000$ рублей под $8\\%$ годовых пролежал год. Вставьте пропущенное: проценты составили ___ рублей.",
      expected_answer: "800",
      answer_type: "fill_blank",
    },
    {
      n: 5,
      condition: "Какие из чисел являются $50\\%$ от $30$? Отметьте все верные.",
      expected_answer: "15; половина от 30",
      answer_type: "multiple_choice",
      options: ["10", "15", "половина от 30", "20"],
    },
    {
      n: 6,
      condition: "Установите соответствие между процентом и его дробью.",
      expected_answer: "А-2; Б-3; В-1",
      answer_type: "matching",
      options: ["А) $25\\%$ — 1) $0{,}5$", "Б) $10\\%$ — 2) $0{,}25$", "В) $50\\%$ — 3) $0{,}1$"],
    },
    {
      n: 7,
      condition: "Как называется сотая часть числа? Запишите одним словом.",
      expected_answer: "процент",
      answer_type: "short_text",
    },
    {
      n: 8,
      condition:
        "Объясните, почему скидка $50\\%$, а затем ещё $50\\%$ — это не бесплатно. Приведите расчёт.",
      expected_answer: "После двух скидок остаётся 25% цены",
      answer_type: "open",
    },
  ],
};

// Подборка контрастных стилей для демонстрации разнообразия оформления.
const SHOWCASE_STYLES = [
  "classic_wildcat_purple",
  "cards_emerald",
  "newspaper_navy",
  "journal_amber",
  "space_dark",
  "oge_official_bw",
  "notebook_ink",
  "olympiad_premium",
];

export default function DemoPage({
  searchParams,
}: {
  searchParams?: { style?: string; answers?: string };
}) {
  const style =
    searchParams?.style && STYLE_PALETTE[searchParams.style]
      ? searchParams.style
      : "classic_wildcat_purple";
  const showAnswers = searchParams?.answers !== "0";

  return (
    <div className="hi" style={{ minHeight: "100vh", background: "var(--surface)" }}>
      <Header />
      <main style={{ maxWidth: 920, margin: "0 auto", padding: "32px 24px 64px" }}>
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <h1 style={{ marginBottom: 8 }}>Как выглядит готовый лист</h1>
          <p className="muted-2" style={{ fontSize: 15, maxWidth: 640, margin: "0 auto" }}>
            Это пример: восемь заданий разных форматов на одну тему. В реальном
            сервисе нейросеть собирает такой лист за минуту по вашему описанию — и
            экспортирует в PDF, Word или LaTeX.
          </p>
        </div>

        {/* Переключатель стиля */}
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            justifyContent: "center",
            margin: "20px 0",
          }}
        >
          {SHOWCASE_STYLES.map((s) => {
            const p = getStylePalette(s);
            const active = s === style;
            return (
              <Link
                key={s}
                href={`/demo?style=${s}${showAnswers ? "" : "&answers=0"}`}
                scroll={false}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none",
                  border: `1.5px solid ${active ? p.primary : "var(--border)"}`,
                  background: active ? p.primary : "var(--bg)",
                  color: active ? "#fff" : "var(--fg-2)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: p.primary,
                    border: active ? "1px solid rgba(255,255,255,0.6)" : "none",
                  }}
                />
                {p.label ?? s}
              </Link>
            );
          })}
        </div>

        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <Link
            href={`/demo?style=${style}&answers=${showAnswers ? "0" : "1"}`}
            scroll={false}
            style={{ fontSize: 13, color: "var(--primary)", textDecoration: "none" }}
          >
            {showAnswers ? "Скрыть ответы (как для ученика)" : "Показать ответы (как для учителя)"}
          </Link>
        </div>

        <WorksheetPreview
          title={DEMO_CONTENT.title}
          subtitle={DEMO_CONTENT.subtitle}
          templateStyle={style}
          templateName={getStylePalette(style).label ?? null}
          templateId={null}
          tasks={DEMO_CONTENT.tasks}
          showAnswers={showAnswers}
        />

        {/* CTA */}
        <div
          className="card"
          style={{
            marginTop: 28,
            padding: 28,
            textAlign: "center",
            background: "var(--primary)",
            border: "none",
          }}
        >
          <h2 style={{ color: "#fff", marginBottom: 8 }}>Соберите свой лист за минуту</h2>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 14, marginBottom: 18 }}>
            Опишите тему — нейросеть подготовит задания, посчитает ответы и оформит PDF.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/register"
              className="btn btn-lg"
              style={{ background: "#fff", color: "var(--primary)", fontWeight: 700 }}
            >
              Попробовать бесплатно
            </Link>
            <Link
              href="/templates"
              className="btn btn-lg"
              style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}
            >
              Все шаблоны
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
