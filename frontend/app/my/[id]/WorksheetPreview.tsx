// Серверный компонент: HTML-предпросмотр рабочего листа в стиле выбранного шаблона.
// Применяет цвет акцента, типографику и vibe (card / minimal / dark / ...) из STYLE_PALETTE.
// Не зависит от LaTeX — рендерит сразу в браузере. Используется на /my/[id] и /share/[id].

import { getStylePalette } from "@/lib/style-palette";
import { renderTaskCondition } from "@/lib/format-task";

type Task = {
  n?: number | string;
  condition?: string;
  expected_answer?: string;
  expected?: string;
  answer?: string;
  hint?: string;
};

type Props = {
  title: string;
  subtitle?: string;
  templateStyle?: string | null;
  templateName?: string | null;
  templateId?: string | null;
  tasks: Task[];
  showAnswers?: boolean;
  teacherName?: string | null;
  schoolName?: string | null;
};

export function WorksheetPreview({
  title,
  subtitle,
  templateStyle,
  templateName,
  templateId,
  tasks,
  showAnswers = true,
  teacherName,
  schoolName,
}: Props) {
  const palette = getStylePalette(templateStyle);
  const isDark = palette.vibe === "dark";
  const isMono = palette.vibe === "monospace";
  const isOrnate = palette.vibe === "ornate";
  const isOfficial = palette.vibe === "official";
  const isMinimal = palette.vibe === "minimal";

  const pageBg = palette.bg || "#FFFFFF";
  const textColor = palette.textColor || "#0F172A";
  const mutedColor = isDark ? "rgba(255,255,255,0.6)" : "#64748B";

  return (
    <div
      style={{
        background: pageBg,
        color: textColor,
        fontFamily: palette.fontFamily || "var(--body)",
        borderRadius: 14,
        overflow: "hidden",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "var(--border)"}`,
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* Шапка листа */}
      <div
        style={{
          padding: "28px 36px 20px",
          borderBottom: isOfficial
            ? `2px solid ${palette.primary}`
            : isOrnate
              ? `3px double ${palette.primary}`
              : `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
        }}
      >
        {(teacherName || schoolName) && (
          <div
            style={{
              fontSize: 12,
              color: mutedColor,
              marginBottom: 6,
              textTransform: isOfficial ? "uppercase" : "none",
              letterSpacing: isOfficial ? "0.05em" : "0",
            }}
          >
            {schoolName ? `${schoolName}${teacherName ? ` · ${teacherName}` : ""}` : teacherName}
          </div>
        )}
        <h2
          style={{
            margin: 0,
            fontSize: isMono ? 22 : 28,
            fontWeight: isOrnate ? 700 : 700,
            color: palette.primary,
            textTransform: isMono ? "uppercase" : "none",
            letterSpacing: isMono ? "0.02em" : "-0.01em",
            lineHeight: 1.15,
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <div
            style={{
              marginTop: 6,
              fontSize: 13,
              color: mutedColor,
              fontStyle: isOrnate ? "italic" : "normal",
            }}
          >
            {subtitle}
          </div>
        )}
        {templateId && templateName && (
          <div
            style={{
              marginTop: 10,
              display: "inline-block",
              padding: "2px 8px",
              borderRadius: 4,
              background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)",
              fontSize: 11,
              color: mutedColor,
              fontWeight: 500,
            }}
          >
            {templateId} · {templateName}
          </div>
        )}
      </div>

      {/* Задачи */}
      <div
        style={{
          padding: "20px 36px 32px",
          display: "flex",
          flexDirection: "column",
          gap: isMinimal ? 24 : 16,
        }}
      >
        {tasks.map((t, i) => {
          const n = t.n ?? i + 1;
          const condition = t.condition ?? "";
          const answer = t.expected_answer ?? t.expected ?? t.answer ?? "";
          return (
            <TaskBlock
              key={i}
              n={n}
              condition={condition}
              answer={String(answer)}
              showAnswer={showAnswers}
              palette={palette}
            />
          );
        })}
      </div>

      {/* Подвал */}
      <div
        style={{
          padding: "12px 36px",
          borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"}`,
          fontSize: 11,
          color: mutedColor,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>Сгенерировано на РабочийЛист.ai</span>
        <span>{tasks.length} задач</span>
      </div>

      <style>{`
        .ws-task-body .math {
          font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
          background: rgba(0,0,0,0.04);
          padding: 0 4px;
          border-radius: 3px;
          font-style: normal;
        }
        .ws-task-body { line-height: 1.55; }
      `}</style>
    </div>
  );
}

function TaskBlock({
  n,
  condition,
  answer,
  showAnswer,
  palette,
}: {
  n: number | string;
  condition: string;
  answer: string;
  showAnswer: boolean;
  palette: ReturnType<typeof getStylePalette>;
}) {
  const isDark = palette.vibe === "dark";
  const isMinimal = palette.vibe === "minimal";
  const isOrnate = palette.vibe === "ornate";
  const isOfficial = palette.vibe === "official";

  // Разные карточки в зависимости от vibe
  const cardStyle: React.CSSProperties = isMinimal
    ? { borderLeft: `2px solid ${palette.primary}`, paddingLeft: 16 }
    : isOrnate
      ? {
          border: `1px solid ${palette.primary}40`,
          borderRadius: 6,
          padding: "12px 16px",
          background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.015)",
        }
      : isOfficial
        ? { borderBottom: `1px dashed ${palette.primary}50`, paddingBottom: 14 }
        : {
            border: `1px solid ${palette.primary}30`,
            borderRadius: 10,
            padding: "12px 16px",
            background: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.5)",
          };

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 26,
            height: 22,
            padding: "0 7px",
            background: palette.primary,
            color: "#fff",
            borderRadius: isOrnate ? 0 : 4,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.02em",
          }}
        >
          №{n}
        </span>
      </div>
      <div
        className="ws-task-body"
        dangerouslySetInnerHTML={{ __html: renderTaskCondition(condition) }}
        style={{ fontSize: 14, marginBottom: showAnswer ? 8 : 0 }}
      />
      {showAnswer && answer && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            marginTop: 4,
            padding: "3px 10px",
            background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
            borderRadius: 6,
            fontSize: 12,
          }}
        >
          <span style={{ color: palette.primary, fontWeight: 600 }}>Ответ:</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{answer}</span>
        </div>
      )}
    </div>
  );
}
