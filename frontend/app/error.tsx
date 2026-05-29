"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Логируем в консоль браузера; серверные ошибки уже в pm2-логах.
    console.error("[app error]", error);
  }, [error]);

  return (
    <div
      className="hi"
      style={{
        minHeight: "100vh",
        background: "var(--surface)",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 460 }}>
        <div style={{ fontSize: 56, marginBottom: 8 }}>⚠️</div>
        <h1 style={{ marginBottom: 10 }}>Что-то пошло не так</h1>
        <p className="muted-2" style={{ fontSize: 15, marginBottom: 8 }}>
          Произошла ошибка при загрузке страницы. Мы уже записали её — попробуйте ещё раз.
        </p>
        {error?.digest && (
          <p className="muted" style={{ fontSize: 12, marginBottom: 24, fontFamily: "monospace" }}>
            код: {error.digest}
          </p>
        )}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button type="button" onClick={reset} className="btn btn-blue btn-lg">
            Попробовать снова
          </button>
          <Link href="/" className="btn btn-outline btn-lg">
            На главную
          </Link>
        </div>
      </div>
    </div>
  );
}
