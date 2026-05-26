"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  worksheetId: string;
  hasPdf: boolean;
  pdfPath: string | null;
  isPublic: boolean;
};

export function WorksheetActions({ worksheetId, hasPdf, pdfPath, isPublic }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function call(path: string, body?: Record<string, unknown>, method: "POST" | "DELETE" = "POST"): Promise<Response> {
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
      if (!r.ok) {
        setErr("Не удалось создать вариант");
      } else {
        router.refresh();
      }
    } finally {
      setBusy(null);
    }
  }

  async function onHarder(): Promise<void> {
    setBusy("harder");
    setErr(null);
    try {
      const r = await call(`/api/worksheets/${worksheetId}/harder`, { complexityStep: 2 });
      if (!r.ok) {
        setErr("Не удалось создать усложнённый вариант");
      } else {
        router.refresh();
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
      if (!r.ok) {
        setErr("Не удалось опубликовать");
      } else {
        router.refresh();
      }
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {hasPdf ? (
          <a
            href={pdfPath ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-blue"
          >
            Скачать PDF
          </a>
        ) : (
          <span
            title="PDF будет готов после подключения LLM утром"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "10px 16px",
              minHeight: 40,
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              background: "var(--surface-2)",
              color: "var(--fg-3)",
              cursor: "not-allowed",
            }}
          >
            PDF (в работе)
          </span>
        )}
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
        {!isPublic && (
          <button
            type="button"
            className="btn btn-primary"
            disabled={Boolean(busy)}
            onClick={onPublish}
          >
            {busy === "publish" ? "Публикуем..." : "Опубликовать"}
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
