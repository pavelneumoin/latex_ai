"use client";

import { useState, FormEvent } from "react";
import { updateProfile } from "./actions";

type Props = {
  initial: {
    name: string;
    school: string;
    subjects: string[];
    grades: string[];
    watermark: string;
    accentColor: string;
    logoPath: string | null;
  };
};

const SUBJECT_OPTIONS: { value: string; label: string }[] = [
  { value: "math", label: "Математика" },
  { value: "informatics", label: "Информатика" },
];

const GRADE_OPTIONS = ["5", "6", "7", "8", "9", "10", "11"];

export function SettingsForm({ initial }: Props) {
  const [name, setName] = useState<string>(initial.name);
  const [school, setSchool] = useState<string>(initial.school);
  const [subjects, setSubjects] = useState<string[]>(initial.subjects);
  const [grades, setGrades] = useState<string[]>(initial.grades);
  const [watermark, setWatermark] = useState<string>(initial.watermark);
  const [accentColor, setAccentColor] = useState<string>(initial.accentColor || "#1E40AF");
  const [logoPath, setLogoPath] = useState<string | null>(initial.logoPath);

  const [saving, setSaving] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function toggle(arr: string[], val: string): string[] {
    return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
  }

  async function onUploadLogo(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("purpose", "logo");
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      if (!r.ok) {
        setErr("Не удалось загрузить лого");
        return;
      }
      const data: { path?: string } = await r.json().catch(() => ({}));
      if (data.path) {
        setLogoPath(data.path);
        setMsg("Лого загружено");
      }
    } catch {
      setErr("Ошибка загрузки");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    setErr(null);
    try {
      const result = await updateProfile({
        name,
        school,
        subjects,
        grades,
        watermark,
        accentColor,
      });
      if (result.ok) {
        setMsg("Профиль сохранён");
      } else {
        setErr(result.error);
      }
    } catch {
      setErr("Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Personal */}
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ marginBottom: 16 }}>Профиль</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label className="label" htmlFor="name">Имя</label>
            <input
              id="name"
              className="input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Иван Петров"
            />
          </div>
          <div>
            <label className="label" htmlFor="school">Школа</label>
            <input
              id="school"
              className="input"
              type="text"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              placeholder="МАОУ Лицей №1, г. Москва"
            />
          </div>
        </div>
      </div>

      {/* Subjects and grades */}
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ marginBottom: 16 }}>Что преподаёте</h3>

        <div style={{ marginBottom: 18 }}>
          <div className="label" style={{ marginBottom: 8 }}>Предметы</div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {SUBJECT_OPTIONS.map((s) => {
              const on = subjects.includes(s.value);
              return (
                <label
                  key={s.value}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 14px",
                    borderRadius: 10,
                    border: `1px solid ${on ? "var(--primary)" : "var(--border-2)"}`,
                    background: on ? "var(--primary-soft)" : "white",
                    color: on ? "var(--primary)" : "var(--fg)",
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => setSubjects(toggle(subjects, s.value))}
                    style={{ accentColor: "var(--primary)" }}
                  />
                  {s.label}
                </label>
              );
            })}
          </div>
        </div>

        <div>
          <div className="label" style={{ marginBottom: 8 }}>Классы</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {GRADE_OPTIONS.map((g) => {
              const on = grades.includes(g);
              return (
                <button
                  type="button"
                  key={g}
                  onClick={() => setGrades(toggle(grades, g))}
                  style={{
                    minWidth: 44,
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: `1px solid ${on ? "var(--primary)" : "var(--border-2)"}`,
                    background: on ? "var(--primary)" : "white",
                    color: on ? "white" : "var(--fg)",
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Brand */}
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ marginBottom: 16 }}>Брендинг PDF</h3>

        <div style={{ marginBottom: 18 }}>
          <div className="label" style={{ marginBottom: 8 }}>Лого</div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {logoPath ? (
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 10,
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  overflow: "hidden",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 11,
                  color: "var(--fg-3)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoPath}
                  alt="лого"
                  style={{ maxWidth: "100%", maxHeight: "100%" }}
                />
              </div>
            ) : (
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 10,
                  background: "var(--surface)",
                  border: "1px dashed var(--border-2)",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 11,
                  color: "var(--fg-3)",
                }}
              >
                нет
              </div>
            )}
            <label
              style={{
                cursor: "pointer",
                padding: "10px 16px",
                borderRadius: 10,
                background: "white",
                border: "1px solid var(--border-2)",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {uploading ? "Загружаем..." : "Загрузить лого"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                style={{ display: "none" }}
                onChange={onUploadLogo}
                disabled={uploading}
              />
            </label>
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label className="label" htmlFor="watermark">Водяной знак (текст)</label>
          <input
            id="watermark"
            className="input"
            type="text"
            value={watermark}
            onChange={(e) => setWatermark(e.target.value)}
            placeholder="Например: МАОУ Лицей №1"
            maxLength={80}
          />
        </div>

        <div>
          <label className="label" htmlFor="accent">Цвет акцента</label>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <input
              id="accent"
              type="color"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              style={{
                width: 56,
                height: 42,
                padding: 4,
                borderRadius: 10,
                border: "1px solid var(--border-2)",
                cursor: "pointer",
                background: "white",
              }}
            />
            <input
              type="text"
              className="input"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              placeholder="#1E40AF"
              style={{ maxWidth: 180 }}
              pattern="^#[0-9a-fA-F]{6}$"
            />
          </div>
        </div>
      </div>

      {msg && (
        <div
          style={{
            padding: "10px 14px",
            background: "#D1FAE5",
            color: "#065F46",
            borderRadius: 8,
            fontSize: 14,
          }}
        >
          {msg}
        </div>
      )}
      {err && (
        <div
          style={{
            padding: "10px 14px",
            background: "#FEE2E2",
            color: "#991B1B",
            borderRadius: 8,
            fontSize: 14,
          }}
        >
          {err}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button type="submit" className="btn btn-blue btn-lg" disabled={saving}>
          {saving ? "Сохраняем..." : "Сохранить изменения"}
        </button>
      </div>
    </form>
  );
}
