// Лендинг v2 «Тетрадь в клетку»: маркетплейс готовых материалов + кабинет с автопроверкой.

import Link from "next/link";
import { prisma } from "@/lib/db";
import { Header } from "./_components/Header";
import { formatKopecks, kitSummary, subjectName } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function Landing() {
  // Витрина: до 6 опубликованных материалов (бесплатные вперёд)
  const showcase = await prisma.product.findMany({
    where: { isPublished: true, kind: { in: ["lesson_kit", "course_bundle"] } },
    include: { assets: { select: { kind: true, tier: true } } },
    orderBy: [{ isFree: "desc" }, { courseSlug: "asc" }, { lessonNo: "asc" }],
    take: 6,
  });

  return (
    <div className="hi" style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--fg)" }}>
      <Header />

      {/* ============ HERO на клетке ============ */}
      <section className="rl2-gridpaper-fade" style={{ position: "relative" }}>
        <div
          className="rl-container"
          style={{
            paddingTop: "clamp(44px, 7vw, 84px)",
            paddingBottom: "clamp(40px, 6vw, 64px)",
            position: "relative",
            textAlign: "center",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 12px",
              borderRadius: 999,
              background: "var(--accent-soft)",
              color: "#92400E",
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 20,
            }}
          >
            ⚡ Мягкие цены старта: уроки от 0 ₽, подписка от 290 ₽
          </span>
          <h1 className="rl-h1" style={{ marginBottom: 18, maxWidth: 860, marginLeft: "auto", marginRight: "auto" }}>
            Готовые уроки математики и информатики —{" "}
            <span style={{ color: "var(--primary)" }}>напечатал и ведёшь</span>
          </h1>
          <p className="rl-lead" style={{ maxWidth: 620, margin: "0 auto 28px" }}>
            Комплекты профессиональной вёрстки: презентация, рабочий лист, шпаргалка,
            домашняя работа и зачёты. А после урока — загрузите работы учеников, и{" "}
            <strong style={{ color: "var(--fg)" }}>кабинет сам посчитает отметки</strong> и
            соберёт красивый отчёт.
          </p>
          <div className="rl-row rl-stack-mobile" style={{ gap: 12, justifyContent: "center" }}>
            <Link href="/catalog" className="btn btn-primary btn-lg">
              Смотреть каталог
            </Link>
            <Link href="/cabinet/checks" className="btn btn-outline btn-lg">
              Проверка работ
            </Link>
          </div>
          <div className="rl-row" style={{ gap: 18, justifyContent: "center", marginTop: 26, fontSize: 13, color: "var(--fg-3)" }}>
            <span>✓ Первый урок курса — бесплатно</span>
            <span>✓ Покупка — навсегда</span>
            <span className="rl-desktop-only">✓ Исходники Marp / LaTeX</span>
          </div>
        </div>
      </section>

      {/* ============ ВИТРИНА ============ */}
      {showcase.length > 0 && (
        <section style={{ background: "var(--surface)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
          <div className="rl-container" style={{ paddingTop: 46, paddingBottom: 52 }}>
            <div className="rl-row-between" style={{ marginBottom: 20 }}>
              <h2 className="rl-h2">Свежее в каталоге</h2>
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
                          <span className="rl2-price rl2-price-free">0 ₽</span>
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
              icon: "🗂",
              title: "Выберите комплект",
              text: "Презентация, лист, ДЗ и зачёты — единый стиль, выверенные задачи с ключами.",
            },
            {
              n: "2",
              icon: "🖨",
              title: "Напечатайте и проведите",
              text: "PDF готов к печати. В подписке «Всё включено» — исходники, правьте под класс.",
            },
            {
              n: "3",
              icon: "📸",
              title: "Загрузите работы",
              text: "Фото или PDF пачкой в кабинет. Баллы, проценты и отметки по вашей шкале — автоматически.",
            },
            {
              n: "4",
              icon: "📊",
              title: "Получите отчёт",
              text: "Красивый PDF со статистикой класса: распределение отметок, западающие задания.",
            },
          ].map((s) => (
            <div key={s.n} className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 26, marginBottom: 10 }}>{s.icon}</div>
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
            Два уровня материалов
          </h2>
          <p className="rl-lead" style={{ textAlign: "center", maxWidth: 560, margin: "0 auto 30px" }}>
            Никто не продаёт редактируемые исходники профессиональной вёрстки. Мы — да.
          </p>
          <div className="rl-grid rl-grid-2" style={{ gap: 18, maxWidth: 860, margin: "0 auto" }}>
            <div className="card" style={{ padding: 24 }}>
              <span className="rl2-tier" data-tier="basic">
                PDF
              </span>
              <h3 style={{ margin: "12px 0 8px" }}>Печатай и веди</h3>
              <p className="muted-2" style={{ fontSize: 14, lineHeight: 1.55 }}>
                Все PDF комплекта: презентация для доски, рабочие листы с клеткой до низа
                страницы, шпаргалка, домашняя работа и два варианта зачёта с ключами.
              </p>
              <div className="rl2-price" style={{ marginTop: 14 }}>
                от 19 ₽ <span className="rl2-price-note">за элемент · комплект 49 ₽</span>
              </div>
            </div>
            <div className="card" style={{ padding: 24, border: "2px solid var(--accent)" }}>
              <span className="rl2-tier" data-tier="source">
                PDF + исходники
              </span>
              <h3 style={{ margin: "12px 0 8px" }}>Правь под себя</h3>
              <p className="muted-2" style={{ fontSize: 14, lineHeight: 1.55 }}>
                Плюс исходники: презентация в Marp (обычный Markdown), листы в LaTeX.
                Меняйте числа и фамилии, пересобирайте варианты — комплект становится вашим.
              </p>
              <div className="rl2-price" style={{ marginTop: 14 }}>
                от 49 ₽ <span className="rl2-price-note">за элемент · комплект 129 ₽</span>
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
              text: "Все PDF по математике + 300 автопроверок",
            },
            {
              name: "Информатика",
              price: "290 ₽/мес",
              subject: "informatics",
              text: "Все PDF по информатике + 300 автопроверок",
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
                <Link href="/marketplace" style={{ color: "var(--fg-2)", textDecoration: "none" }}>Листы учителей</Link>
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
