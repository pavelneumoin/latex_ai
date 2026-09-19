"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { IconSearch, IconLibrary, IconFolder, IconArrowRight, IconPresentation, IconFile, IconFilter, IconX, IconBookmark } from "../_components/Icons";
import { kitSummary, subjectName } from "@/lib/products";
import { scoreProductSearch } from "@/lib/product-search";

export interface CatalogItem {
  id: string; slug: string; title: string; description: string | null; subject: string;
  course: string | null; courseSlug: string | null; audience: string | null; kind: string;
  isFree: boolean; priceBasic: number; previewPath: string | null; createdAt: string;
  assets: { kind: string; tier: string }[];
}

export function CatalogView({ products }: { products: CatalogItem[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const subject = params.get("subject") ?? "";
  const course = params.get("course") ?? "";
  const audience = params.get("audience") ?? "";
  const format = params.get("format") ?? "";
  const sort = params.get("sort") ?? "new";
  useEffect(() => setQuery(params.get("q") ?? ""), [params]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); input.current?.focus(); } };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  function update(patch: Record<string, string>) {
    const next = new URLSearchParams(params.toString());
    if (query.trim()) next.set("q", query.trim()); else next.delete("q");
    for (const [key, value] of Object.entries(patch)) value ? next.set(key, value) : next.delete(key);
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  }
  function reset() { setQuery(""); router.replace(pathname, { scroll: false }); }
  const base = products.filter(p => !subject || p.subject === subject);
  const courses = Array.from(new Map(base.filter(p => p.courseSlug).map(p => [p.courseSlug!, p.course!])).entries());
  const audiences = Array.from(new Set(base.flatMap(p => p.audience ? [p.audience] : [])));
  const visible = base.filter(p => (!course || p.courseSlug === course) && (!audience || p.audience === audience) && (!format || p.assets.some(a => a.kind === format)) && (!query.trim() || scoreProductSearch(p, query) != null))
    .sort((a, b) => sort === "title" ? a.title.localeCompare(b.title, "ru") : sort === "relevance" && query.trim() ? (scoreProductSearch(b, query) ?? 0) - (scoreProductSearch(a, query) ?? 0) : b.createdAt.localeCompare(a.createdAt));
  const filtered = !!(subject || course || audience || format || query);
  return (
    <main className="library-layout">
      <aside className={`library-sidebar ${filtersOpen ? "is-open" : ""}`} aria-label="Навигация по материалам">
        <div className="sidebar-label">БИБЛИОТЕКА</div>
        <button className={`side-link ${!subject ? "active" : ""}`} onClick={() => update({ subject: "", course: "", audience: "" })}><IconLibrary size={19} />Все материалы<span>{products.length}</span></button>
        <div className="sidebar-label">ПРЕДМЕТЫ</div>
        {[["math", "Математика", "∑"], ["informatics", "Информатика", "⌘"]].map(([id, name, symbol]) => <button key={id} className={`side-link ${subject === id ? "active" : ""}`} onClick={() => update({ subject: id, course: "", audience: "" })}><i className={`subject-symbol ${id}`}>{symbol}</i>{name}<span>{products.filter(p => p.subject === id).length}</span></button>)}
        <div className="sidebar-rule" />
        <label className="filter-label" htmlFor="class-filter">Класс и экзамен</label>
        <select id="class-filter" value={audience} onChange={e => update({ audience: e.target.value })}><option value="">Все классы</option>{audiences.map(a => <option key={a}>{a}</option>)}</select>
        <label className="filter-label" htmlFor="topic-filter">Тема</label>
        <select id="topic-filter" value={course} onChange={e => update({ course: e.target.value })}><option value="">Все темы</option>{courses.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>
        <div className="sidebar-rule" /><Link className="side-link" href="/materials"><IconFolder size={19} />По заданиям ЕГЭ<IconArrowRight size={15} /></Link>
        <Link className="side-link" href="/cabinet/library"><IconBookmark size={19} />Моя библиотека<IconArrowRight size={15} /></Link>
        <div className="sidebar-note"><span>Больше времени<br />на сам урок.</span><p>Выбирайте материалы,<br />которые подходят вашему классу.</p></div>
      </aside>

      <div className="library-main">
        <div className="library-breadcrumb">Библиотека <span>/</span> {subject ? subjectName(subject) : "Все материалы"}</div>
        <section className="library-hero">
          <div className="hero-copy"><span className="eyebrow">СОБРАНО ДЛЯ ВАШЕГО УРОКА</span><h1>Хороший урок начинается<br />с хороших материалов<span>.</span></h1><p>Презентации, рабочие листы и домашние задания.<br />Всё по одной теме — в одном комплекте.</p><a href="#materials" className="hero-link">Найти свой комплект <IconArrowRight size={18} /></a></div>
          <div className="hero-papers" aria-hidden="true"><div className="paper-back" /><div className="paper-sheet"><small>РАБОЧИЙ ЛИСТ</small><b>От идеи<br />к пониманию.</b><div className="paper-orbit"><i /><span>π</span></div><div className="paper-lines" /></div><span className="paper-tag"><IconCheckMark /> Готово к уроку</span></div>
        </section>
        <section id="materials" className="materials-section">
          <div className="catalog-heading"><div><span className="eyebrow">ВАША МЕТОДИЧЕСКАЯ ПОЛКА</span><h2>{subject ? subjectName(subject) : "Каталог материалов"}</h2></div><button className="filter-toggle" aria-expanded={filtersOpen} onClick={() => setFiltersOpen(!filtersOpen)}><IconFilter size={17} />Фильтры</button></div>
          <form className="library-search" onSubmit={e => { e.preventDefault(); update({ q: query.trim() }); }}><IconSearch size={21} /><input ref={input} aria-label="Поиск материалов" placeholder="Тема урока, номер задания или название…" value={query} maxLength={120} onChange={e => setQuery(e.target.value)} />{query ? <button type="button" aria-label="Очистить поиск" onClick={() => {setQuery(""); update({q:""});}}><IconX size={16} /></button> : <kbd>Ctrl K</kbd>}<button type="submit" className="search-submit">Найти</button></form>
          <div className="format-tabs" aria-label="Формат материала">{[["", "Все форматы"], ["presentation_pdf", "Презентации"], ["worksheet_pdf", "Рабочие листы"], ["homework_pdf", "Домашние задания"], ["test_pdf", "Проверочные работы"]].map(([id, name]) => <button key={id} aria-pressed={format === id} className={format === id ? "active" : ""} onClick={() => update({ format: id })}>{name}</button>)}</div>
          <div className="catalog-toolbar"><span role="status" aria-live="polite">Комплектов: <strong>{visible.length}</strong>{filtered && <button className="reset-filters" onClick={reset}>Сбросить фильтры <IconX size={12} /></button>}</span><label>Порядок: <select aria-label="Сортировка" value={sort} onChange={e => update({ sort: e.target.value })}><option value="new">Сначала новые</option><option value="title">По названию</option><option value="relevance">По совпадению</option></select></label></div>
          {visible.length > 0 ? <div className="material-grid">{visible.map(p => <Link href={`/catalog/${p.slug}`} key={p.id} className={`material-card ${p.subject}`}><div className="material-cover"><span className="cover-subject">{subjectName(p.subject)}</span>{p.previewPath ? <img src={`/api/preview/${p.id}`} alt={`Превью комплекта «${p.title}»`} loading="lazy" /> : <div className="cover-placeholder"><IconFolder size={56} /></div>}<span className="cover-format">КОМПЛЕКТ УРОКА</span></div><div className="material-card-body"><div className="material-meta">{p.audience || subjectName(p.subject)}{p.course && <><span>·</span>{p.course}</>}</div><h3>{p.title}</h3><div className="material-parts">{kitSummary(p.assets).map(k => <span key={k}>{k}</span>)}</div><div className="material-card-foot"><span>{p.isFree ? "PDF бесплатно" : "По подписке"}</span><b>Смотреть комплект <IconArrowRight size={17} /></b></div></div></Link>)}</div> : <div className="library-empty"><IconFolder size={42} /><h3>{products.length ? "Такого комплекта пока нет" : "Первый комплект уже на подходе"}</h3><p>{products.length ? "Попробуйте другую тему или уберите часть фильтров." : "Здесь появятся материалы, превью страниц и файлы для урока."}</p>{filtered && <button className="btn btn-outline" onClick={reset}>Показать все материалы</button>}</div>}
        </section>
        <section className="library-how"><div><IconFolder size={21} /><span><b>Выберите тему</b><small>По предмету, классу или заданию</small></span></div><div><IconPresentation size={21} /><span><b>Посмотрите внутри</b><small>Изучите страницы до скачивания</small></span></div><div><IconFile size={21} /><span><b>Используйте на уроке</b><small>На экране или в печатном виде</small></span></div></section>
        <footer className="library-footer"><span>Неумошка · Материалы для учителей</span><div><Link href="/offer">Оферта</Link><Link href="/privacy">Конфиденциальность</Link></div></footer>
      </div>
    </main>
  );
}
function IconCheckMark() { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="m3 8 3 3 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
