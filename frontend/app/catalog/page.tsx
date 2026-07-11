// Каталог готовых материалов фабрики: комплекты уроков, листы, зачёты.
// Фильтры — в URL (subject / kind / course), карточки — «листы на клетке».

import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { Header } from "../_components/Header";
import { formatKopecks, kitSummary, subjectName, PRODUCT_KIND_LABEL } from "@/lib/products";
import { IconFolder } from "../_components/Icons";
import { Stars } from "../_components/Stars";
import { CatalogSearch } from "./CatalogSearch";

export const dynamic = "force-dynamic";

interface Search {
  subject?: string;
  kind?: string;
  course?: string;
  q?: string;
}

function filterHref(cur: Search, patch: Partial<Search>): string {
  const merged = { ...cur, ...patch };
  const params = new URLSearchParams();
  if (merged.subject) params.set("subject", merged.subject);
  if (merged.kind) params.set("kind", merged.kind);
  if (merged.course) params.set("course", merged.course);
  if (merged.q) params.set("q", merged.q);
  const qs = params.toString();
  return qs ? `/catalog?${qs}` : "/catalog";
}

function normText(s: string): string {
  return s.toLowerCase().replace(/ё/g, "е");
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const subject = searchParams.subject === "informatics" || searchParams.subject === "math" ? searchParams.subject : undefined;
  const kind = searchParams.kind;
  const course = searchParams.course;
  const q = (searchParams.q ?? "").trim().slice(0, 120);

  const [allProducts, courses] = await Promise.all([
    prisma.product.findMany({
      where: {
        isPublished: true,
        ...(subject ? { subject } : {}),
        ...(kind ? { kind } : {}),
        ...(course ? { courseSlug: course } : {}),
      },
      include: { assets: { select: { kind: true, tier: true } } },
      orderBy: [{ courseSlug: "asc" }, { lessonNo: "asc" }, { createdAt: "asc" }],
    }),
    prisma.product.findMany({
      where: { isPublished: true, courseSlug: { not: null } },
      select: { courseSlug: true, course: true, subject: true },
      distinct: ["courseSlug"],
      orderBy: { courseSlug: "asc" },
    }),
  ]);

  // Полнотекстовый фильтр ?q= (та же логика, что /api/products/search)
  const words = q ? normText(q).split(/\s+/).filter((w) => w.length >= 2) : [];
  const products =
    words.length === 0
      ? allProducts
      : allProducts.filter((p) => {
          const hay = `${normText(p.title)} ${normText(p.course ?? "")} ${normText(p.description ?? "")}`;
          return words.every((w) => hay.includes(w));
        });

  const cur: Search = { subject, kind, course, q: q || undefined };

  const kinds = [
    ["lesson_kit", "Комплекты уроков"],
    ["course_bundle", "Курсы целиком"],
    ["worksheet", "Листы"],
    ["test", "Зачёты"],
  ] as const;

  return (
    <div className="hi" style={{ minHeight: "100vh", background: "var(--surface)" }}>
      <Header />

      {/* Шапка каталога на клетке */}
      <div className="rl2-gridpaper-fade" style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
        <div className="rl-container" style={{ paddingTop: 36, paddingBottom: 26, position: "relative" }}>
          <h1 className="rl-h2" style={{ marginBottom: 6 }}>
            Каталог материалов
          </h1>
          <p className="rl-lead" style={{ maxWidth: 640, marginBottom: 16 }}>
            Готовые комплекты уроков: презентация, рабочий лист, шпаргалка, домашняя
            работа и зачёты. Печатайте и ведите урок — а проверку мы возьмём на себя.
          </p>
          <Suspense fallback={<div className="rl-skeleton" style={{ height: 48, maxWidth: 560 }} />}>
            <CatalogSearch />
          </Suspense>
        </div>
      </div>

      <main className="rl-container" style={{ paddingTop: 20, paddingBottom: 72 }}>
        {/* Фильтры */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
          <div className="rl-scroller">
            <Link href={filterHref(cur, { subject: undefined })} className={`btn btn-sm ${!subject ? "btn-blue" : "btn-outline"}`}>
              Все предметы
            </Link>
            <Link href={filterHref(cur, { subject: "math" })} className={`btn btn-sm ${subject === "math" ? "btn-blue" : "btn-outline"}`}>
              Математика
            </Link>
            <Link
              href={filterHref(cur, { subject: "informatics" })}
              className={`btn btn-sm ${subject === "informatics" ? "btn-blue" : "btn-outline"}`}
            >
              Информатика
            </Link>
            <span style={{ width: 1, background: "var(--border-2)", margin: "4px 4px" }} />
            <Link href={filterHref(cur, { kind: undefined })} className={`btn btn-sm ${!kind ? "btn-blue" : "btn-outline"}`}>
              Все типы
            </Link>
            {kinds.map(([k, label]) => (
              <Link key={k} href={filterHref(cur, { kind: k })} className={`btn btn-sm ${kind === k ? "btn-blue" : "btn-outline"}`}>
                {label}
              </Link>
            ))}
          </div>

          {courses.length > 0 && (
            <div className="rl-scroller">
              <Link href={filterHref(cur, { course: undefined })} className={`btn btn-sm ${!course ? "btn-blue" : "btn-outline"}`}>
                Все курсы
              </Link>
              {courses
                .filter((c) => !subject || c.subject === subject)
                .map((c) => (
                  <Link
                    key={c.courseSlug}
                    href={filterHref(cur, { course: c.courseSlug! })}
                    className={`btn btn-sm ${course === c.courseSlug ? "btn-blue" : "btn-outline"}`}
                  >
                    {c.course ?? c.courseSlug}
                  </Link>
                ))}
            </div>
          )}
        </div>

        {/* Результаты поиска / счётчик */}
        {q && (
          <div className="rl-row" style={{ marginBottom: 14, gap: 10 }}>
            <span style={{ fontSize: 14.5, fontWeight: 600 }}>
              По запросу «{q}»: {products.length}{" "}
              {products.length % 10 === 1 && products.length % 100 !== 11
                ? "материал"
                : [2, 3, 4].includes(products.length % 10) && ![12, 13, 14].includes(products.length % 100)
                  ? "материала"
                  : "материалов"}
            </span>
            <Link href={filterHref(cur, { q: undefined })} className="btn btn-sm btn-ghost">
              Сбросить поиск ✕
            </Link>
          </div>
        )}

        {/* Сетка товаров */}
        {products.length === 0 ? (
          <div className="rl2-empty rl2-gridpaper" style={{ padding: 70 }}>
            <div style={{ color: "var(--fg-3)", marginBottom: 10 }}>
              <IconFolder size={34} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--fg-2)" }}>
              По этим фильтрам пока пусто
            </div>
            <div style={{ marginTop: 6 }}>
              Каталог пополняется каждую неделю — фабрика материалов работает.
            </div>
          </div>
        ) : (
          <div className="rl-grid rl-grid-3" style={{ gap: 18 }}>
            {products.map((p) => {
              const kit = kitSummary(p.assets);
              return (
                <Link key={p.id} href={`/catalog/${p.slug}`} className="rl2-product rl2-card-subject" data-subject={p.subject}>
                  <div className="rl2-product-preview rl2-gridpaper">
                    {p.previewPath ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`/api/preview/${p.id}`} alt="" loading="lazy" />
                    ) : (
                      <div className="rl2-product-paper" aria-hidden>
                        <i />
                        <i />
                        <i />
                        <i />
                        <i style={{ width: "40%" }} />
                      </div>
                    )}
                    {p.isFree && (
                      <span
                        className="rl2-tier"
                        data-tier="free"
                        style={{ position: "absolute", top: 10, left: 10 }}
                      >
                        Бесплатно
                      </span>
                    )}
                  </div>
                  <div className="rl2-product-body">
                    <div className="rl2-product-meta">
                      <span className="rl2-subject" data-subject={p.subject} style={{ marginRight: 6 }}>
                        <i className="rl2-subject-dot" />
                        {subjectName(p.subject)}
                      </span>
                      {p.course ? `${p.course}${p.lessonNo ? ` · урок ${p.lessonNo}` : ""}` : PRODUCT_KIND_LABEL[p.kind] ?? ""}
                    </div>
                    <div className="rl2-product-title">{p.title}</div>
                    {p.ratingCount > 0 && (
                      <Stars rating={p.rating} count={p.ratingCount} size={13} />
                    )}
                    {kit.length > 0 && (
                      <div className="rl2-kit">
                        {kit.map((k) => (
                          <span key={k} className="rl2-kit-chip">
                            {k}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="rl2-product-foot">
                      {p.isFree ? (
                        <span className="rl2-price rl2-price-free">0 ₽</span>
                      ) : (
                        <span className="rl2-price">
                          {formatKopecks(p.priceBasic)}
                          {p.priceSource != null && (
                            <span className="rl2-price-note"> · исходники {formatKopecks(p.priceSource)}</span>
                          )}
                        </span>
                      )}
                      <span className="btn btn-sm btn-outline" aria-hidden>
                        Открыть
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <p className="muted" style={{ fontSize: 13, marginTop: 28 }}>
          Листы сообщества, сгенерированные учителями, — в разделе{" "}
          <Link href="/marketplace" style={{ color: "var(--primary)" }}>
            Маркетплейс листов
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
