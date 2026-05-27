"use client";

import { useMemo, useState } from "react";

type Template = {
  id: string;
  name: string;
  description: string;
  subject: string;
  grade: number | null;
  layout: string;
  style: string;
  taskCount: number;
  tags: string[];
};

const STYLE_PALETTE: Record<string, { primary: string; bg?: string; label?: string }> = {
  classic_wildcat_purple: { primary: "#5B2E91", label: "Классика" },
  compact_underline: { primary: "#5B2E91" },
  minimal_gray: { primary: "#475569", label: "Минимал" },
  newspaper_navy: { primary: "#1E3A8A", label: "Газета" },
  journal_amber: { primary: "#B45309", label: "Журнал" },
  cards_emerald: { primary: "#047857", label: "Карточки" },
  control_graphite: { primary: "#1F2937", label: "Контрольная" },
  notebook_ink: { primary: "#1E40AF", label: "Тетрадь" },
  terminal_green: { primary: "#059669", bg: "#0B1220", label: "Терминал" },
  pastel_three_tones: { primary: "#A78BFA", label: "Пастель" },
  oge_official_bw: { primary: "#991B1B", label: "ОГЭ" },
  trainer_teal: { primary: "#0D9488", label: "Тренажёр" },
  scandi_white: { primary: "#1A1A1A", label: "Скандинав" },
  retro_typewriter: { primary: "#000000", label: "Ретро" },
  space_dark: { primary: "#A78BFA", bg: "#0B0B14", label: "Космос" },
  victorian_ornate: { primary: "#7C2D12", label: "Викториан" },
  exam_form: { primary: "#4B5563", label: "Бланк ЕГЭ" },
  quick_15min: { primary: "#EA580C", label: "15 минут" },
  mental_grid_5x5: { primary: "#0891B2", label: "Устный" },
  code_python: { primary: "#1D4ED8", bg: "#F0F4FF", label: "Python" },
  graphs_grid: { primary: "#065F46", label: "Графики" },
  olympiad_premium: { primary: "#B45309", label: "Олимпиада" },
  sea_navy: { primary: "#075985", label: "Море" },
  forest_green: { primary: "#166534", label: "Лес" },
  bingo_card: { primary: "#DB2777", label: "Бинго" },
  maze_flow: { primary: "#6D28D9", label: "Лабиринт" },
  table_grid: { primary: "#374151", label: "Таблица" },
  algo_flowchart: { primary: "#0EA5E9", label: "Блок-схемы" },
  final_year_premium: { primary: "#1E3A8A", label: "Итоговая" },
  letter_format: { primary: "#713F12", label: "Письмо" },
  flashcards_dual: { primary: "#7C3AED", label: "Флешкарты" },
  wabisabi_asymmetric: { primary: "#57534E", label: "Ваби-саби" },
};

export function TemplateGallery({ templates }: { templates: Template[] }) {
  const [subject, setSubject] = useState<string>("");
  const [grade, setGrade] = useState<string>("");
  const [layout, setLayout] = useState<string>("");
  const [q, setQ] = useState<string>("");

  const grades = useMemo(() => {
    const set = new Set<number>();
    for (const t of templates) if (t.grade != null) set.add(t.grade);
    return Array.from(set).sort((a, b) => a - b);
  }, [templates]);

  const layouts = useMemo(() => {
    const set = new Set<string>();
    for (const t of templates) set.add(t.layout);
    return Array.from(set).sort();
  }, [templates]);

  const filtered = useMemo(() => {
    const ql = q.toLowerCase().trim();
    return templates.filter((t) => {
      if (subject && t.subject !== subject) return false;
      if (grade && String(t.grade) !== grade) return false;
      if (layout && t.layout !== layout) return false;
      if (ql) {
        const hay = (t.name + " " + t.description + " " + t.tags.join(" ")).toLowerCase();
        if (!hay.includes(ql)) return false;
      }
      return true;
    });
  }, [templates, subject, grade, layout, q]);

  return (
    <div>
      {/* Фильтры */}
      <div
        className="card"
        style={{
          padding: 16,
          marginBottom: 20,
          display: "grid",
          gridTemplateColumns: "1fr 160px 120px 200px",
          gap: 10,
          alignItems: "end",
        }}
      >
        <div>
          <label className="label" htmlFor="q">Поиск</label>
          <input
            id="q"
            className="input"
            type="text"
            placeholder="по названию, тегу или описанию"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Предмет</label>
          <select className="select" value={subject} onChange={(e) => setSubject(e.target.value)}>
            <option value="">Все</option>
            <option value="math">Математика</option>
            <option value="informatics">Информатика</option>
            <option value="mixed">Смешанный</option>
          </select>
        </div>
        <div>
          <label className="label">Класс</label>
          <select className="select" value={grade} onChange={(e) => setGrade(e.target.value)}>
            <option value="">Все</option>
            {grades.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Раскладка</label>
          <select className="select" value={layout} onChange={(e) => setLayout(e.target.value)}>
            <option value="">Любая</option>
            {layouts.map((l) => (
              <option key={l} value={l}>{layoutLabel(l)}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ fontSize: 13, color: "var(--fg-3)", marginBottom: 12 }}>
        Найдено: {filtered.length} из {templates.length}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 16,
        }}
      >
        {filtered.map((t) => (
          <TemplateCard key={t.id} template={t} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div
          className="card"
          style={{ padding: 32, textAlign: "center", color: "var(--fg-3)" }}
        >
          По вашим фильтрам шаблонов не найдено.
        </div>
      )}
    </div>
  );
}

function TemplateCard({ template }: { template: Template }) {
  const palette = STYLE_PALETTE[template.style] ?? STYLE_PALETTE.classic_wildcat_purple;
  const isDark = palette.bg && palette.bg.startsWith("#0");
  return (
    <div
      className="card"
      style={{
        padding: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Mini-превью: имитация шапки листа в стиле шаблона */}
      <div
        style={{
          padding: 18,
          background: palette.bg || "var(--surface)",
          borderBottom: `3px solid ${palette.primary}`,
          minHeight: 90,
          color: isDark ? "#fff" : "var(--fg)",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "2px 8px",
            borderRadius: 4,
            background: palette.primary,
            color: "#fff",
            fontSize: 10,
            fontWeight: 600,
            marginBottom: 8,
          }}
        >
          {template.id}
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>
          {template.name}
        </div>
        {palette.label && (
          <div
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              fontSize: 10,
              color: isDark ? "rgba(255,255,255,0.6)" : "var(--fg-3)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {palette.label}
          </div>
        )}
      </div>
      <div style={{ padding: 14, flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontSize: 12, color: "var(--fg-3)", lineHeight: 1.45, minHeight: 50 }}>
          {template.description}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
          <Pill>{subjectLabel(template.subject)}</Pill>
          {template.grade != null && <Pill>{template.grade} класс</Pill>}
          <Pill>{template.taskCount} задач</Pill>
        </div>
      </div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 6,
        fontSize: 11,
        background: "var(--surface-2)",
        color: "var(--fg-2)",
      }}
    >
      {children}
    </span>
  );
}

function subjectLabel(s: string): string {
  if (s === "math") return "матем.";
  if (s === "informatics") return "информ.";
  return s;
}

function layoutLabel(l: string): string {
  const map: Record<string, string> = {
    single_column: "1 колонка",
    two_columns: "2 колонки",
    three_columns: "3 колонки",
    grid_2x4: "сетка 2×4",
    grid_3x3: "сетка 3×3",
    grid_4x4: "сетка 4×4",
    grid_5x5: "сетка 5×5",
    grid_1x2: "1×2 (флешкарты)",
    variants_two: "2 варианта",
  };
  return map[l] ?? l;
}
