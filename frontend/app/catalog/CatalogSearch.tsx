"use client";

// Главный поиск каталога: быстрые подсказки, клавиатурная навигация и переход к полной выдаче.

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { IconArrowRight, IconSearch, IconX } from "@/app/_components/Icons";

interface Hit {
  slug: string;
  title: string;
  course: string | null;
  audience: string | null;
  subject: string;
  lessonNo: number | null;
  kind: string;
  isFree: boolean;
  priceBasic: number;
  rating: number;
  ratingCount: number;
}

const RECENT_SEARCHES_KEY = "rl-catalog-recent-searches";
const RESULTS_ID = "catalog-search-results";

function rub(kopecks: number): string {
  return `${Math.round(kopecks / 100).toLocaleString("ru-RU")} ₽`;
}

function subjectName(subject: string): string {
  return subject === "informatics" ? "Информатика" : "Математика";
}

function canSearch(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length >= 2 || /^\d$/.test(trimmed);
}

export function CatalogSearch() {
  const router = useRouter();
  const params = useSearchParams();
  const queryFromUrl = params.get("q") ?? "";
  const subject = params.get("subject") ?? "";
  const kind = params.get("kind") ?? "";
  const course = params.get("course") ?? "";

  const [q, setQ] = useState(queryFromUrl);
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [total, setTotal] = useState(0);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);

  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => setQ(queryFromUrl), [queryFromUrl]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) ?? "[]");
      if (Array.isArray(stored)) {
        setRecent(stored.filter((item): item is string => typeof item === "string").slice(0, 5));
      }
    } catch {
      // Повреждённое локальное значение просто игнорируем.
    }
  }, []);

  useEffect(() => {
    const onShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onShortcut);
    return () => document.removeEventListener("keydown", onShortcut);
  }, []);

  useEffect(() => {
    if (!canSearch(q)) {
      abortRef.current?.abort();
      setHits(null);
      setTotal(0);
      setLoading(false);
      setFailed(false);
      setActive(-1);
      return;
    }

    setOpen(true);
    setLoading(true);
    setFailed(false);
    setHits(null);

    const timeout = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const search = new URLSearchParams({ q: q.trim(), limit: "7" });
      if (subject) search.set("subject", subject);
      if (kind) search.set("kind", kind);
      if (course) search.set("course", course);

      try {
        const response = await fetch(`/api/products/search?${search.toString()}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("search_failed");
        const data = await response.json();
        setHits(data.results ?? []);
        setTotal(data.total ?? 0);
        setActive(-1);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setHits([]);
          setTotal(0);
          setFailed(true);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 220);

    return () => clearTimeout(timeout);
  }, [q, subject, kind, course]);

  useEffect(() => {
    const onDocumentMouseDown = (event: MouseEvent) => {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocumentMouseDown);
    return () => document.removeEventListener("mousedown", onDocumentMouseDown);
  }, []);

  function rememberQuery(value: string) {
    const trimmed = value.trim();
    if (!canSearch(trimmed)) return;
    const next = [trimmed, ...recent.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(0, 5);
    setRecent(next);
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
    } catch {
      // Поиск работает и без localStorage.
    }
  }

  function catalogUrl(value: string): string {
    const next = new URLSearchParams(params.toString());
    if (value.trim()) next.set("q", value.trim());
    else next.delete("q");
    const query = next.toString();
    return query ? `/catalog?${query}` : "/catalog";
  }

  function goFull(value = q) {
    setOpen(false);
    rememberQuery(value);
    router.push(catalogUrl(value));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    goFull();
  }

  function clearSearch() {
    abortRef.current?.abort();
    setQ("");
    setHits(null);
    setTotal(0);
    setLoading(false);
    setFailed(false);
    setOpen(false);
    inputRef.current?.focus();
    if (queryFromUrl) router.push(catalogUrl(""));
  }

  function useRecent(value: string) {
    setQ(value);
    goFull(value);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      if (open) setOpen(false);
      else if (q) clearSearch();
      return;
    }

    if (!open || !hits?.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, hits.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, -1));
    } else if (event.key === "Enter" && active >= 0) {
      event.preventDefault();
      const hit = hits[active];
      rememberQuery(q);
      setOpen(false);
      router.push(`/catalog/${hit.slug}`);
    }
  }

  const showRecent = open && !canSearch(q) && recent.length > 0;
  const showResults = open && canSearch(q);

  return (
    <div ref={boxRef} className="rl-catalog-search">
      <form className="rl-catalog-search-form" role="search" onSubmit={onSubmit}>
        <span className="rl-catalog-search-icon" aria-hidden>
          <IconSearch size={21} />
        </span>
        <input
          ref={inputRef}
          className="rl-catalog-search-input"
          placeholder="Тема, класс, номер задания или курс"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          onFocus={() => {
            if (canSearch(q) || recent.length > 0) setOpen(true);
          }}
          onKeyDown={onKeyDown}
          type="search"
          role="combobox"
          aria-label="Поиск по материалам"
          aria-autocomplete="list"
          aria-expanded={showRecent || showResults}
          aria-controls={RESULTS_ID}
          aria-activedescendant={showResults && active >= 0 ? `catalog-search-option-${active}` : undefined}
          autoComplete="off"
        />
        {loading && <span className="rl-catalog-search-loader" aria-label="Идёт поиск" />}
        {!q && <kbd className="rl-catalog-search-shortcut">Ctrl K</kbd>}
        {q && (
          <button
            type="button"
            className="rl-catalog-search-clear"
            onClick={clearSearch}
            aria-label="Очистить поиск"
          >
            <IconX size={18} />
          </button>
        )}
        <button type="submit" className="rl-catalog-search-submit">
          Найти
        </button>
      </form>

      {showRecent && (
        <div id={RESULTS_ID} className="rl-catalog-search-panel" role="listbox" aria-label="Недавние запросы">
          <div className="rl-catalog-search-panel-title">Недавние запросы</div>
          {recent.map((value) => (
            <button
              key={value}
              type="button"
              className="rl-catalog-search-recent"
              onClick={() => useRecent(value)}
              role="option"
              aria-selected="false"
            >
              <IconSearch size={16} />
              <span>{value}</span>
            </button>
          ))}
        </div>
      )}

      {showResults && (
        <div
          id={RESULTS_ID}
          className="rl-catalog-search-panel"
          role="listbox"
          aria-label="Подсказки поиска"
          aria-busy={loading}
        >
          {loading ? (
            <div className="rl-catalog-search-message">Ищем подходящие материалы…</div>
          ) : failed ? (
            <div className="rl-catalog-search-message">
              Не удалось выполнить поиск. Нажмите «Найти», чтобы открыть полную выдачу.
            </div>
          ) : hits?.length === 0 ? (
            <div className="rl-catalog-search-message">
              По запросу «{q.trim()}» ничего не найдено. Попробуйте убрать лишние слова.
            </div>
          ) : hits ? (
            <>
              <div className="rl-catalog-search-panel-title">
                <span>Подходящие материалы</span>
                <span>{total}</span>
              </div>
              {hits.map((hit, index) => (
                <Link
                  key={hit.slug}
                  id={`catalog-search-option-${index}`}
                  href={`/catalog/${hit.slug}`}
                  className="rl-catalog-search-result"
                  data-active={index === active ? "true" : "false"}
                  onClick={() => {
                    rememberQuery(q);
                    setOpen(false);
                  }}
                  onMouseEnter={() => setActive(index)}
                  role="option"
                  aria-selected={index === active}
                >
                  <span className="rl-catalog-search-result-mark" data-subject={hit.subject} aria-hidden>
                    {hit.subject === "informatics" ? "И" : "М"}
                  </span>
                  <span className="rl-catalog-search-result-copy">
                    <strong>
                      {hit.lessonNo ? `Урок ${hit.lessonNo}. ` : ""}
                      {hit.title}
                    </strong>
                    <small>
                      {subjectName(hit.subject)}
                      {hit.course ? ` · ${hit.course}` : ""}
                      {hit.audience ? ` · ${hit.audience}` : ""}
                    </small>
                  </span>
                  <span className="rl-catalog-search-result-price">
                    {hit.isFree ? "Бесплатно" : rub(hit.priceBasic)}
                  </span>
                </Link>
              ))}
              <button type="button" className="rl-catalog-search-all" onClick={() => goFull()}>
                <span>Показать все результаты</span>
                <IconArrowRight size={17} />
              </button>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
