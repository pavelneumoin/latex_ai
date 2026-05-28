"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Template {
  id: string;
  name: string;
  taskCount: number;
  subject: string;
}

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [templates, setTemplates] = useState<Template[] | null>(null);
  const [templateId, setTemplateId] = useState("T1");
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState<"math" | "informatics">("math");
  const [grade, setGrade] = useState(11);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json())
      .then((d) => setTemplates(d.templates ?? []))
      .catch(() => {});
  }, []);

  async function submit() {
    if (!file) {
      setErr("Выбери PDF-файл");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("templateId", templateId);
      if (topic.trim()) fd.set("topic", topic.trim());
      fd.set("subject", subject);
      fd.set("grade", String(grade));

      const r = await fetch("/api/worksheets/from-pdf", { method: "POST", body: fd });
      if (r.status === 401) { router.push("/login?next=/upload"); return; }
      const data = await r.json();
      if (!r.ok) {
        throw new Error(data?.hint || data?.detail || data?.error || `HTTP ${r.status}`);
      }
      router.push(`/my/${data.worksheet.id}`);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
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
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--primary)", color: "var(--primary-fg)", display: "grid", placeItems: "center", fontWeight: 800 }}>РЛ</div>
          <span style={{ fontWeight: 700 }}>РабочийЛист·ai</span>
        </Link>
        <span style={{ fontSize: 13, color: "var(--fg-3)" }}>Загрузка PDF</span>
      </header>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: 24 }}>
        <h1 style={{ fontSize: 28, margin: "8px 0 6px" }}>Загрузить готовый PDF</h1>
        <p style={{ color: "var(--fg-3)", marginTop: 0, marginBottom: 24, lineHeight: 1.5 }}>
          Прислал готовый PDF с задачами (например, скачал с ФИПИ или сделал в Word) — мы распознаем условия
          через нейросеть и пересоберём в наш формат: с автоматической проверкой, разными шаблонами и экспортом.
        </p>

        <Section title="1. Файл">
          <label
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: 28,
              border: file ? "2px solid var(--primary)" : "2px dashed var(--border-2)",
              borderRadius: 12,
              cursor: "pointer",
              background: file ? "var(--primary-soft)" : "var(--surface-2)",
              gap: 8,
            }}
          >
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              style={{ display: "none" }}
            />
            {file ? (
              <>
                <div style={{ fontWeight: 700, fontSize: 14 }}>📄 {file.name}</div>
                <div style={{ fontSize: 12, color: "var(--fg-3)" }}>
                  {(file.size / 1024).toFixed(0)} КБ · {file.type}
                </div>
                <div style={{ fontSize: 11, color: "var(--primary)" }}>Кликни ещё, чтобы выбрать другой</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 18 }}>⬆️</div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Выбери PDF (до 10 МБ)</div>
                <div style={{ fontSize: 12, color: "var(--fg-3)" }}>
                  Работает с PDF, в котором есть текст. Сканы — пока не поддерживаются.
                </div>
              </>
            )}
          </label>
        </Section>

        <Section title="2. Контекст для нейросети">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <Field label="Тема (опц.)">
              <input
                className="input"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="«Линейные уравнения»"
              />
            </Field>
            <Field label="Предмет">
              <select className="select" value={subject} onChange={(e) => setSubject(e.target.value as never)}>
                <option value="math">Математика</option>
                <option value="informatics">Информатика</option>
              </select>
            </Field>
            <Field label="Класс">
              <select className="select" value={grade} onChange={(e) => setGrade(Number(e.target.value))}>
                {[5,6,7,8,9,10,11].map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </Field>
          </div>
        </Section>

        <Section title="3. Шаблон оформления">
          {!templates && <div style={{ color: "var(--fg-3)" }}>Загрузка…</div>}
          {templates && (
            <select className="select" value={templateId} onChange={(e) => setTemplateId(e.target.value)} style={{ width: "100%" }}>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.id} · {t.name} ({t.taskCount} задач)</option>
              ))}
            </select>
          )}
          <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 6 }}>
            После создания листа можно поменять шаблон — открой <Link href="/templates" style={{ color: "var(--primary)" }}>галерею</Link>.
          </div>
        </Section>

        <button
          onClick={submit}
          disabled={busy || !file}
          style={{
            marginTop: 24, width: "100%", padding: "16px 22px",
            background: "var(--accent)", color: "var(--accent-fg)",
            border: "none", borderRadius: 12, fontWeight: 700, fontSize: 16,
            cursor: busy ? "wait" : "pointer", opacity: busy || !file ? 0.6 : 1,
            boxShadow: "var(--shadow-sm)",
          }}
        >
          {busy ? "Распознаём задачи в PDF…" : "Превратить PDF в рабочий лист →"}
        </button>

        {err && (
          <div style={{ marginTop: 16, padding: 12, background: "#FEE2E2", color: "#991B1B", borderRadius: 8, fontSize: 14 }}>
            {err}
          </div>
        )}

        <div style={{ marginTop: 28, padding: 14, background: "var(--bg)", borderRadius: 10, fontSize: 13, color: "var(--fg-2)" }}>
          <strong>Как это работает:</strong> мы извлекаем текст из PDF (через pdf-parse), отправляем GigaChat-Max
          с инструкцией «выдели задачи в JSON-формате» — затем создаём обычный лист, который можно править,
          экспортировать, проверять автоматически.
          <br /><br />
          <strong>Если PDF — это скан:</strong> сейчас не сработает (нужен vision-чекер, в разработке).
          Попробуй загрузить тот же PDF, но из Word/LaTeX/Adobe.
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ background: "var(--bg)", borderRadius: 12, border: "1px solid var(--border)", padding: 20, marginBottom: 16 }}>
      <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, marginBottom: 14 }}>{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "var(--fg-2)" }}>{label}</label>
      {children}
    </div>
  );
}
