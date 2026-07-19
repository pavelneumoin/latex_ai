// Лендинг v2 «Тетрадь в клетку»: маркетплейс готовых материалов + кабинет с автопроверкой.

import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { Header } from "./_components/Header";
import { formatKopecks, kitSummary, subjectName } from "@/lib/products";
import { IconFolder, IconPrinter, IconCamera, IconChart } from "./_components/Icons";
import { CatalogSearch } from "./catalog/CatalogSearch";
import { FEATURES } from "@/lib/features";

export const dynamic = "force-dynamic";

export default async function Landing() {
  // Витрина: до 6 опубликованных материалов (бесплатные вперёд)
  const showcase = await prisma.product.findMany({
    where: { isPublished: true, kind: "lesson_kit" },
    include: { assets: { select: { kind: true, tier: true } } },
    orderBy: [{ courseSlug: "asc" }, { lessonNo: "asc" }],
    take: 6,
  });

  return (
    <div className="hi" style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--fg)" }}>
      <Header />

      {/* Поиск — первое действие после входа на сайт. */}
      <section
        className="rl2-gridpaper-fade"
        style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="rl-container" style={{ paddingTop: 20, paddingBottom: 20, position: "relative" }}>
          <Suspense fallback={<div className="rl-skeleton" style={{ height: 48, maxWidth: 560 }} />}>
            <CatalogSearch />
          </Suspense>
        </div>
      </section>

      {/* ============ ВИТРИНА ============ */}
      {showcase.length > 0 && (
        <section style={{ background: "var(--surface)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
          <div className="rl-container" style={{ paddingTop: 24, paddingBottom: 52 }}>
            <div className="rl-row-between" style={{ marginBottom: 20 }}>
              <h1 className="rl-h2">Материалы</h1>
              <Link href="/catalog" style={{ color: "var(--primary)", fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
                Весь каталог →
              </Link>
            </div>
            <div className="rl-grid rl-grid-3" style={{ gap: 18 }}>
              {showcase.map((p) => {
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
                          <i style={{ width: "40%" }} />
                        </div>
                      )}
                      {p.isFree && (
                        <span className="rl2-tier" data-tier="free" style={{ position: "absolute", top: 10, left: 10 }}>
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
                        {p.course ?? ""}
                      </div>
                      <div className="rl2-product-title">{p.title}</div>
                      {kit.length > 0 && (
                        <div className="rl2-kit">
                          {kit.slice(0, 4).map((k) => (
                            <span key={k} className="rl2-kit-chip">
                              {k}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="rl2-product-foot">
                        {p.isFree ? (
                          <span className="rl2-price rl2-price-free">Бесплатно</span>
                        ) : (
                          <span className="rl2-price">{formatKopecks(p.priceBasic)}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ============ КАК РАБОТАЕТ ============ */}
      <section className="rl-container" style={{ paddingTop: 56, paddingBottom: 56 }}>
        <h2 className="rl-h2" style={{ textAlign: "center", marginBottom: 8 }}>
          Урок за 4 шага
        </h2>
        <p className="rl-lead" style={{ textAlign: "center", maxWidth: 560, margin: "0 auto 34px" }}>
          От выбора материала до отметок в журнале — без вечера за проверкой тетрадей.
        </p>
        <div className="rl-grid rl-grid-4" style={{ gap: 16 }}>
          {[
            {
              n: "1",
              icon: <IconFolder size={24} />,
              title: "Выберите комплект",
              text: "Презентация, рабочий лист и ДЗ — единый стиль, выверенные задачи с ключами.",
            },
            {
              n: "2",
              icon: <IconPrinter size={24} />,
              title: "Напечатайте и проведите",
              text: "PDF готов к печати. В подписке «Всё включено» — исходники, правьте под класс.",
            },
            {
              n: "3",
              icon: <IconCamera size={24} />,
              title: "Загрузите работы",
              text: "Фото или PDF пачкой в кабинет. Баллы, проценты и отметки по вашей шкале — автоматически.",
            },
            {
              n: "4",
              icon: <IconChart size={24} />,
              title: "Получите отчёт",
              text: "Красивый PDF со статистикой класса: распределение отметок, западающие задания.",
            },
          ].map((s) => (
            <div key={s.n} className="card" style={{ padding: 20 }}>
              <div style={{ color: "var(--primary)", marginBottom: 12 }}>{s.icon}</div>
              <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
                <span style={{ color: "var(--primary)", marginRight: 6 }}>{s.n}.</span>
                {s.title}
              </div>
              <p className="muted-2" style={{ fontSize: 13.5, lineHeight: 1.5 }}>
                {s.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ УРОВНИ ============ */}
      <section style={{ background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
        <div className="rl-container" style={{ paddingTop: 52, paddingBottom: 56 }}>
          <h2 className="rl-h2" style={{ textAlign: "center", marginBottom: 8 }}>
            Бесплатно — и по подписке
          </h2>
          <p className="rl-lead" style={{ textAlign: "center", maxWidth: 560, margin: "0 auto 30px" }}>
            Готовые PDF отдаём бесплатно. Платим только за то, чего нет ни у кого, —
            редактируемые исходники профессиональной вёрстки.
          </p>
          <div className="rl-grid rl-grid-2" style={{ gap: 18, maxWidth: 860, margin: "0 auto" }}>
            <div className="card" style={{ padding: 24 }}>
              <span className="rl2-tier" data-tier="basic">
                PDF
              </span>
              <h3 style={{ margin: "12px 0 8px" }}>Печатай и веди</h3>
              <p className="muted-2" style={{ fontSize: 14, lineHeight: 1.55 }}>
                Все PDF комплекта: презентация для доски, рабочий лист с клеткой до низа
                страницы и домашнее задание с ключами. Скачивайте и печатайте без ограничений.
              </p>
              <div className="rl2-price rl2-price-free" style={{ marginTop: 14 }}>
                Бесплатно
              </div>
            </div>
            <div className="card" style={{ padding: 24, border: "2px solid var(--accent)" }}>
              <span className="rl2-tier" data-tier="source">
                Marp-исходники
              </span>
              <h3 style={{ margin: "12px 0 8px" }}>Правь под себя</h3>
              <p className="muted-2" style={{ fontSize: 14, lineHeight: 1.55 }}>
                По подписке — исходники: презентация в Marp (обычный Markdown), листы в LaTeX.
                Меняйте числа и фамилии, пересобирайте варианты — комплект становится вашим.
              </p>
              <div className="rl2-price" style={{ marginTop: 14 }}>
                по подписке <span className="rl2-price-note">от 290 ₽/мес</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ ПОДПИСКИ ============ */}
      <section className="rl-container" style={{ paddingTop: 52, paddingBottom: 56 }}>
        <h2 className="rl-h2" style={{ textAlign: "center", marginBottom: 30 }}>
          Подписки — раздельные по предметам
        </h2>
        <div className="rl-grid rl-grid-3" style={{ gap: 16, maxWidth: 980, margin: "0 auto" }}>
          {[
            {
              name: "Математика",
              price: "290 ₽/мес",
              subject: "math",
              text: "Marp-исходники по математике + 300 автопроверок",
            },
            {
              name: "Информатика",
              price: "290 ₽/мес",
              subject: "informatics",
              text: "Marp-исходники по информатике + 300 автопроверок",
            },
            {
              name: "Всё включено",
              price: "490 ₽/мес",
              subject: "",
              text: "Оба предмета + исходники Marp/LaTeX + безлимит проверок",
              hot: true,
            },
          ].map((p) => (
            <Link
              key={p.name}
              href="/pricing"
              className="card card-hover"
              style={{
                padding: 22,
                textDecoration: "none",
                border: p.hot ? "2px solid var(--primary)" : "1px solid var(--border)",
              }}
            >
              <div className="rl-row-between">
                <span style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: 18 }}>{p.name}</span>
                {p.subject && (
                  <span className="rl2-subject" data-subject={p.subject}>
                    <i className="rl2-subject-dot" />
                  </span>
                )}
              </div>
              <div className="rl2-price" style={{ fontSize: 24, margin: "10px 0 6px" }}>
                {p.price}
              </div>
              <p className="muted-2" style={{ fontSize: 13.5 }}>{p.text}</p>
            </Link>
          ))}
        </div>
        <p style={{ textAlign: "center", marginTop: 22 }}>
          <Link href="/pricing" className="btn btn-blue">
            Все тарифы и цены →
          </Link>
        </p>
      </section>

      {/* ============ КОНСТРУКТОР (вторичное) ============ */}
      <section style={{ background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
        <div className="rl-container" style={{ paddingTop: 44, paddingBottom: 48 }}>
          <div className="rl-hero">
            <div>
              <h2 className="rl-h2" style={{ marginBottom: 10 }}>
                Нужен лист по своей теме?
              </h2>
              <p className="rl-lead" style={{ marginBottom: 18 }}>
                Конструктор соберёт рабочий лист по описанию или фотографии страницы
                учебника: 35 шаблонов вёрстки, экспорт в PDF, DOCX и LaTeX.
              </p>
              <Link href="/create" className="btn btn-outline btn-lg">
                Открыть конструктор
              </Link>
            </div>
            <div className="rl2-gridpaper" style={{ borderRadius: 16, border: "1px solid var(--border)", minHeight: 180, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
              <div className="rl2-product-paper rl-float" style={{ width: "44%" }} aria-hidden>
                <i />
                <i />
                <i />
                <i style={{ width: "40%" }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer style={{ borderTop: "1px solid var(--border)", background: "var(--bg)" }}>
        <div className="rl-container" style={{ paddingTop: 34, paddingBottom: 40 }}>
          <div className="rl-row-between" style={{ alignItems: "flex-start", gap: 24 }}>
            <div>
              <div style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: 16, marginBottom: 6 }}>
                РабочийЛист.ai
              </div>
              <p className="muted" style={{ fontSize: 12.5, maxWidth: 320 }}>
                Материалы для учителей математики и информатики: комплекты уроков,
                автопроверка работ, отчёты. Российские сервисы: ЮKassa, Yandex Cloud.
              </p>
            </div>
            <div className="rl-row" style={{ gap: 24, fontSize: 13.5 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <b style={{ fontFamily: "var(--display)" }}>Разделы</b>
                <Link href="/catalog" style={{ color: "var(--fg-2)", textDecoration: "none" }}>Каталог</Link>
                <Link href="/pricing" style={{ color: "var(--fg-2)", textDecoration: "none" }}>Тарифы</Link>
                <Link href="/create" style={{ color: "var(--fg-2)", textDecoration: "none" }}>Конструктор</Link>
                {FEATURES.teacherMarketplace ? (
                  <Link href="/marketplace" style={{ color: "var(--fg-2)", textDecoration: "none" }}>
                    Листы учителей
                  </Link>
                ) : (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--fg-3)" }}>
                    Листы учителей
                    <small style={{ padding: "2px 5px", borderRadius: 999, background: "var(--accent-soft)", color: "#92400E", fontSize: 9, fontWeight: 700 }}>
                      В разработке
                    </small>
                  </span>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <b style={{ fontFamily: "var(--display)" }}>Документы</b>
                <Link href="/offer" style={{ color: "var(--fg-2)", textDecoration: "none" }}>Оферта</Link>
                <Link href="/privacy" style={{ color: "var(--fg-2)", textDecoration: "none" }}>Конфиденциальность</Link>
                <Link href="/terms" style={{ color: "var(--fg-2)", textDecoration: "none" }}>Условия</Link>
              </div>
            </div>
          </div>
          <p className="muted" style={{ fontSize: 12, marginTop: 22 }}>
            © {new Date().getFullYear()} РабочийЛист.ai
          </p>
        </div>
      </footer>
    </div>
  );
}
