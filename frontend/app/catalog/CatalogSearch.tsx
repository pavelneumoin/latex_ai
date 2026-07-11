"use client";

// Поиск по каталогу: живые подсказки (дебаунс 250 мс) + переход к полной выдаче ?q=.

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { IconSearch } from "@/app/_components/Icons";

interface Hit {
  slug: string;
  title: string;
  course: string | null;
  subject: string;
  lessonNo: number | null;
  kind: string;
  isFree: boolean;
  priceBasic: number;
  rating: number;
  ratingCount: number;
}

function rub(k: number): string {
  return `${Math.round(k / 100).toLocaleString("ru-RU")} ₽`;
}

export function CatalogSearch() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Живые подсказки
  useEffect(() => {
    if (q.trim().length < 2) {
      setHits(null);
      return;
    }
    const t = setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        const res = await fetch(
          `/api/products/search?q=${encodeURIComponent(q.trim())}&limit=7`,
          { signal: ctrl.signal }
        );
        const data = await res.json();
        setHits(data.results ?? []);
        setOpen(true);
        setActive(-1);
      } catch {
        // aborted — ок
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  // Клик мимо — закрыть
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function goFull() {
    setOpen(false);
    const usp = new URLSearchParams(params.toString());
    if (q.trim()) usp.set("q", q.trim());
    else usp.delete("q");
    router.push(`/catalog?${usp.toString()}`);
  }

  function onKey(e: React.KeyboardEvent) {
    if (!open || !hits?.length) {
      if (e.key === "Enter") goFull();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, hits.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0) {
        setOpen(false);
        router.push(`/catalog/${hits[active].slug}`);
      } else {
        goFull();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={boxRef} style={{ position: "relative", maxWidth: 560 }}>
      <div style={{ position: "relative" }}>
        <span
          style={{
            position: "absolute",
            left: 14,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--fg-3)",
            display: "inline-flex",
            pointerEvents: "none",
          }}
        >
          <IconSearch size={17} />
        </span>
        <input
          className="rl-input"
          style={{ paddingLeft: 42, minHeight: 48, fontSize: 15, boxShadow: "var(--shadow-sm)" }}
          placeholder="Поиск: «вероятность», «логарифмы», «параметры»…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => hits && setOpen(true)}
          onKeyDown={onKey}
          type="search"
          aria-label="Поиск по материалам"
        />
      </div>

      {open && hits && (
        <div
          className="card"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 40,
            padding: 6,
            boxShadow: "var(--shadow-lg)",
            maxHeight: 420,
            overflowY: "auto",
          }}
          role="listbox"
        >
          {hits.length === 0 ? (
            <div style={{ padding: "14px 12px", fontSize: 13.5, color: "var(--fg-3)" }}>
              Ничего не нашлось. Попробуйте иначе: «производная», «неравенства», «векторы».
            </div>
          ) : (
            <>
              {hits.map((h, i) => (
                <Link
                  key={h.slug}
                  href={`/catalog/${h.slug}`}
                  onClick={() => setOpen(false)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    padding: "9px 10px",
                    borderRadius: 8,
                    textDecoration: "none",
                    background: i === active ? "var(--primary-soft)" : "transparent",
                  }}
                  onMouseEnter={() => setActive(i)}
                >
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {h.kind === "course_bundle" ? "Курс: " : h.lessonNo ? `Урок ${h.lessonNo}. ` : ""}
                      {h.title}
                    </span>
                    <span style={{ display: "block", fontSize: 11.5, color: "var(--fg-3)" }}>
                      {h.course ?? (h.subject === "informatics" ? "Информатика" : "Математика")}
                      {h.ratingCount > 0 ? ` · ★ ${h.rating.toFixed(1)}` : ""}
                    </span>
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: h.isFree ? "var(--success)" : "var(--fg)", whiteSpace: "nowrap" }}>
                    {h.isFree ? "0 ₽" : rub(h.priceBasic)}
                  </span>
                </Link>
              ))}
              <button
                type="button"
                onClick={goFull}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "9px 10px",
                  border: "none",
                  borderTop: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--primary)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "var(--body)",
                }}
              >
                Показать все результаты «{q.trim()}» →
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
