"use client";

// Шаг 2 проверки: загрузка работ → (авто)разметка баллов → отметки → отчёт.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { IconUpload, IconDoc } from "@/app/_components/Icons";

interface JobInfo {
  id: string;
  title: string;
  status: string;
  totalTasks: number | null;
  maxScore: number | null;
  className: string | null;
  productTitle: string | null;
  productCheckable: boolean;
}
interface ResultRow {
  id: string;
  studentName: string;
  score: number;
  maxScore: number;
  pct: number;
  mark: number | null;
  absent: boolean;
  needsReview: boolean;
}
interface UploadRow {
  id: string;
  filename: string;
  size: number;
}
interface ReportRow {
  id: string;
  title: string;
  hasPdf: boolean;
  createdAt: string;
}

function computeMark(pct: number, s: { s5: number; s4: number; s3: number }): number {
  if (pct >= s.s5) return 5;
  if (pct >= s.s4) return 4;
  if (pct >= s.s3) return 3;
  return 2;
}

export function CheckDetailClient({
  job,
  scale,
  initialResults,
  uploads,
  reports,
}: {
  job: JobInfo;
  scale: { s5: number; s4: number; s3: number };
  initialResults: ResultRow[];
  uploads: UploadRow[];
  reports: ReportRow[];
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ResultRow[]>(initialResults);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const defaultMax = job.maxScore ?? rows[0]?.maxScore ?? 0;

  const stats = useMemo(() => {
    const present = rows.filter((r) => !r.absent);
    const withScores = present.filter((r) => !r.needsReview);
    const avg =
      withScores.length > 0
        ? withScores.reduce((s, r) => s + r.pct, 0) / withScores.length
        : 0;
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0 } as Record<number, number>;
    for (const r of withScores) {
      const m = r.mark ?? computeMark(r.pct, scale);
      dist[m as 5 | 4 | 3 | 2] = (dist[m as 5 | 4 | 3 | 2] ?? 0) + 1;
    }
    return { avg: Math.round(avg * 10) / 10, dist, checked: withScores.length, total: rows.length };
  }, [rows, scale]);

  function setScore(id: string, raw: string) {
    setDirty(true);
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const score = Math.max(0, Math.min(Number(raw) || 0, r.maxScore || 999));
        const pct = r.maxScore > 0 ? Math.round((score / r.maxScore) * 1000) / 10 : 0;
        return { ...r, score, pct, mark: computeMark(pct, scale), needsReview: false, absent: false };
      })
    );
  }

  function toggleAbsent(id: string) {
    setDirty(true);
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, absent: !r.absent, needsReview: false } : r))
    );
  }

  function addRow() {
    const name = newName.trim();
    if (!name) return;
    setDirty(true);
    setRows((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        studentName: name,
        score: 0,
        maxScore: defaultMax,
        pct: 0,
        mark: null,
        absent: false,
        needsReview: true,
      },
    ]);
    setNewName("");
  }

  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy("upload");
    setError(null);
    try {
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append("files", f));
      const res = await fetch(`/api/checks/${job.id}/upload`, { method: "POST", body: fd });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
      setNotice(`Загружено файлов: ${data.uploads.length}`);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function runAuto() {
    setBusy("run");
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/checks/${job.id}/run`, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
      if (data.mode === "manual") {
        setNotice(data.message);
      } else {
        setNotice(`Нейросеть обработала работ: ${data.processed}${data.failed ? `, с ошибкой: ${data.failed}` : ""}.`);
        router.refresh();
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function save(markDone = false) {
    setBusy(markDone ? "done" : "save");
    setError(null);
    try {
      const res = await fetch(`/api/checks/${job.id}/results`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          markDone,
          results: rows.map((r) => ({
            ...(r.id.startsWith("new-") ? {} : { id: r.id }),
            studentName: r.studentName,
            score: r.score,
            maxScore: r.maxScore,
            absent: r.absent,
            needsReview: r.needsReview,
          })),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
      setDirty(false);
      setNotice(markDone ? "Проверка завершена ✓" : "Сохранено ✓");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function makeReport() {
    setBusy("report");
    setError(null);
    try {
      if (dirty) await save(false);
      const res = await fetch(`/api/checks/${job.id}/report`, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
      setNotice(
        data.report.hasPdf
          ? "Отчёт готов — PDF собран. Смотрите ниже или в разделе «Отчёты»."
          : "Отчёт готов (.tex). PDF соберётся при настроенном LaTeX; исходник можно скачать."
      );
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 1000 }}>
      <div>
        <Link href="/cabinet/checks" style={{ fontSize: 13, color: "var(--primary)", textDecoration: "none" }}>
          ← Все проверки
        </Link>
        <h1 style={{ fontSize: "clamp(20px, 3.6vw, 28px)", marginTop: 6 }}>
          {job.className ? `${job.className} · ` : ""}
          {job.title}
        </h1>
        <p className="muted-2" style={{ marginTop: 4, fontSize: 14 }}>
          {job.productTitle ? `Материал: ${job.productTitle} · ` : ""}
          Максимум {defaultMax || "—"} баллов
          {job.totalTasks ? ` · ${job.totalTasks} заданий` : ""}
          {` · шкала «5» ≥ ${scale.s5}%, «4» ≥ ${scale.s4}%, «3» ≥ ${scale.s3}%`}
        </p>
      </div>

      {(notice || error) && (
        <div
          className="card"
          style={{
            padding: "12px 16px",
            fontSize: 14,
            borderColor: error ? "var(--error)" : "var(--success)",
            color: error ? "var(--error)" : "var(--fg-2)",
          }}
        >
          {error ?? notice}
        </div>
      )}

      {/* Загрузка работ */}
      <div className="card" style={{ padding: 18 }}>
        <div className="rl-row-between" style={{ marginBottom: 10 }}>
          <h3>Работы учеников</h3>
          <span className="muted" style={{ fontSize: 12.5 }}>
            {uploads.length} файлов
          </span>
        </div>
        <input
          ref={fileInput}
          type="file"
          multiple
          accept="application/pdf,image/jpeg,image/png,image/webp"
          style={{ display: "none" }}
          onChange={(e) => uploadFiles(e.target.files)}
        />
        <div
          className="rl2-drop"
          onClick={() => fileInput.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.classList.add("over");
          }}
          onDragLeave={(e) => e.currentTarget.classList.remove("over")}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove("over");
            uploadFiles(e.dataTransfer.files);
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <IconUpload size={26} />
            <div style={{ fontWeight: 600, fontSize: 14.5 }}>
              {busy === "upload" ? "Загружаем…" : "Перетащите PDF или фото работ — или нажмите"}
            </div>
            <div className="muted" style={{ fontSize: 12.5 }}>
              Можно пачкой: до 40 файлов, до 25 МБ каждый
            </div>
          </div>
        </div>
        {uploads.length > 0 && (
          <div className="rl-row" style={{ marginTop: 10, gap: 6 }}>
            {uploads.map((u) => (
              <span key={u.id} className="rl2-kit-chip" title={`${Math.round(u.size / 1024)} КБ`}>
                <IconDoc size={12} /> {u.filename}
              </span>
            ))}
          </div>
        )}
        {uploads.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <button type="button" className="btn btn-blue" disabled={busy === "run"} onClick={runAuto}>
              {busy === "run" ? "Проверяем…" : "⚡ Автопроверка"}
            </button>
            <span className="muted" style={{ fontSize: 12.5, marginLeft: 10 }}>
              {job.productCheckable
                ? "По ключу материала; после — просмотрите таблицу."
                : "Для своих работ пока ручная разметка баллов ниже."}
            </span>
          </div>
        )}
      </div>

      {/* Сводка */}
      {stats.checked > 0 && (
        <div className="rl-grid rl-grid-3">
          <div className="rl2-stat">
            <span className="rl2-stat-label">Проверено</span>
            <span className="rl2-stat-value">
              {stats.checked}/{stats.total}
            </span>
          </div>
          <div className="rl2-stat">
            <span className="rl2-stat-label">Средний результат</span>
            <span className="rl2-stat-value">{stats.avg}%</span>
          </div>
          <div className="rl2-stat">
            <span className="rl2-stat-label">Отметки</span>
            <div className="rl2-marks" style={{ marginTop: 4 }}>
              {([5, 4, 3, 2] as const).map((m) => {
                const max = Math.max(...Object.values(stats.dist), 1);
                return (
                  <div key={m} className={`m${m}`}>
                    <i style={{ height: `${Math.max((stats.dist[m] / max) * 30, 3)}px` }} />
                    <span>
                      {m}: {stats.dist[m]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Таблица результатов */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="rl2-check-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}>№</th>
                <th>Ученик</th>
                <th style={{ width: 130 }}>Баллы</th>
                <th style={{ width: 70 }}>%</th>
                <th style={{ width: 76 }}>Отметка</th>
                <th style={{ width: 60 }}>Н</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} style={{ opacity: r.absent ? 0.45 : 1 }}>
                  <td className="muted">{i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{r.studentName}</td>
                  <td>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <input
                        type="number"
                        min={0}
                        max={r.maxScore || 999}
                        value={r.absent ? "" : r.needsReview ? "" : r.score}
                        placeholder={r.absent ? "—" : "?"}
                        disabled={r.absent}
                        onChange={(e) => setScore(r.id, e.target.value)}
                        style={{
                          width: 58,
                          padding: "6px 8px",
                          borderRadius: 8,
                          border: "1px solid var(--border-2)",
                          fontSize: 14,
                          fontWeight: 600,
                          textAlign: "center",
                        }}
                      />
                      <span className="muted" style={{ fontSize: 12 }}>
                        / {r.maxScore || "—"}
                      </span>
                    </span>
                  </td>
                  <td>{r.absent || r.needsReview ? "—" : `${r.pct.toFixed(0)}%`}</td>
                  <td>
                    <span
                      className="rl2-mark"
                      data-mark={r.absent || r.needsReview ? "-" : String(r.mark ?? computeMark(r.pct, scale))}
                    >
                      {r.absent ? "н" : r.needsReview ? "·" : r.mark ?? computeMark(r.pct, scale)}
                    </span>
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={r.absent}
                      onChange={() => toggleAbsent(r.id)}
                      title="Отсутствовал(а)"
                      style={{ width: 17, height: 17, accentColor: "var(--primary)" }}
                    />
                  </td>
                </tr>
              ))}
              <tr>
                <td />
                <td colSpan={5}>
                  <span style={{ display: "inline-flex", gap: 8, alignItems: "center", padding: "4px 0" }}>
                    <input
                      className="rl-input"
                      style={{ minHeight: 36, maxWidth: 260, fontSize: 14 }}
                      placeholder="Добавить ученика…"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addRow()}
                    />
                    <button type="button" className="btn btn-sm btn-outline" onClick={addRow}>
                      +
                    </button>
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Действия */}
      <div className="rl2-actions rl-row" style={{ gap: 10 }}>
        <button type="button" className="btn btn-outline" disabled={!!busy} onClick={() => save(false)}>
          {busy === "save" ? "Сохраняем…" : dirty ? "Сохранить изменения" : "Сохранено"}
        </button>
        <button type="button" className="btn btn-blue" disabled={!!busy} onClick={() => save(true)}>
          {busy === "done" ? "…" : "Завершить проверку"}
        </button>
        <button type="button" className="btn btn-primary" disabled={!!busy || stats.checked === 0} onClick={makeReport}>
          {busy === "report" ? "Собираем отчёт…" : "📄 Отчёт (PDF)"}
        </button>
      </div>

      {/* Отчёты по этой проверке */}
      {reports.length > 0 && (
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ marginBottom: 10 }}>Отчёты</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {reports.map((r) => (
              <div key={r.id} className="rl-row-between" style={{ fontSize: 14 }}>
                <span>
                  {r.title}{" "}
                  <span className="muted" style={{ fontSize: 12 }}>
                    {new Date(r.createdAt).toLocaleString("ru-RU")}
                  </span>
                </span>
                <span className="rl-row" style={{ gap: 6 }}>
                  {r.hasPdf && (
                    <a className="btn btn-sm btn-outline" href={`/api/reports/${r.id}/file?kind=pdf`}>
                      PDF
                    </a>
                  )}
                  <a className="btn btn-sm btn-ghost" href={`/api/reports/${r.id}/file?kind=tex`}>
                    .tex
                  </a>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
