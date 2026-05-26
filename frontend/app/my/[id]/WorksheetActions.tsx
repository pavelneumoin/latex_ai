"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  worksheetId: string;
  hasPdf: boolean;
  pdfPath: string | null;
  isPublic: boolean;
};

export function WorksheetActions({ worksheetId, isPublic }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function call(
    path: string,
    body?: Record<string, unknown>,
    method: "POST" | "DELETE" = "POST"
  ): Promise<Response> {
    return fetch(path, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async function onVariant(): Promise<void> {
    setBusy("variant");
    setErr(null);
    try {
      const r = await call(`/api/worksheets/${worksheetId}/variants`, {});
      if (!r.ok) setErr("Не удалось создать вариант");
      else router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function onHarder(): Promise<void> {
    setBusy("harder");
    setErr(null);
    try {
      const r = await call(`/api/worksheets/${worksheetId}/harder`, { complexityStep: 2 });
      if (!r.ok) setErr("Не удалось создать усложнённый вариант");
      else router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function onPublish(): Promise<void> {
    setBusy("publish");
    setErr(null);
    try {
      const r = await call(`/api/worksheets/${worksheetId}/publish`, {});
      if (!r.ok) setErr("Не удалось опубликовать");
      else router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function onDelete(): Promise<void> {
    if (!confirm("Удалить этот лист? Действие нельзя отменить.")) return;
    setBusy("delete");
    setErr(null);
    try {
      const r = await call(`/api/worksheets/${worksheetId}`, undefined, "DELETE");
      if (!r.ok) {
        setErr("Не удалось удалить");
        setBusy(null);
        return;
      }
      router.push("/my");
      router.refresh();
    } catch {
      setErr("Не удалось удалить");
      setBusy(null);
    }
  }

  async function onExport(format: "pdf" | "docx" | "latex" | "zip"): Promise<void> {
    setBusy(`exp-${format}`);
    setErr(null);
    try {
      const path =
        format === "zip"
          ? `/api/worksheets/${worksheetId}/latex-zip`
          : `/api/worksheets/${worksheetId}/export?format=${format}`;
      const r = await fetch(path);
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        setErr(
          data?.hint ||
            data?.detail ||
            (format === "pdf"
              ? "PDF недоступен: на сервере нет xelatex"
              : `Не удалось скачать ${format.toUpperCase()}`)
        );
        return;
      }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const filename =
        r.headers.get("Content-Disposition")?.match(/filename="?([^"]+)"?/)?.[1] ||
        `worksheet.${format === "zip" ? "zip" : format}`;
      a.download = decodeURIComponent(filename);
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(null);
    }
  }

  function onOverleaf(): void {
    // Открывается в новой вкладке: маршрут отдаёт HTML с авто-сабмитом формы в Overleaf.
    window.open(`/api/worksheets/${worksheetId}/overleaf`, "_blank", "noopener,noreferrer");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* ──── Экспорт ──── */}
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--fg-3)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: 8,
          }}
        >
          Скачать
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn-blue"
            disabled={Boolean(busy)}
            onClick={() => onExport("pdf")}
            title="PDF для печати (требует xelatex на сервере)"
          >
            {busy === "exp-pdf" ? "..." : "PDF"}
          </button>
          <button
            type="button"
            className="btn btn-outline"
            disabled={Boolean(busy)}
            onClick={() => onExport("docx")}
            title="Word (.docx) для редактирования"
          >
            {busy === "exp-docx" ? "..." : "DOCX"}
          </button>
          <button
            type="button"
            className="btn btn-outline"
            disabled={Boolean(busy)}
            onClick={() => onExport("latex")}
            title="Исходник .tex"
          >
            {busy === "exp-latex" ? "..." : ".tex"}
          </button>
          <button
            type="button"
            className="btn btn-outline"
            disabled={Boolean(busy)}
            onClick={() => onExport("zip")}
            title="ZIP с .tex и README для локальной компиляции"
          >
            {busy === "exp-zip" ? "..." : "ZIP"}
          </button>
        </div>
      </div>

      {/* ──── Overleaf ──── */}
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--fg-3)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: 8,
          }}
        >
          Редактировать
        </div>
        <button
          type="button"
          className="btn"
          disabled={Boolean(busy)}
          onClick={onOverleaf}
          style={{
            background: "#138A07",
            color: "white",
            width: "100%",
          }}
          title="Открыть LaTeX-исходник в Overleaf для правки"
        >
          ✎ Открыть в Overleaf
        </button>
      </div>

      {/* ──── LLM-действия ──── */}
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--fg-3)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: 8,
          }}
        >
          Нейросеть
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn-outline"
            disabled={Boolean(busy)}
            onClick={onVariant}
          >
            {busy === "variant" ? "Создаём..." : "Ещё вариант"}
          </button>
          <button
            type="button"
            className="btn btn-outline"
            disabled={Boolean(busy)}
            onClick={onHarder}
          >
            {busy === "harder" ? "Усложняем..." : "Усложнить"}
          </button>
        </div>
      </div>

      {/* ──── Публикация ──── */}
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--fg-3)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: 8,
          }}
        >
          Поделиться
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {!isPublic && (
            <button
              type="button"
              className="btn btn-primary"
              disabled={Boolean(busy)}
              onClick={onPublish}
            >
              {busy === "publish" ? "Публикуем..." : "В маркетплейс"}
            </button>
          )}
          <button
            type="button"
            className="btn btn-ghost"
            disabled={Boolean(busy)}
            onClick={onDelete}
            style={{ color: "var(--error)" }}
          >
            {busy === "delete" ? "Удаляем..." : "Удалить"}
          </button>
        </div>
      </div>

      {err && (
        <div
          style={{
            padding: "8px 12px",
            background: "#FEE2E2",
            color: "#991B1B",
            borderRadius: 8,
            fontSize: 13,
          }}
        >
          {err}
        </div>
      )}
    </div>
  );
}
