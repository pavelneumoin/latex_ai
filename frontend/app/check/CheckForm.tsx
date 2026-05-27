"use client";

import { FormEvent, useState } from "react";

type Worksheet = { id: string; title: string };
type CheckResultField = {
  n: number;
  recognized: string | null;
  expected: string;
  correct: boolean;
  confidence?: number;
};
type CheckResult = {
  student_name?: string | null;
  fields?: CheckResultField[];
  total_correct?: number;
  total?: number;
  percent?: number;
  grade_5point?: number | null;
};

export function CheckForm({ worksheets }: { worksheets: Worksheet[] }) {
  const [worksheetId, setWorksheetId] = useState<string>(worksheets[0]?.id ?? "");
  const [studentName, setStudentName] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<CheckResult | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file || !worksheetId) return;
    setLoading(true);
    setErr(null);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("worksheetId", worksheetId);
      fd.append("studentName", studentName);
      fd.append("file", file);
      const r = await fetch("/api/check", { method: "POST", body: fd });
      const data = await r.json();
      if (!r.ok) {
        setErr(data.detail || data.error || "Не удалось проверить");
        return;
      }
      setResult(data.result || { fields: [] });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <form onSubmit={onSubmit} className="card" style={{ padding: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label className="label" htmlFor="ws">Какой лист проверяем</label>
            <select
              id="ws"
              className="select"
              value={worksheetId}
              onChange={(e) => setWorksheetId(e.target.value)}
              required
            >
              {worksheets.map((w) => (
                <option key={w.id} value={w.id}>{w.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="name">Имя ученика (необязательно)</label>
            <input
              id="name"
              type="text"
              className="input"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Иванов Иван"
              maxLength={120}
            />
          </div>
          <div>
            <label className="label" htmlFor="file">Фото или скан заполненного листа</label>
            <input
              id="file"
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              required
            />
            <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
              JPG/PNG/WEBP/PDF, до 10 МБ.
            </div>
          </div>

          {err && (
            <div style={{ padding: "10px 12px", background: "#FEE2E2", color: "#991B1B", borderRadius: 8, fontSize: 13 }}>
              {err}
            </div>
          )}

          <button type="submit" className="btn btn-blue btn-lg" disabled={loading || !file}>
            {loading ? "Проверяем..." : "Проверить работу"}
          </button>
        </div>
      </form>

      {result && <CheckResultView result={result} />}
    </div>
  );
}

function CheckResultView({ result }: { result: CheckResult }) {
  const percent = result.percent ?? 0;
  const grade = result.grade_5point;
  const fields = result.fields ?? [];
  const total = result.total ?? fields.length;
  const correct = result.total_correct ?? fields.filter((f) => f.correct).length;

  return (
    <div className="card" style={{ padding: 24 }}>
      <h2 style={{ marginBottom: 12 }}>Результат проверки</h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        <StatBox label="Правильно" value={`${correct} / ${total}`} />
        <StatBox label="Процент" value={`${percent}%`} />
        <StatBox label="Оценка" value={grade ? `${grade}` : "—"} accent={grade ? gradeColor(grade) : "var(--fg-3)"} />
      </div>

      {fields.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {fields.map((f) => (
            <div
              key={f.n}
              style={{
                display: "grid",
                gridTemplateColumns: "32px 1fr 80px 80px 24px",
                alignItems: "center",
                gap: 12,
                padding: "8px 10px",
                background: f.correct ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.06)",
                borderRadius: 8,
                fontSize: 14,
              }}
            >
              <div style={{ fontWeight: 600, color: "var(--fg-3)" }}>№{f.n}</div>
              <div style={{ color: "var(--fg-3)", fontSize: 12 }}>Ожидалось: {f.expected || "—"}</div>
              <div style={{ fontFamily: "monospace" }}>{f.recognized ?? "—"}</div>
              <div style={{ fontSize: 12, color: "var(--fg-3)" }}>
                {f.confidence !== undefined ? `${Math.round(f.confidence * 100)}%` : ""}
              </div>
              <div style={{ fontSize: 18 }}>{f.correct ? "✓" : "✗"}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ padding: 16, background: "var(--surface)", borderRadius: 12, textAlign: "center" }}>
      <div style={{ fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: accent ?? "var(--fg)" }}>{value}</div>
    </div>
  );
}

function gradeColor(grade: number): string {
  if (grade >= 5) return "#10B981";
  if (grade >= 4) return "#0EA5E9";
  if (grade >= 3) return "#F59E0B";
  return "#EF4444";
}
