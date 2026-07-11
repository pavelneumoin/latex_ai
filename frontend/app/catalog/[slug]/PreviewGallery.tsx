"use client";

// Галерея предпросмотра: крупная страница + миниатюры (страницы презентации/листа/шпаргалки).

import { useCallback, useEffect, useState } from "react";

export function PreviewGallery({
  productId,
  pageCount,
  title,
  labels,
}: {
  productId: string;
  pageCount: number; // сколько страниц в previewPagesJson
  title: string;
  labels: string[]; // подпись каждой страницы («Слайд 1», «Лист» …)
}) {
  const [idx, setIdx] = useState(0);
  const [zoom, setZoom] = useState(false);

  const prev = useCallback(() => setIdx((i) => (i - 1 + pageCount) % pageCount), [pageCount]);
  const next = useCallback(() => setIdx((i) => (i + 1) % pageCount), [pageCount]);

  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoom(false);
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [zoom, prev, next]);

  if (pageCount === 0) return null;

  const src = (i: number) => `/api/preview/${productId}?p=${i}`;

  return (
    <div style={{ marginBottom: 24 }}>
      <div
        className="rl2-gridpaper"
        style={{
          borderRadius: 16,
          border: "1px solid var(--border)",
          background: "var(--bg)",
          padding: "clamp(12px, 3vw, 24px)",
          position: "relative",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src(idx)}
          alt={`${title} — предпросмотр ${idx + 1} из ${pageCount}`}
          onClick={() => setZoom(true)}
          style={{
            display: "block",
            width: "100%",
            maxHeight: 560,
            objectFit: "contain",
            borderRadius: 8,
            boxShadow: "var(--shadow-lg)",
            cursor: "zoom-in",
            background: "white",
          }}
        />
        {pageCount > 1 && (
          <>
            <GalleryArrow side="left" onClick={prev} />
            <GalleryArrow side="right" onClick={next} />
          </>
        )}
        <span
          style={{
            position: "absolute",
            bottom: 14,
            right: 16,
            background: "rgba(28,25,23,0.72)",
            color: "white",
            fontSize: 11.5,
            fontWeight: 600,
            padding: "3px 9px",
            borderRadius: 999,
          }}
        >
          {labels[idx] ?? ""} · {idx + 1}/{pageCount}
        </span>
      </div>

      {/* Миниатюры */}
      {pageCount > 1 && (
        <div className="rl-scroller" style={{ marginTop: 10 }}>
          {Array.from({ length: pageCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIdx(i)}
              style={{
                border: i === idx ? "2px solid var(--primary)" : "1px solid var(--border)",
                borderRadius: 8,
                padding: 2,
                background: "white",
                cursor: "pointer",
                flex: "0 0 auto",
              }}
              aria-label={`Страница ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src(i)}
                alt=""
                loading="lazy"
                style={{ width: 74, height: 52, objectFit: "cover", objectPosition: "top", borderRadius: 5, display: "block" }}
              />
            </button>
          ))}
        </div>
      )}

      {/* Лайтбокс */}
      {zoom && (
        <div
          onClick={() => setZoom(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(28,25,23,0.88)",
            zIndex: 90,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            cursor: "zoom-out",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src(idx)}
            alt=""
            style={{ maxWidth: "96vw", maxHeight: "94vh", borderRadius: 8, boxShadow: "var(--shadow-lg)" }}
          />
          {pageCount > 1 && (
            <>
              <GalleryArrow side="left" onClick={(e) => { e.stopPropagation(); prev(); }} fixed />
              <GalleryArrow side="right" onClick={(e) => { e.stopPropagation(); next(); }} fixed />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function GalleryArrow({
  side,
  onClick,
  fixed,
}: {
  side: "left" | "right";
  onClick: (e: React.MouseEvent) => void;
  fixed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Назад" : "Вперёд"}
      style={{
        position: fixed ? "fixed" : "absolute",
        top: "50%",
        transform: "translateY(-50%)",
        [side]: 14,
        width: 38,
        height: 38,
        borderRadius: 999,
        border: "1px solid var(--border)",
        background: "rgba(253,252,250,0.94)",
        color: "var(--fg)",
        cursor: "pointer",
        fontSize: 17,
        fontWeight: 700,
        display: "grid",
        placeItems: "center",
        boxShadow: "var(--shadow-md)",
        zIndex: 91,
      } as React.CSSProperties}
    >
      {side === "left" ? "‹" : "›"}
    </button>
  );
}
