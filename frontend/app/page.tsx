import Link from "next/link";
import { Header } from "./_components/Header";

export default function Landing() {
  return (
    <div className="hi" style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--fg)" }}>
      <Header />

      {/* ============ HERO ============ */}
      <section className="rl-container" style={{ paddingTop: "clamp(40px, 7vw, 80px)", paddingBottom: "clamp(40px, 7vw, 72px)" }}>
        <div className="rl-hero">
          <div className="rl-fade-up">
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
              ⚡ Бесплатно в бете
            </span>
            <h1 className="rl-h1" style={{ marginBottom: 20 }}>
              Рабочий лист
              <br />
              по любой теме{" "}
              <span style={{ color: "var(--primary)" }}>за минуту.</span>
            </h1>
            <p className="rl-lead" style={{ maxWidth: 540, marginBottom: 28 }}>
              Опиши тему — нейросеть соберёт задачи. Или просто{" "}
              <strong style={{ color: "var(--fg)" }}>сфотографируй страницу учебника</strong> — и получи
              готовый PDF с твоим лого. После урока проверь работы по фото за пару секунд.
            </p>
            <div className="rl-row rl-stack-mobile" style={{ gap: 12 }}>
              <Link href="/create" className="btn btn-primary btn-lg rl-btn-block-mobile" style={{ background: "var(--accent)", color: "var(--accent-fg)" }}>
                Создать лист →
              </Link>
              <Link href="/upload" className="btn btn-outline btn-lg rl-btn-block-mobile">
                📸 Сфоткать задание
              </Link>
            </div>
            <p style={{ marginTop: 24, color: "var(--fg-3)", fontSize: 14 }}>
              35 стилей PDF/DOCX · 8500+ задач ФИПИ · оценка 2–5 за 5 секунд
            </p>
          </div>

          {/* PDF mock */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div
              className="rl-float"
              style={{
                width: "100%",
                maxWidth: 420,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 24,
                padding: "clamp(16px, 4vw, 28px)",
                boxShadow: "var(--shadow-lg)",
              }}
            >
              <div
                style={{
                  background: "white",
                  borderRadius: 12,
                  padding: "clamp(18px, 4vw, 32px)",
                  boxShadow: "var(--shadow-md)",
                  fontFamily: '"Times New Roman", serif',
                }}
              >
                <div style={{ textAlign: "center", color: "var(--primary)", fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
                  Текстовые задачи. Движение по реке
                </div>
                <div style={{ textAlign: "center", color: "var(--fg-3)", fontSize: 12, marginBottom: 20, fontStyle: "italic" }}>
                  ЕГЭ профиль · Класс 11 · T1
                </div>
                <div style={{ borderRadius: 4, padding: 8, fontSize: 11, color: "var(--fg-3)", marginBottom: 16, border: "1px solid var(--border)" }}>
                  ФИО: ______________ Класс: ___ Дата: ____
                </div>
                {[
                  "Моторная лодка прошла против течения 112 км и вернулась, затратив на обратный путь на 6 часов меньше…",
                  "Лодка прошла 96 км по течению и обратно, потратив на путь 20 часов…",
                ].map((text, i) => (
                  <div key={i} style={{ border: "1px solid var(--primary)", borderRadius: 8, padding: 14, marginBottom: i === 0 ? 12 : 0, fontSize: 12, color: "var(--fg)", position: "relative" }}>
                    <span style={{ position: "absolute", top: -10, left: 8, background: "var(--primary)", color: "white", fontSize: 9, padding: "2px 8px", borderRadius: 3 }}>
                      Задача №{i + 1}
                    </span>
                    <div style={{ marginTop: 4, lineHeight: 1.4 }}>{text}</div>
                    <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginTop: 10, gap: 6 }}>
                      <span style={{ color: "var(--primary)", fontWeight: 600, fontSize: 11 }}>Ответ:</span>
                      <span style={{ width: 90, height: 24, border: "1px solid var(--fg-3)", borderRadius: 3, display: "inline-block" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ ТРИ ПУТИ ============ */}
      <section style={{ background: "var(--surface)", padding: "clamp(48px, 8vw, 72px) 0" }}>
        <div className="rl-container">
          <h2 className="rl-h2" style={{ textAlign: "center", marginBottom: 10 }}>
            Три способа собрать лист
          </h2>
          <p className="rl-lead" style={{ textAlign: "center", maxWidth: 600, margin: "0 auto clamp(32px, 5vw, 48px)" }}>
            Выбери, как тебе удобнее. Результат один — готовый PDF к печати за минуту.
          </p>
          <div className="rl-grid rl-grid-3">
            <PathCard
              emoji="✍️"
              title="Опиши тему"
              desc="Напиши «Линейные уравнения, 7 класс» — нейросеть придумает задачи и посчитает ответы."
              href="/create"
              cta="Описать тему"
            />
            <PathCard
              emoji="📸"
              title="Сфоткай или загрузи"
              desc="Фото страницы учебника или PDF — распознаём задачи и собираем аккуратный лист с твоим оформлением."
              href="/upload"
              cta="Загрузить фото/PDF"
              featured
            />
            <PathCard
              emoji="🏦"
              title="Возьми из банка ФИПИ"
              desc="8500+ реальных задач ЕГЭ и ОГЭ с точными ответами. Фильтр по заданию и теме."
              href="/create"
              cta="Открыть банк"
            />
          </div>
        </div>
      </section>

      {/* ============ ФОТО → ЛИСТ (ключевая фишка) ============ */}
      <section className="rl-container" style={{ padding: "clamp(48px, 8vw, 80px) 24px" }}>
        <div
          style={{
            background: "linear-gradient(135deg, var(--primary) 0%, #2D4FC8 100%)",
            borderRadius: 24,
            padding: "clamp(28px, 5vw, 48px)",
            color: "white",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "clamp(24px, 4vw, 36px)" }}>
            <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: 999, background: "rgba(255,255,255,0.18)", fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
              Главная фишка
            </span>
            <h2 className="rl-h2" style={{ color: "white", marginBottom: 10 }}>
              Сфотографировал — получил рабочий лист
            </h2>
            <p style={{ fontSize: "clamp(15px, 2.2vw, 17px)", color: "rgba(255,255,255,0.85)", maxWidth: 600, margin: "0 auto", lineHeight: 1.55 }}>
              Не нужно перепечатывать задачи из учебника. Снял на телефон — через минуту держишь
              аккуратный PDF с полями для ответов и своим лого.
            </p>
          </div>

          <div className="rl-grid rl-grid-3" style={{ gap: 16 }}>
            <FlowStep n="1" emoji="📱" title="Снимок или PDF" desc="Фото страницы, скан или готовый файл с заданиями" />
            <FlowStep n="2" emoji="🤖" title="Распознаём задачи" desc="Нейросеть вытащит условия и соберёт их в выбранный шаблон" />
            <FlowStep n="3" emoji="📄" title="Готовый лист" desc="PDF к печати: поля для ответов, шапка, твоё оформление" />
          </div>

          <div style={{ textAlign: "center", marginTop: "clamp(24px, 4vw, 36px)" }}>
            <Link
              href="/upload"
              className="btn btn-lg rl-btn-block-mobile"
              style={{ background: "white", color: "var(--primary)", fontWeight: 700 }}
            >
              Попробовать с фото →
            </Link>
          </div>
        </div>
      </section>

      {/* ============ АВТОПРОВЕРКА ============ */}
      <section style={{ background: "var(--surface)", padding: "clamp(48px, 8vw, 72px) 0" }}>
        <div className="rl-container rl-hero">
          <div>
            <span className="badge badge-success" style={{ marginBottom: 16 }}>После урока</span>
            <h2 className="rl-h2" style={{ marginBottom: 14 }}>
              Проверка работ по фото — оценки за секунды
            </h2>
            <p className="rl-lead" style={{ marginBottom: 20 }}>
              Сфотографируй заполненные бланки учеников. Сервис сверит ответы с эталоном
              и выставит оценки 2–5 по твоей шкале. Останется только перенести в журнал.
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                "Распознавание ответов с фото и сканов",
                "Гибкая шкала оценивания (по умолчанию ≥86 → 5)",
                "Таблица класса — видно, кто что не решил",
              ].map((t) => (
                <li key={t} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 15, color: "var(--fg-2)" }}>
                  <span style={{ color: "var(--success)", fontWeight: 700, flex: "0 0 auto" }}>✓</span>
                  {t}
                </li>
              ))}
            </ul>
            <Link href="/check" className="btn btn-blue btn-lg rl-btn-block-mobile">
              Как работает проверка →
            </Link>
          </div>

          {/* mini result mock */}
          <div className="card" style={{ padding: "clamp(16px, 4vw, 24px)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <strong style={{ fontFamily: "var(--display)" }}>11-А · Контрольная</strong>
              <span className="badge badge-primary">26 работ</span>
            </div>
            {[
              { name: "Иванов А.", pct: 92, grade: 5 },
              { name: "Петрова М.", pct: 78, grade: 4 },
              { name: "Сидоров К.", pct: 64, grade: 4 },
              { name: "Кузнецов И.", pct: 41, grade: 3 },
            ].map((r) => (
              <div key={r.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ flex: 1, fontSize: 14 }}>{r.name}</span>
                <div className="progress" style={{ width: 90, flex: "0 0 auto" }}>
                  <div className="progress-bar" style={{ width: `${r.pct}%`, background: r.grade >= 4 ? "var(--success)" : "var(--accent)" }} />
                </div>
                <span style={{ width: 36, textAlign: "right", fontSize: 13, color: "var(--fg-3)" }}>{r.pct}%</span>
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 700,
                    fontSize: 14,
                    background: r.grade >= 4 ? "#D1FAE5" : "var(--accent-soft)",
                    color: r.grade >= 4 ? "#065F46" : "#92400E",
                    flex: "0 0 auto",
                  }}
                >
                  {r.grade}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="rl-container" style={{ padding: "clamp(56px, 9vw, 88px) 24px", textAlign: "center" }}>
        <h2 className="rl-h2" style={{ marginBottom: 14 }}>Готовы освободить вечер?</h2>
        <p className="rl-lead" style={{ maxWidth: 520, margin: "0 auto 28px" }}>
          Соберите первый лист прямо сейчас — это бесплатно и занимает меньше минуты.
        </p>
        <div className="rl-row rl-stack-mobile" style={{ justifyContent: "center", gap: 12 }}>
          <Link href="/create" className="btn btn-primary btn-lg rl-btn-block-mobile" style={{ background: "var(--accent)", color: "var(--accent-fg)" }}>
            Создать лист →
          </Link>
          <Link href="/templates" className="btn btn-outline btn-lg rl-btn-block-mobile">
            Посмотреть 35 шаблонов
          </Link>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "32px 0" }}>
        <div className="rl-container rl-row-between" style={{ color: "var(--fg-3)", fontSize: 13 }}>
          <span>© РабочийЛист.ai · 2026</span>
          <span style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
            <a href="/offer" style={{ color: "var(--fg-3)" }}>Оферта</a>
            <a href="/privacy" style={{ color: "var(--fg-3)" }}>Конфиденциальность</a>
            <a href="/terms" style={{ color: "var(--fg-3)" }}>Соглашение</a>
          </span>
        </div>
      </footer>
    </div>
  );
}

function PathCard(props: { emoji: string; title: string; desc: string; href: string; cta: string; featured?: boolean }) {
  return (
    <Link
      href={props.href}
      className="card-hover"
      style={{
        display: "flex",
        flexDirection: "column",
        textDecoration: "none",
        background: "var(--bg)",
        border: props.featured ? "2px solid var(--accent)" : "1px solid var(--border)",
        borderRadius: "var(--radius-card)",
        padding: 24,
        boxShadow: props.featured ? "var(--shadow-md)" : "var(--shadow-sm)",
        position: "relative",
      }}
    >
      {props.featured && (
        <span style={{ position: "absolute", top: -11, left: 20, background: "var(--accent)", color: "var(--accent-fg)", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999 }}>
          ХИТ
        </span>
      )}
      <span style={{ fontSize: 34, marginBottom: 12 }}>{props.emoji}</span>
      <h3 style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 20, margin: "0 0 8px", color: "var(--fg)" }}>{props.title}</h3>
      <p style={{ color: "var(--fg-2)", fontSize: 14, lineHeight: 1.55, margin: "0 0 16px", flex: 1 }}>{props.desc}</p>
      <span style={{ color: props.featured ? "#B45309" : "var(--primary)", fontWeight: 600, fontSize: 14 }}>{props.cta} →</span>
    </Link>
  );
}

function FlowStep(props: { n: string; emoji: string; title: string; desc: string }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.12)",
        borderRadius: 16,
        padding: 20,
        border: "1px solid rgba(255,255,255,0.18)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <span style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.22)", display: "grid", placeItems: "center", fontWeight: 800, fontFamily: "var(--display)", flex: "0 0 auto" }}>{props.n}</span>
        <span style={{ fontSize: 26 }}>{props.emoji}</span>
      </div>
      <h3 style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 17, margin: "0 0 6px", color: "white" }}>{props.title}</h3>
      <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.8)", margin: 0, lineHeight: 1.5 }}>{props.desc}</p>
    </div>
  );
}
