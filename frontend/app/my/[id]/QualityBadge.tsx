"use client";

import { useState } from "react";
import type { ValidationResult, IssueSeverity } from "@/lib/worksheet-validator";

const SEVERITY_META: Record<IssueSeverity, { label: string; color: string; icon: string }> = {
  error: { label: "Ошибка", color: "#EF4444", icon: "●" },
  warning: { label: "Замечание", color: "#F59E0B", icon: "●" },
  info: { label: "Совет", color: "#64748B", icon: "○" },
};

function scoreColor(score: number): string {
  if (score >= 90) return "#10B981";
  if (score >= 70) return "#0EA5E9";
  if (score >= 50) return "#F59E0B";
  return "#EF4444";
}

function scoreLabel(score: number, ok: boolean): string {
  if (!ok) return "Есть ошибки";
  if (score >= 90) return "Отличное качество";
  if (score >= 70) return "Хорошее качество";
  if (score >= 50) return "Есть замечания";
  return "Требует доработки";
}

export function QualityBadge({ result }: { result: ValidationResult }) {
  const [open, setOpen] = useState(false);
  const color = scoreColor(result.score);
  const hasIssues = result.issues.length > 0;

  return (
    <div>
      <button
        type="button"
        onClick={() => hasIssues && setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 12px",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          cursor: hasIssues ? "pointer" : "default",
          textAlign: "left",
        }}
      >
        {/* Кольцо со score */}
        <div
          style={{
            position: "relative",
            width: 44,
            height: 44,
            flexShrink: 0,
            borderRadius: "50%",
            background: `conic-gradient(${color} ${result.score * 3.6}deg, var(--border) 0deg)`,
            display: "grid",
            placeItems: "center",
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "var(--bg)",
              display: "grid",
              placeItems: "center",
              fontSize: 13,
              fontWeight: 700,
              color,
            }}
          >
            {result.score}
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>
            {scoreLabel(result.score, result.ok)}
          </div>
          <div style={{ fontSize: 12, color: "var(--fg-3)" }}>
            {hasIssues
              ? `${result.counts.error ? `${result.counts.error} ошибок · ` : ""}${
                  result.counts.warning ? `${result.counts.warning} замечаний · ` : ""
                }${result.counts.info ? `${result.counts.info} советов` : ""}`.replace(/ · $/, "")
              : "Проблем не найдено"}
          </div>
        </div>

        {hasIssues && (
          <span style={{ color: "var(--fg-3)", fontSize: 12 }}>{open ? "▲" : "▼"}</span>
        )}
      </button>

      {open && hasIssues && (
        <ul
          style={{
            listStyle: "none",
            margin: "8px 0 0",
            padding: 0,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {result.issues.map((iss, i) => {
            const meta = SEVERITY_META[iss.severity];
            return (
              <li
                key={i}
                style={{
                  display: "flex",
                  gap: 8,
                  fontSize: 12,
                  lineHeight: 1.4,
                  color: "var(--fg-2)",
                }}
              >
                <span style={{ color: meta.color, flexShrink: 0 }}>{meta.icon}</span>
                <span>
                  {iss.taskN != null && (
                    <strong style={{ color: "var(--fg)" }}>№{iss.taskN}: </strong>
                  )}
                  {iss.message}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
