"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

type StatusColor = "primary" | "success" | "error" | "default";

interface WorksheetRow {
  id: string;
  title: string;
  topic: string | null;
  subject: string | null;
  grade: number | null;
  variant: string | null;
  status: string;
  isPublic: boolean;
  pdfPath: string | null;
  createdAt: Date;
}

function statusBadge(status: string): { text: string; color: StatusColor } {
  switch (status) {
    case "ready":      return { text: "Готов",          color: "success"  };
    case "generating": return { text: "Генерируется…",  color: "primary"  };
    case "failed":     return { text: "Ошибка",         color: "error"    };
    default:           return { text: "Черновик",       color: "default"  };
  }
}

function badgeStyle(color: StatusColor): React.CSSProperties {
  const map: Record<StatusColor, React.CSSProperties> = {
    primary: { background: "var(--primary-soft)",  color: "var(--primary)" },
    success: { background: "#D1FAE5",               color: "#065F46"        },
    error:   { background: "#FEE2E2",               color: "#991B1B"        },
    default: { background: "var(--surface-2)",      color: "var(--fg-2)"    },
  };
  return {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 500,
    ...map[color],
  };
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(d));
}

const SUBJECT_LABEL: Record<string, string> = {
  math: "Математика",
  informatics: "Информатика",
  mixed: "Смешанный",
};

export function WorksheetList({ initialWorksheets }: { initialWorksheets: WorksheetRow[] }) {
  const [worksheets, setWorksheets] = useState<WorksheetRow[]>(initialWorksheets);
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [deleting, setDeleting] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return worksheets.filter((w) => {
      if (subjectFilter !== "all" && w.subject !== subjectFilter) return false;
      if (gradeFilter !== "all" && String(w.grade) !== gradeFilter) return false;
      if (q && !w.title.toLowerCase().includes(q) && !(w.topic ?? "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [worksheets, search, subjectFilter, gradeFilter]);

  async function handleDelete(id: string, title: string) {
    if (!window.confirm(`Удалить «${title}»?\n\nЭто действие нельзя отменить.`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/worksheets/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error ?? "Ошибка при удалении");
        return;
      }
      setWorksheets((prev) => prev.filter((w) => w.id !== id));
    } catch {
      alert("Сетевая ошибка при удалении");
    } finally {
      setDeleting(null);
    }
  }

  const grades = Array.from(new Set(worksheets.map((w) => w.grade).filter(Boolean) as number[])).sort((a, b) => a - b);

  return (
    <>
      {/* ── Filters ── */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 20,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <input
          className="input"
          placeholder="🔍 Поиск по названию или теме…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: "1 1 220px", minWidth: 180 }}
        />

        <select
          className="select"
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          style={{ minWidth: 150 }}
        >
          <option value="all">Все предметы</option>
          <option value="math">Математика</option>
          <option value="informatics">Информатика</option>
          <option value="mixed">Смешанный</option>
        </select>

        <select
          className="select"
          value={gradeFilter}
          onChange={(e) => setGradeFilter(e.target.value)}
          style={{ minWidth: 120 }}
        >
          <option value="all">Все классы</option>
          {grades.map((g) => (
            <option key={g} value={String(g)}>{g} класс</option>
          ))}
        </select>

        {(search || subjectFilter !== "all" || gradeFilter !== "all") && (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => { setSearch(""); setSubjectFilter("all"); setGradeFilter("all"); }}
          >
            Сбросить
          </button>
        )}

        <span style={{ fontSize: 13, color: "var(--fg-3)", marginLeft: "auto" }}>
          {filtered.length} из {worksheets.length}
        </span>
      </div>

      {/* ── Empty state ── */}
      {worksheets.length === 0 && (
        <div
          className="card"
          style={{ padding: 64, textAlign: "center", color: "var(--fg-3)", fontSize: 15 }}
        >
          <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.5 }}>📄</div>
          <p style={{ marginBottom: 6, color: "var(--fg-2)" }}>У вас пока нет рабочих листов</p>
          <p style={{ marginBottom: 20, fontSize: 14 }}>Создайте свой первый лист за минуту.</p>
          <Link href="/create" className="btn btn-primary">Создать первый лист</Link>
        </div>
      )}

      {worksheets.length > 0 && filtered.length === 0 && (
        <div
          className="card"
          style={{ padding: 40, textAlign: "center", color: "var(--fg-3)", fontSize: 14 }}
        >
          Ничего не найдено по текущим фильтрам.
        </div>
      )}

      {/* ── Worksheet grid ── */}
      {filtered.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
            gap: 16,
          }}
        >
          {filtered.map((w) => {
            const b = statusBadge(w.status);
            const hasPdf = Boolean(w.pdfPath);
            const isDel = deleting === w.id;

            return (
              <div
                key={w.id}
                className="card"
                style={{
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  opacity: isDel ? 0.5 : 1,
                  transition: "opacity 0.2s",
                }}
              >
                {/* top badges row */}
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                  <span style={badgeStyle(b.color)}>{b.text}</span>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {w.subject && (
                      <span
                        style={{
                          ...badgeStyle("default"),
                          background: w.subject === "math" ? "#EDE9FE" : "#DBEAFE",
                          color: w.subject === "math" ? "#5B21B6" : "#1E40AF",
                        }}
                      >
                        {SUBJECT_LABEL[w.subject] ?? w.subject}
                      </span>
                    )}
                    {w.grade && (
                      <span style={{ ...badgeStyle("default"), background: "#F3F4F6" }}>
                        {w.grade} кл
                      </span>
                    )}
                    {w.isPublic && (
                      <span
                        style={{
                          ...badgeStyle("default"),
                          background: "var(--accent-soft)",
                          color: "#92400E",
                        }}
                      >
                        В маркете
                      </span>
                    )}
                  </div>
                </div>

                {/* Title + meta */}
                <div>
                  <div
                    style={{
                      fontFamily: "var(--display)",
                      fontWeight: 600,
                      fontSize: 15,
                      marginBottom: 4,
                      lineHeight: 1.3,
                    }}
                  >
                    {w.title}
                  </div>
                  <div className="muted" style={{ fontSize: 13, marginBottom: 4 }}>
                    {w.topic ?? "—"}
                  </div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {formatDate(w.createdAt)}
                    {w.variant && w.variant !== "A" ? ` · вариант ${w.variant}` : ""}
                  </div>
                </div>

                {/* Actions */}
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginTop: "auto",
                    paddingTop: 6,
                    flexWrap: "wrap",
                  }}
                >
                  <Link
                    href={`/my/${w.id}`}
                    className="btn btn-outline btn-sm"
                    style={{ flex: "1 1 auto" }}
                  >
                    Открыть
                  </Link>

                  {hasPdf ? (
                    <a
                      href={w.pdfPath ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-blue btn-sm"
                    >
                      PDF
                    </a>
                  ) : (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "6px 12px",
                        minHeight: 32,
                        borderRadius: 10,
                        fontSize: 13,
                        fontWeight: 600,
                        background: "var(--surface-2)",
                        color: "var(--fg-3)",
                        cursor: "not-allowed",
                      }}
                    >
                      PDF
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDelete(w.id, w.title)}
                    disabled={isDel}
                    title="Удалить лист"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      border: "1px solid var(--border-2)",
                      background: isDel ? "var(--surface-2)" : "transparent",
                      color: "#EF4444",
                      cursor: isDel ? "wait" : "pointer",
                      fontSize: 15,
                    }}
                  >
                    {isDel ? "…" : "✕"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
