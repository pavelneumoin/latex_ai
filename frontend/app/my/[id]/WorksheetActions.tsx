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
  const [refineOpen, setRefineOpen] = useState(false);
  const [refineText, setRefineText] = useState("");
  const [refineMode, setRefineMode] = useState<"branch" | "replace">("branch");

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
      if (!r.ok) setErr("Не удалось создать аналогичный вариант");
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
      if (!r.ok) setErr("Не удалось создать аналогичный усложнённый");
      else router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function onRefine(): Promise<void> {
    const instruction = refineText.trim();
    if (instruction.length < 3) {
      setErr("Опиши, что нужно поправить (от 3 символов)");
      return;
    }
    setBusy("refine");
    setErr(null);
    try {
      const r = await call(`/api/worksheets/${worksheetId}/refine`, {
        instruction,
        replace: refineMode === "replace",
      });
      const data = await r.json();
      if (!r.ok) {
        setErr(data?.detail || data?.error || "Не удалось применить правку");
        return;
      }
      if (refineMode === "replace") {
        setRefineOpen(false);
        setRefineText("");
        router.refresh();
      } else if (data.worksheet?.id) {
        router.push(`/my/${data.worksheet.id}`);
      }
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
    window.open(`/api/worksheets/${worksheetId}/overleaf`, "_blank", "noopener,noreferrer");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* ──── Нейросеть-редактор (главное) ──── */}
      <div
        style={{
          background: refineOpen ? "var(--primary-soft)" : "var(--surface-2)",
          border: `1px solid ${refineOpen ? "var(--primary)" : "var(--border)"}`,
          borderRadius: 12,
          padding: 14,
          transition: "background 0.15s",
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
          Поговорить с нейросетью
        </div>
        {!refineOpen ? (
          <button
            type="button"
            className="btn"
            style={{ width: "100%", background: "var(--primary)", color: "var(--primary-fg)" }}
            onClick={() => setRefineOpen(true)}
          >
            💬 Попросить правку («сделай №3 проще», «убери дроби»…)
          </button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <textarea
              value={refineText}
              onChange={(e) => setRefineText(e.target.value)}
              placeholder="Что поправить? Например: «убери задачу №2 и добавь две новые на эту же тему», «сделай задачи проще»"
              rows={3}
              maxLength={2000}
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 8,
                border: "1px solid var(--border)",
                fontSize: 13,
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                <input
                  type="radio"
                  name="refineMode"
                  checked={refineMode === "branch"}
                  onChange={() => setRefineMode("branch")}
                />
                <span>Создать копию</span>
              </label>
              <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                <input
                  type="radio"
                  name="refineMode"
                  checked={refineMode === "replace"}
                  onChange={() => setRefineMode("replace")}
                />
                <span>Заменить этот лист</span>
              </label>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="btn"
                disabled={Boolean(busy) || refineText.trim().length < 3}
                onClick={onRefine}
                style={{ background: "var(--accent)", color: "var(--accent-fg)", flex: 1 }}
              >
                {busy === "refine" ? "Применяю…" : "Применить правку"}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => { setRefineOpen(false); setRefineText(""); }}
              >
                Отмена
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ──── Создать варианты ──── */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
          Создать варианты
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn-outline"
            disabled={Boolean(busy)}
            onClick={onVariant}
            title="Тот же шаблон, та же тема — другие задачи"
          >
            {busy === "variant" ? "Создаём…" : "🔄 Создать аналогичный"}
          </button>
          <button
            type="button"
            className="btn btn-outline"
            disabled={Boolean(busy)}
            onClick={onHarder}
            title="Та же тема, но задачи сложнее"
          >
            {busy === "harder" ? "Усложняем…" : "⬆️ Аналогичный усложнённый"}
          </button>
        </div>
      </div>

      {/* ──── Открыть в Overleaf (выделено) ──── */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
          Редактировать LaTeX
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
            fontWeight: 700,
            padding: "12px 16px",
            fontSize: 14,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
          title="Откроется в новой вкладке как готовый проект Overleaf"
        >
          ✎ Открыть в Overleaf для правки
        </button>
        <div style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 4 }}>
          .tex попадёт в Overleaf — там правишь как обычный LaTeX-документ.
        </div>
      </div>

      {/* ──── Экспорт ──── */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
          Скачать
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="btn btn-blue" disabled={Boolean(busy)} onClick={() => onExport("pdf")} title="PDF для печати">
            {busy === "exp-pdf" ? "..." : "PDF"}
          </button>
          <button type="button" className="btn btn-outline" disabled={Boolean(busy)} onClick={() => onExport("docx")} title="Word (.docx)">
            {busy === "exp-docx" ? "..." : "DOCX"}
          </button>
          <button type="button" className="btn btn-outline" disabled={Boolean(busy)} onClick={() => onExport("latex")} title="Исходник .tex">
            {busy === "exp-latex" ? "..." : ".tex"}
          </button>
          <button type="button" className="btn btn-outline" disabled={Boolean(busy)} onClick={() => onExport("zip")} title="ZIP с .tex и README">
            {busy === "exp-zip" ? "..." : "ZIP"}
          </button>
        </div>
      </div>

      {/* ──── Публикация ──── */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
          Поделиться
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {!isPublic && (
            <button type="button" className="btn btn-primary" disabled={Boolean(busy)} onClick={onPublish}>
              {busy === "publish" ? "Публикуем..." : "В маркетплейс"}
            </button>
          )}
          <button type="button" className="btn btn-ghost" disabled={Boolean(busy)} onClick={onDelete} style={{ color: "var(--error)" }}>
            {busy === "delete" ? "Удаляем..." : "Удалить"}
          </button>
        </div>
      </div>

      {err && (
        <div style={{ padding: "8px 12px", background: "#FEE2E2", color: "#991B1B", borderRadius: 8, fontSize: 13 }}>
          {err}
        </div>
      )}
    </div>
  );
}
