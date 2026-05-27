"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface Task {
  n: number;
  condition: string;
  expected_answer?: string;
  answer_type?: string;
  solution?: string;
}

interface Worksheet {
  id: string;
  title: string;
  contentJson?: { tasks?: Task[]; title?: string; subtitle?: string };
}

interface CheckResult {
  studentName: string | null;
  results: Array<{
    n: number;
    expected: string;
    got: string;
    correct: boolean;
    normalized_expected?: string;
    normalized_got?: string;
    reason?: string;
  }>;
  percent: number;
  mark: number;
  score: { correct: number; total: number };
}

function CheckTextInner() {
  const sp = useSearchParams();
  const initialId = sp.get("worksheetId") ?? "";
  const [worksheetId, setWorksheetId] = useState(initialId);
  const [studentName, setStudentName] = useState("");
  const [ws, setWs] = useState<Worksheet | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<CheckResult | null>(null);

  useEffect(() => {
    if (!worksheetId) {
      setWs(null);
      return;
    }
    setLoading(true);
    setErr(null);
    fetch(`/api/worksheets/${worksheetId}`)
      .then(async (r) => {
        if (r.status === 401) throw new Error("Войди в аккаунт, чтобы открыть лист");
        if (r.status === 404) throw new Error("Лист не найден");
        return r.json();
      })
      .then((d) => setWs(d.worksheet ?? d))
      .catch((e) => setErr((e as Error).message))
      .finally(() => setLoading(false));
  }, [worksheetId]);

  async function submit() {
    setLoading(true);
    setErr(null);
    setResult(null);
    try {
      const r = await fetch("/api/check-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ worksheetId, studentName: studentName || undefined, answers }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);
      setResult(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const tasks = ws?.contentJson?.tasks ?? [];
  return (
    <main style={{ minHeight: "100vh", background: "var(--surface)", color: "var(--fg)" }}>
      <header
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 32px", borderBottom: "1px solid var(--border)", background: "var(--bg)",
        }}
      >
        <Link href="/" style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--primary)", color: "var(--primary-fg)", display: "grid", placeItems: "center", fontWeight: 800 }}>РЛ</div>
          <span style={{ fontWeight: 700 }}>РабочийЛист·ai</span>
        </Link>
        <span style={{ fontSize: 13, color: "var(--fg-3)" }}>Проверка ответов</span>
      </header>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: 24 }}>
        <h1 style={{ fontSize: 26, margin: "8px 0 4px" }}>Проверка ответов</h1>
        <p style={{ color: "var(--fg-3)", marginTop: 0 }}>
          Введи ответы ученика в поля под каждой задачей и получи оценку.
          Нужен лист, сгенерированный в системе.
        </p>

        <section style={{ background: "var(--bg)", borderRadius: 12, border: "1px solid var(--border)", padding: 18, marginBottom: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600 }}>ID листа</label>
              <input
                className="input"
                value={worksheetId}
                onChange={(e) => setWorksheetId(e.target.value.trim())}
                placeholder="cmpog..."
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600 }}>Имя ученика (опц.)</label>
              <input
                className="input"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Иванов И."
              />
            </div>
          </div>
        </section>

        {err && (
          <div style={{ padding: 12, background: "#FEE2E2", color: "#991B1B", borderRadius: 8, marginBottom: 16 }}>
            {err}
          </div>
        )}

        {result && (
          <section style={{
            background: result.mark >= 4 ? "#ECFDF5" : result.mark === 3 ? "#FFFBEB" : "#FEE2E2",
            border: `1px solid ${result.mark >= 4 ? "#10B981" : result.mark === 3 ? "#F59E0B" : "#EF4444"}`,
            borderRadius: 14, padding: 18, marginBottom: 18,
          }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap" }}>
              <div style={{ fontSize: 40, fontWeight: 800 }}>{result.mark}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14 }}>
                  {result.studentName ? `Ученик: ${result.studentName} · ` : ""}
                  <strong>{result.score.correct}</strong> из <strong>{result.score.total}</strong> верно
                  &nbsp;·&nbsp; <strong>{result.percent}%</strong>
                </div>
                <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 2 }}>
                  Шкала: ≥86 → 5, 70–85 → 4, 50–69 → 3, &lt;50 → 2
                </div>
              </div>
            </div>
          </section>
        )}

        {loading && !ws && <div style={{ color: "var(--fg-3)" }}>Загрузка листа…</div>}

        {ws && tasks.length > 0 && (
          <section style={{ background: "var(--bg)", borderRadius: 12, border: "1px solid var(--border)", padding: 18 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>{ws.contentJson?.title ?? ws.title}</div>
            {ws.contentJson?.subtitle && (
              <div style={{ fontSize: 13, color: "var(--fg-3)", marginBottom: 12 }}>{ws.contentJson.subtitle}</div>
            )}
            <ol style={{ paddingLeft: 22, display: "grid", gap: 14 }}>
              {tasks.map((t) => {
                const r = result?.results.find((x) => x.n === t.n);
                return (
                  <li key={t.n}>
                    <div style={{ fontSize: 14, lineHeight: 1.5 }}>{t.condition}</div>
                    <div style={{ marginTop: 6, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <input
                        className="input"
                        style={{ width: 200 }}
                        value={answers[String(t.n)] ?? ""}
                        onChange={(e) => setAnswers((a) => ({ ...a, [String(t.n)]: e.target.value }))}
                        placeholder="ответ ученика"
                        disabled={!!result}
                      />
                      {r && (
                        <span style={{
                          padding: "3px 8px", borderRadius: 6, fontSize: 12, fontWeight: 700,
                          background: r.correct ? "#10B981" : "#EF4444", color: "#fff",
                        }}>
                          {r.correct ? "✓ верно" : "✗ ошибка"}
                        </span>
                      )}
                      {r && !r.correct && (
                        <span style={{ fontSize: 12, color: "var(--fg-3)" }}>
                          правильно: <strong>{r.expected}</strong>
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>

            {!result && (
              <button
                onClick={submit}
                disabled={loading}
                style={{
                  marginTop: 16, width: "100%", padding: "12px 18px",
                  background: "var(--accent)", color: "var(--accent-fg)",
                  border: "none", borderRadius: 10, fontWeight: 700, fontSize: 15,
                  cursor: loading ? "wait" : "pointer", opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? "Проверяю…" : "Проверить ответы"}
              </button>
            )}
            {result && (
              <button
                onClick={() => {
                  setResult(null);
                  setAnswers({});
                }}
                style={{
                  marginTop: 16, padding: "8px 16px",
                  background: "var(--bg)", color: "var(--fg)",
                  border: "1px solid var(--border-2)", borderRadius: 8, fontSize: 14, cursor: "pointer",
                }}
              >
                Проверить заново
              </button>
            )}
          </section>
        )}

        {ws && tasks.length === 0 && (
          <div style={{ color: "var(--fg-3)" }}>В этом листе нет задач.</div>
        )}
      </div>
    </main>
  );
}

export default function CheckTextPage() {
  return (
    <Suspense fallback={<div style={{ padding: 32 }}>Загрузка…</div>}>
      <CheckTextInner />
    </Suspense>
  );
}
