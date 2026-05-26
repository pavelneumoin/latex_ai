"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  publicationId: string;
  price: number;
  pdfPath: string | null;
  loggedIn: boolean;
};

export function PublicationActions({ publicationId, price, pdfPath, loggedIn }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onFavorite(): Promise<void> {
    if (!loggedIn) {
      router.push("/login?callbackUrl=/marketplace/" + publicationId);
      return;
    }
    setBusy("favorite");
    setErr(null);
    setMsg(null);
    try {
      const r = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicationId }),
      });
      if (!r.ok) {
        setErr("Не удалось сохранить в избранное");
      } else {
        setMsg("Сохранено в избранное");
      }
    } catch {
      setErr("Не удалось сохранить");
    } finally {
      setBusy(null);
    }
  }

  async function onBuy(): Promise<void> {
    if (!loggedIn) {
      router.push("/login?callbackUrl=/marketplace/" + publicationId);
      return;
    }
    setMsg("Покупка отдельных листов появится в v1.1. Пока — подключите тариф Pro.");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          type="button"
          className="btn btn-outline"
          disabled={Boolean(busy)}
          onClick={onFavorite}
        >
          {busy === "favorite" ? "Сохраняем..." : "Сохранить себе"}
        </button>

        {price === 0 ? (
          pdfPath ? (
            <a
              href={pdfPath}
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
          )
        ) : (
          <button type="button" className="btn btn-primary" onClick={onBuy}>
            Купить за {Math.round(price / 100)} ₽
          </button>
        )}
      </div>
      {msg && (
        <div
          style={{
            padding: "8px 12px",
            background: "#D1FAE5",
            color: "#065F46",
            borderRadius: 8,
            fontSize: 13,
          }}
        >
          {msg}
        </div>
      )}
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
