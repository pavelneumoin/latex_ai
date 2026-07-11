"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { IconTrash, IconPlus, IconUsers } from "@/app/_components/Icons";

interface Cls {
  id: string;
  name: string;
  subject: string;
  gradeLevel: number | null;
  scale5: number;
  scale4: number;
  scale3: number;
}
interface StudentRow {
  id: string;
  name: string;
}
interface CheckRow {
  id: string;
  title: string;
  status: string;
  results: number;
  createdAt: string;
}
interface TrendPoint {
  title: string;
  avgPct: number;
  date: Date | string;
}

export function ClassDetailClient({
  cls,
  students,
  checks,
  trend,
}: {
  cls: Cls;
  students: StudentRow[];
  checks: CheckRow[];
  trend: TrendPoint[];
}) {
  const router = useRouter();
  const [addRaw, setAddRaw] = useState("");
  const [busy, setBusy] = useState(false);
  const [scale, setScale] = useState({ s5: cls.scale5, s4: cls.scale4, s3: cls.scale3 });
  const [scaleSaved, setScaleSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function api(input: RequestInfo, init?: RequestInit) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(input, {
        headers: { "Content-Type": "application/json" },
        ...init,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? `HTTP ${res.status}`);
      }
      router.refresh();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function addStudents() {
    const names = addRaw
      .split(/\r?\n/)
      .map((s) => s.replace(/^\s*\d+[.)]\s*/, "").trim())
      .filter(Boolean);
    if (names.length === 0) return;
    const ok = await api(`/api/classes/${cls.id}/students`, {
      method: "POST",
      body: JSON.stringify({ mode: "add", names }),
    });
    if (ok) setAddRaw("");
  }

  async function removeStudent(studentId: string) {
    await api(`/api/classes/${cls.id}/students`, {
      method: "DELETE",
      body: JSON.stringify({ studentId }),
    });
  }

  async function saveScale() {
    const ok = await api(`/api/classes/${cls.id}`, {
      method: "PATCH",
      body: JSON.stringify({ scale5: scale.s5, scale4: scale.s4, scale3: scale.s3 }),
    });
    if (ok) {
      setScaleSaved(true);
      setTimeout(() => setScaleSaved(false), 2000);
    }
  }

  async function deleteClass() {
    if (!confirm(`Удалить класс ${cls.name} вместе со списком учеников?`)) return;
    const ok = await api(`/api/classes/${cls.id}`, { method: "DELETE" });
    if (ok) router.push("/cabinet/classes");
  }

  const maxTrend = Math.max(...trend.map((t) => t.avgPct), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 980 }}>
      <div className="rl-row-between">
        <div>
          <div className="rl-row" style={{ gap: 10 }}>
            <h1 style={{ fontSize: "clamp(22px, 4vw, 30px)" }}>{cls.name}</h1>
            <span className="rl2-subject" data-subject={cls.subject}>
              <i className="rl2-subject-dot" />
              {cls.subject === "informatics" ? "Информатика" : "Математика"}
            </span>
          </div>
          <p className="muted-2" style={{ marginTop: 4, fontSize: 14.5 }}>
            {students.length} учеников{cls.gradeLevel ? ` · ${cls.gradeLevel} класс` : ""}
          </p>
        </div>
        <div className="rl-row">
          <Link href={`/cabinet/checks/new?classId=${cls.id}`} className="btn btn-primary">
            Проверить работу
          </Link>
          <button type="button" className="btn btn-ghost" onClick={deleteClass} title="Удалить класс">
            <IconTrash size={16} />
          </button>
        </div>
      </div>

      {error && <div style={{ color: "var(--error)", fontSize: 13.5 }}>{error}</div>}

      <div className="rl-grid rl-grid-2" style={{ alignItems: "start" }}>
        {/* Ученики */}
        <div className="card" style={{ padding: 18 }}>
          <h3 style={{ marginBottom: 12 }}>Ученики</h3>
          {students.length === 0 ? (
            <div className="rl2-empty rl2-gridpaper" style={{ marginBottom: 12 }}>
              <div style={{ color: "var(--fg-3)", marginBottom: 8 }}>
                <IconUsers size={30} />
              </div>
              Вставьте список из журнала ниже.
            </div>
          ) : (
            <ol style={{ margin: "0 0 14px", paddingLeft: 22, display: "flex", flexDirection: "column", gap: 4 }}>
              {students.map((s) => (
                <li key={s.id} style={{ fontSize: 14 }}>
                  <span className="rl-row-between" style={{ gap: 6 }}>
                    <span>{s.name}</span>
                    <button
                      type="button"
                      onClick={() => removeStudent(s.id)}
                      disabled={busy}
                      style={{
                        border: "none",
                        background: "transparent",
                        color: "var(--fg-3)",
                        cursor: "pointer",
                        padding: 2,
                      }}
                      aria-label={`Убрать ${s.name}`}
                    >
                      ✕
                    </button>
                  </span>
                </li>
              ))}
            </ol>
          )}
          <label className="label">Добавить учеников (по одному в строке)</label>
          <textarea
            className="rl-input"
            rows={3}
            placeholder={"Иванов Иван\nПетрова Мария"}
            value={addRaw}
            onChange={(e) => setAddRaw(e.target.value)}
          />
          <div style={{ marginTop: 8 }}>
            <button type="button" className="btn btn-sm btn-outline" disabled={busy || !addRaw.trim()} onClick={addStudents}>
              <IconPlus size={14} /> Добавить
            </button>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Пороги отметок */}
          <div className="card" style={{ padding: 18 }}>
            <h3 style={{ marginBottom: 4 }}>Шкала отметок</h3>
            <p className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
              Проценты выполнения, с которых ставится отметка.
            </p>
            <div className="rl-grid rl-grid-3">
              {(
                [
                  ["s5", "«5» от, %"],
                  ["s4", "«4» от, %"],
                  ["s3", "«3» от, %"],
                ] as const
              ).map(([k, label]) => (
                <div key={k}>
                  <label className="label">{label}</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    className="rl-input"
                    value={scale[k]}
                    onChange={(e) => setScale({ ...scale, [k]: Number(e.target.value) })}
                  />
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10 }} className="rl-row">
              <button type="button" className="btn btn-sm btn-blue" disabled={busy} onClick={saveScale}>
                Сохранить шкалу
              </button>
              {scaleSaved && <span style={{ color: "var(--success)", fontSize: 13 }}>Сохранено ✓</span>}
            </div>
          </div>

          {/* Динамика */}
          <div className="card" style={{ padding: 18 }}>
            <h3 style={{ marginBottom: 4 }}>Динамика класса</h3>
            {trend.length === 0 ? (
              <p className="muted" style={{ fontSize: 13 }}>
                Появится после первых завершённых проверок. Подробная аналитика — в
                LaTeX-отчётах, чтобы не перегружать кабинет.
              </p>
            ) : (
              <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 90, marginTop: 10 }}>
                {trend.map((t, i) => (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }} title={`${t.title}: ${t.avgPct}%`}>
                    <span style={{ fontSize: 10.5, color: "var(--fg-3)" }}>{t.avgPct}%</span>
                    <div
                      style={{
                        width: "70%",
                        height: `${Math.max((t.avgPct / maxTrend) * 62, 4)}px`,
                        background: "var(--primary)",
                        opacity: 0.75,
                        borderRadius: "5px 5px 2px 2px",
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Проверки класса */}
      <div className="card" style={{ padding: 18 }}>
        <div className="rl-row-between" style={{ marginBottom: 12 }}>
          <h3>Проверки класса</h3>
          <Link href={`/cabinet/checks/new?classId=${cls.id}`} className="btn btn-sm btn-outline">
            + Новая
          </Link>
        </div>
        {checks.length === 0 ? (
          <p className="muted" style={{ fontSize: 13.5 }}>
            Пока не было. Создайте проверку — выберите материал, загрузите работы, получите отметки.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {checks.map((c) => (
              <Link
                key={c.id}
                href={`/cabinet/checks/${c.id}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  textDecoration: "none",
                  fontSize: 14,
                }}
              >
                <span style={{ fontWeight: 600 }}>{c.title}</span>
                <span className="muted" style={{ fontSize: 12.5 }}>
                  {new Date(c.createdAt).toLocaleDateString("ru-RU")}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
