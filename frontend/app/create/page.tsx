"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Template {
  id: string;
  name: string;
  description: string;
  subject: string;
  grade: number | null;
  layout: string;
  style: string;
  taskCount: number;
  tags: string[];
}

interface BankStats {
  total: number;
  by_subject_exam: Record<string, number>;
  by_source: Record<string, number>;
}

const EXAM_LABELS: Record<string, string> = {
  ege: "ЕГЭ (профиль)",
  ege_base: "ЕГЭ (база)",
  oge: "ОГЭ",
};

const SUBJECT_LABEL: Record<string, string> = {
  math: "Математика",
  informatics: "Информатика",
  mixed: "Смешанный",
};

export default function CreatePage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[] | null>(null);
  const [bankStats, setBankStats] = useState<BankStats | null>(null);

  // Form state
  const [templateId, setTemplateId] = useState<string>("");
  const [source, setSource] = useState<"llm" | "bank">("llm");
  const [topic, setTopic] = useState<string>("");
  const [subject, setSubject] = useState<"math" | "informatics" | "mixed">("math");
  const [grade, setGrade] = useState<number>(11);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");

  // Bank filters
  const [bankExam, setBankExam] = useState<"ege" | "ege_base" | "oge">("ege");
  const [bankZadanieN, setBankZadanieN] = useState<string>("");
  const [bankSource, setBankSource] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/templates").then((r) => r.json()).then((d) => {
      const list = (d.templates ?? []) as Template[];
      setTemplates(list);
      if (list.length && !templateId) setTemplateId(list[0].id);
    }).catch((e) => setErr("Не удалось загрузить шаблоны: " + e.message));

    fetch("/api/bank/stats").then((r) => r.json()).then(setBankStats).catch(() => {
      // Bank необязателен.
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tpl = useMemo(
    () => templates?.find((t) => t.id === templateId) ?? null,
    [templates, templateId]
  );

  const bankMatchKey = `${subject === "mixed" ? "math" : subject}|${bankExam}`;
  const bankMatchCount = bankStats?.by_subject_exam[bankMatchKey] ?? 0;

  async function generate() {
    if (!tpl) return;
    setLoading(true);
    setErr(null);
    try {
      const payload: Record<string, unknown> = {
        templateId: tpl.id,
        topic: topic.trim() || undefined,
        subject,
        grade,
        difficulty,
        source,
      };
      if (source === "bank") {
        payload.bank_filter = {
          subject: subject === "mixed" ? undefined : subject,
          exam: bankExam,
          zadanie_n: bankZadanieN ? Number(bankZadanieN) : undefined,
          topic: topic.trim() || undefined,
          source: bankSource || undefined,
        };
      }
      const r = await fetch("/api/worksheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (r.status === 401) {
        router.push("/login?next=/create");
        return;
      }
      const data = await r.json();
      if (!r.ok) {
        throw new Error(data?.error === "bank_no_match"
          ? "В банке нет подходящих задач под этот фильтр — расширь параметры или переключи на LLM."
          : data?.error || `HTTP ${r.status}`);
      }
      router.push(`/my/${data.worksheet.id}`);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "var(--surface)", color: "var(--fg)" }}>
      <header
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 32px", borderBottom: "1px solid var(--border)", background: "var(--bg)",
        }}
      >
        <Link href="/" style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--primary)", color: "var(--primary-fg)", display: "grid", placeItems: "center", fontFamily: "var(--display)", fontWeight: 800, fontSize: 14 }}>РЛ</div>
          <span style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 16 }}>РабочийЛист·ai</span>
        </Link>
        <span style={{ fontSize: 13, color: "var(--fg-3)" }}>Создание листа</span>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
        <h1 style={{ fontFamily: "var(--display)", fontSize: 28, fontWeight: 700, margin: "8px 0 6px" }}>
          Новый рабочий лист
        </h1>
        <p style={{ color: "var(--fg-3)", marginTop: 0, marginBottom: 24 }}>
          Выбери источник задач и параметры. PDF, DOCX, .tex и автопроверку получишь сразу после генерации.
        </p>

        {/* Источник */}
        <Section title="1. Источник задач">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <SourceCard
              checked={source === "llm"}
              onClick={() => setSource("llm")}
              title="LLM — сгенерировать с нуля"
              desc="GigaChat придумает задачи по теме и посчитает ответы. Подходит когда нужны свежие задачи или нет банка под тему."
              badge="GigaChat-Max"
            />
            <SourceCard
              checked={source === "bank"}
              onClick={() => setSource("bank")}
              title="Из банка ФИПИ"
              desc={
                bankStats
                  ? `${bankStats.total} проверенных задач: ФИПИ, kompege, решуЕГЭ/ОГЭ. Условие и ответ — точные.`
                  : "Загрузка банка…"
              }
              badge="ФИПИ"
            />
          </div>
        </Section>

        {/* Тема + параметры */}
        <Section title="2. Параметры">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Тема (опционально для банка)" hint="Например, «Линейные уравнения» или «Стереометрия»">
              <input
                className="input"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={source === "bank" ? "оставь пустым → случайные из выборки" : "обязательно для LLM"}
              />
            </Field>
            <Field label="Предмет">
              <select className="select" value={subject} onChange={(e) => setSubject(e.target.value as never)}>
                <option value="math">Математика</option>
                <option value="informatics">Информатика</option>
                {source === "llm" && <option value="mixed">Смешанный</option>}
              </select>
            </Field>
            <Field label="Класс">
              <select className="select" value={grade} onChange={(e) => setGrade(Number(e.target.value))}>
                {[5, 6, 7, 8, 9, 10, 11].map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </Field>
            {source === "llm" && (
              <Field label="Сложность">
                <select className="select" value={difficulty} onChange={(e) => setDifficulty(e.target.value as never)}>
                  <option value="easy">Базовая</option>
                  <option value="medium">Стандарт</option>
                  <option value="hard">Повышенная</option>
                </select>
              </Field>
            )}
          </div>

          {source === "bank" && (
            <div style={{ marginTop: 16, padding: 14, background: "var(--surface-2)", borderRadius: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Фильтр банка</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <Field label="Экзамен">
                  <select className="select" value={bankExam} onChange={(e) => setBankExam(e.target.value as never)}>
                    {Object.entries(EXAM_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </Field>
                <Field label="Номер задания (опц.)" hint="например, 1-27 для ЕГЭ-инф">
                  <input
                    className="input"
                    inputMode="numeric"
                    placeholder="—"
                    value={bankZadanieN}
                    onChange={(e) => setBankZadanieN(e.target.value.replace(/\D/g, "").slice(0, 2))}
                  />
                </Field>
                <Field label="Источник (опц.)">
                  <select className="select" value={bankSource} onChange={(e) => setBankSource(e.target.value)}>
                    <option value="">Любой</option>
                    {bankStats &&
                      Object.entries(bankStats.by_source)
                        .sort((a, b) => b[1] - a[1])
                        .map(([k, v]) => (
                          <option key={k} value={k}>
                            {k} ({v})
                          </option>
                        ))}
                  </select>
                </Field>
              </div>
              <div style={{ marginTop: 10, fontSize: 12, color: "var(--fg-3)" }}>
                По выбранным {SUBJECT_LABEL[subject] ?? subject} + {EXAM_LABELS[bankExam]}:{" "}
                <strong>{bankMatchCount.toLocaleString("ru")}</strong> задач в банке
                {bankZadanieN && ` · задание №${bankZadanieN}`}
                {topic && ` · по теме «${topic}»`}
              </div>
            </div>
          )}
        </Section>

        {/* Шаблон */}
        <Section
          title={`3. Шаблон оформления${tpl ? ` (выбран: ${tpl.id} · ${tpl.taskCount} задач)` : ""}`}
        >
          {!templates && <div style={{ color: "var(--fg-3)" }}>Загрузка шаблонов…</div>}
          {templates && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTemplateId(t.id)}
                  style={{
                    border: `2px solid ${templateId === t.id ? "var(--primary)" : "var(--border)"}`,
                    background: templateId === t.id ? "var(--primary-soft)" : "var(--bg)",
                    borderRadius: 10,
                    padding: 8,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/templates/${t.id}.png`}
                    alt={t.id}
                    loading="lazy"
                    style={{ width: "100%", aspectRatio: "210/297", objectFit: "cover", borderRadius: 6, background: "#f5f5f7" }}
                  />
                  <div style={{ marginTop: 6, fontSize: 12, fontWeight: 600 }}>
                    {t.id} · {t.taskCount} задач
                  </div>
                  <div style={{ fontSize: 11, color: "var(--fg-3)", lineHeight: 1.25, marginTop: 2 }}>
                    {t.name}
                  </div>
                </button>
              ))}
            </div>
          )}
        </Section>

        <button
          onClick={generate}
          disabled={loading || !tpl || (source === "llm" && !topic.trim())}
          style={{
            marginTop: 24,
            width: "100%",
            background: "var(--accent)",
            color: "var(--accent-fg)",
            padding: "16px 22px",
            borderRadius: "var(--radius-btn)",
            fontWeight: 700,
            fontSize: 16,
            border: "none",
            cursor: loading ? "wait" : "pointer",
            opacity: loading || !tpl ? 0.6 : 1,
            boxShadow: "var(--shadow-sm)",
          }}
        >
          {loading
            ? source === "bank" ? "Выбираем задачи из банка…" : "GigaChat генерирует…"
            : `Сгенерировать «${tpl?.name ?? "лист"}» →`}
        </button>

        {source === "llm" && !topic.trim() && (
          <div style={{ marginTop: 8, fontSize: 13, color: "var(--fg-3)" }}>
            Для LLM-генерации нужна тема. Для банка — необязательно.
          </div>
        )}

        {err && (
          <div style={{ marginTop: 16, padding: 12, background: "#FEE2E2", color: "#991B1B", borderRadius: 8, fontSize: 14 }}>
            {err}
          </div>
        )}
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ background: "var(--bg)", borderRadius: "var(--radius-card)", border: "1px solid var(--border)", padding: 20, marginBottom: 16, boxShadow: "var(--shadow-sm)" }}>
      <h2 style={{ fontFamily: "var(--display)", fontSize: 16, fontWeight: 700, margin: 0, marginBottom: 14 }}>{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "var(--fg-2)" }}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 3 }}>{hint}</div>}
    </div>
  );
}

function SourceCard(props: { checked: boolean; onClick: () => void; title: string; desc: string; badge: string }) {
  return (
    <button
      onClick={props.onClick}
      style={{
        textAlign: "left",
        padding: 16,
        border: `2px solid ${props.checked ? "var(--primary)" : "var(--border)"}`,
        borderRadius: 12,
        background: props.checked ? "var(--primary-soft)" : "var(--bg)",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>{props.title}</div>
        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "var(--primary)", color: "var(--primary-fg)" }}>
          {props.badge}
        </span>
      </div>
      <div style={{ fontSize: 13, color: "var(--fg-2)", lineHeight: 1.4 }}>{props.desc}</div>
    </button>
  );
}
