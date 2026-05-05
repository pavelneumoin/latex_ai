"use client";

import { useState } from "react";
import Link from "next/link";

const TEMPLATES = [
  { id: "T1", title: "Движение по реке", count: 5, geometry: "1 столбец" },
  { id: "T2", title: "Совместная работа (трубы)", count: 10, geometry: "2 столбца" },
  { id: "T3", title: "Концентрация и сплавы", count: 5, geometry: "1 столбец" },
  { id: "T4", title: "Проценты и вклады", count: 5, geometry: "1 столбец" },
  { id: "T5", title: "Средняя скорость", count: 5, geometry: "1 столбец" },
];

export default function CreatePage() {
  const [template, setTemplate] = useState("T1");
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [keyJson, setKeyJson] = useState<unknown | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setErr(null);
    setPdfUrl(null);
    setKeyJson(null);
    try {
      const r = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template }),
      });
      if (!r.ok) {
        const t = await r.text();
        throw new Error(t || `HTTP ${r.status}`);
      }
      const data = await r.json();
      setPdfUrl(data.pdfUrl);
      setKeyJson(data.answerKey);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  const tpl = TEMPLATES.find((t) => t.id === template)!;

  return (
    <main style={{ minHeight: "100vh", background: "var(--surface)", color: "var(--fg)" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 32px",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg)",
        }}
      >
        <Link href="/" style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 30, height: 30, borderRadius: 8,
              background: "var(--primary)", color: "var(--primary-fg)",
              display: "grid", placeItems: "center",
              fontFamily: "var(--display)", fontWeight: 800, fontSize: 14,
            }}
          >РЛ</div>
          <span style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 16 }}>
            РабочийЛист·ai
          </span>
        </Link>
        <span style={{ fontSize: 13, color: "var(--fg-3)" }}>Создание листа</span>
      </header>

      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: 32,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 32,
        }}
      >
        {/* Form */}
        <section
          style={{
            background: "var(--bg)",
            borderRadius: "var(--radius-card)",
            border: "1px solid var(--border)",
            padding: 28,
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <h1 style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 700, margin: 0, marginBottom: 4 }}>
            Параметры листа
          </h1>
          <p style={{ color: "var(--fg-3)", fontSize: 14, marginTop: 0, marginBottom: 24 }}>
            На MVP — выбор из 5 готовых шаблонов по ЕГЭ профиль №10.
          </p>

          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--fg-2)",
              }}
            >
              Шаблон
            </label>
            <div style={{ display: "grid", gap: 10 }}>
              {TEMPLATES.map((t) => (
                <label
                  key={t.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: `1px solid ${template === t.id ? "var(--primary)" : "var(--border)"}`,
                    background: template === t.id ? "var(--primary-soft)" : "var(--bg)",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name="template"
                    value={t.id}
                    checked={template === t.id}
                    onChange={() => setTemplate(t.id)}
                    style={{ accentColor: "var(--primary)" }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      {t.id} · {t.title}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--fg-3)" }}>
                      {t.count} задач · {t.geometry}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div style={{ background: "var(--surface-2)", borderRadius: 10, padding: 14, fontSize: 13, color: "var(--fg-2)", marginBottom: 20 }}>
            <strong>Что внутри {tpl.id}:</strong> ЕГЭ профиль, задание №10, тема «{tpl.title}», класс 11, {tpl.count}{" "}
            задач из проверенного банка с верифицированными целыми ответами.
          </div>

          <button
            onClick={generate}
            disabled={loading}
            style={{
              width: "100%",
              background: "var(--accent)",
              color: "var(--accent-fg)",
              padding: "14px 20px",
              borderRadius: "var(--radius-btn)",
              fontWeight: 700,
              fontSize: 15,
              border: "none",
              cursor: loading ? "wait" : "pointer",
              boxShadow: "var(--shadow-sm)",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Готовим лист…" : "Сгенерировать рабочий лист →"}
          </button>

          {err && (
            <div style={{ marginTop: 16, color: "var(--error)", fontSize: 14 }}>
              Ошибка: {err}
            </div>
          )}
        </section>

        {/* Preview */}
        <section
          style={{
            background: "var(--bg)",
            borderRadius: "var(--radius-card)",
            border: "1px solid var(--border)",
            padding: 28,
            boxShadow: "var(--shadow-sm)",
            minHeight: 600,
          }}
        >
          <h2 style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 700, margin: 0, marginBottom: 16 }}>
            Предпросмотр
          </h2>
          {!pdfUrl && (
            <div
              style={{
                background: "var(--surface)",
                borderRadius: 10,
                border: "1px dashed var(--border-2)",
                padding: 64,
                textAlign: "center",
                color: "var(--fg-3)",
                fontSize: 14,
              }}
            >
              Выбери шаблон слева и нажми «Сгенерировать».<br />PDF появится здесь.
            </div>
          )}
          {pdfUrl && (
            <>
              <iframe
                src={pdfUrl}
                style={{
                  width: "100%",
                  height: 700,
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  background: "var(--surface)",
                }}
              />
              <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
                <a
                  href={pdfUrl}
                  download
                  style={{
                    background: "var(--primary)",
                    color: "var(--primary-fg)",
                    padding: "10px 16px",
                    borderRadius: "var(--radius-btn)",
                    textDecoration: "none",
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                >
                  Скачать PDF
                </a>
                <button
                  onClick={() => {
                    if (!keyJson) return;
                    const blob = new Blob([JSON.stringify(keyJson, null, 2)], {
                      type: "application/json",
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${template}.answer_key.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  style={{
                    background: "var(--bg)",
                    color: "var(--fg)",
                    padding: "10px 16px",
                    borderRadius: "var(--radius-btn)",
                    border: "1px solid var(--border-2)",
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  Скачать answer_key.json
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
