"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { IconPlus, IconUsers } from "@/app/_components/Icons";

interface ClassRow {
  id: string;
  name: string;
  subject: string;
  gradeLevel: number | null;
  students: number;
  checks: number;
}

export function ClassesClient({ initial }: { initial: ClassRow[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(initial.length === 0);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState<"math" | "informatics">("math");
  const [gradeLevel, setGradeLevel] = useState<string>("");
  const [studentsRaw, setStudentsRaw] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createClass() {
    if (!name.trim()) {
      setError("Укажите название класса, например «7А».");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const students = studentsRaw
        .split(/\r?\n/)
        .map((s) => s.replace(/^\s*\d+[.)]\s*/, "").trim()) // срезаем нумерацию из журнала
        .filter(Boolean);
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          subject,
          gradeLevel: gradeLevel ? Number(gradeLevel) : undefined,
          students: students.length ? students : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? `HTTP ${res.status}`);
      }
      setName("");
      setStudentsRaw("");
      setShowForm(false);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 900 }}>
      <div className="rl-row-between">
        <div>
          <h1 style={{ fontSize: "clamp(22px, 4vw, 30px)" }}>Классы</h1>
          <p className="muted-2" style={{ marginTop: 4, fontSize: 14.5 }}>
            Списки учеников для проверок и статистики. Пороги отметок настраиваются на класс.
          </p>
        </div>
        {!showForm && (
          <button type="button" className="btn btn-primary" onClick={() => setShowForm(true)}>
            <IconPlus size={16} /> Добавить класс
          </button>
        )}
      </div>

      {showForm && (
        <div className="card" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
          <h3>Новый класс</h3>
          <div className="rl-grid rl-grid-3">
            <div>
              <label className="label">Название</label>
              <input
                className="rl-input"
                placeholder="7А"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={40}
              />
            </div>
            <div>
              <label className="label">Предмет</label>
              <select
                className="rl-input"
                value={subject}
                onChange={(e) => setSubject(e.target.value as "math" | "informatics")}
              >
                <option value="math">Математика</option>
                <option value="informatics">Информатика</option>
              </select>
            </div>
            <div>
              <label className="label">Параллель</label>
              <select className="rl-input" value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)}>
                <option value="">—</option>
                {[5, 6, 7, 8, 9, 10, 11].map((g) => (
                  <option key={g} value={g}>
                    {g} класс
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">
              Ученики — по одному в строке (можно вставить прямо из журнала, нумерация срежется)
            </label>
            <textarea
              className="rl-input"
              rows={6}
              placeholder={"1. Иванов Иван\n2. Петрова Мария\n3. Сидоров Алексей"}
              value={studentsRaw}
              onChange={(e) => setStudentsRaw(e.target.value)}
            />
          </div>
          {error && (
            <div style={{ color: "var(--error)", fontSize: 13.5 }}>{error}</div>
          )}
          <div className="rl-row">
            <button type="button" className="btn btn-primary" disabled={busy} onClick={createClass}>
              {busy ? "Создаём…" : "Создать класс"}
            </button>
            {initial.length > 0 && (
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
                Отмена
              </button>
            )}
          </div>
        </div>
      )}

      {initial.length === 0 && !showForm ? null : initial.length === 0 ? null : (
        <div className="rl-grid rl-grid-2">
          {initial.map((c) => (
            <Link
              key={c.id}
              href={`/cabinet/classes/${c.id}`}
              className="card card-hover rl2-card-subject"
              data-subject={c.subject}
              style={{ padding: 18, textDecoration: "none", display: "flex", flexDirection: "column", gap: 8 }}
            >
              <div className="rl-row-between">
                <span style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: 22 }}>{c.name}</span>
                <span className="rl2-subject" data-subject={c.subject}>
                  <i className="rl2-subject-dot" />
                  {c.subject === "informatics" ? "Информатика" : "Математика"}
                </span>
              </div>
              <div className="rl-row" style={{ gap: 14, color: "var(--fg-2)", fontSize: 13.5 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <IconUsers size={15} /> {c.students} уч.
                </span>
                <span>{c.checks} проверок</span>
                {c.gradeLevel ? <span>{c.gradeLevel} класс</span> : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
