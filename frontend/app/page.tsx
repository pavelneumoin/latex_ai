import Link from "next/link";

export default function Landing() {
  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--fg)" }}>
      {/* Topbar */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 48px",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "var(--primary)",
              display: "grid",
              placeItems: "center",
              color: "var(--primary-fg)",
              fontFamily: "var(--display)",
              fontWeight: 800,
              fontSize: 18,
            }}
          >
            РЛ
          </div>
          <span
            style={{
              fontFamily: "var(--display)",
              fontWeight: 700,
              fontSize: 18,
              letterSpacing: "-0.01em",
            }}
          >
            РабочийЛист·ai
          </span>
        </div>
        <nav style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <Link href="/templates" style={{ color: "var(--fg-2)", textDecoration: "none", fontSize: 14 }}>
            Шаблоны
          </Link>
          <Link href="/check" style={{ color: "var(--fg-2)", textDecoration: "none", fontSize: 14 }}>
            Проверка
          </Link>
          <Link href="/login" style={{ color: "var(--fg-2)", textDecoration: "none", fontSize: 14 }}>
            Войти
          </Link>
          <Link
            href="/create"
            style={{
              background: "var(--accent)",
              color: "var(--accent-fg)",
              padding: "10px 18px",
              borderRadius: "var(--radius-btn)",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: 14,
              boxShadow: "var(--shadow-sm)",
            }}
          >
            Создать лист
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section
        style={{
          padding: "80px 48px",
          maxWidth: 1280,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1.1fr 1fr",
          gap: 48,
          alignItems: "center",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "var(--display)",
              fontSize: 56,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.025em",
              margin: 0,
              marginBottom: 24,
            }}
          >
            Рабочий лист
            <br />
            по любой теме
            <br />
            <span style={{ color: "var(--primary)" }}>за минуту.</span>
          </h1>
          <p
            style={{
              fontSize: 18,
              color: "var(--fg-2)",
              lineHeight: 1.55,
              maxWidth: 540,
              margin: 0,
              marginBottom: 32,
            }}
          >
            Опиши тему — нейросеть GigaChat соберёт задачи. Или возьми готовые из банка ФИПИ
            (8500+ задач ЕГЭ/ОГЭ). 35 стилей оформления, твоё лого, водяной знак.
            После урока — оценка ученикам по таблице ответов автоматически.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link
              href="/create"
              style={{
                background: "var(--accent)",
                color: "var(--accent-fg)",
                padding: "16px 28px",
                borderRadius: "var(--radius-btn)",
                textDecoration: "none",
                fontWeight: 700,
                fontSize: 16,
                boxShadow: "var(--shadow-md)",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              Создать лист →
            </Link>
            <Link
              href="/templates"
              style={{
                background: "var(--bg)",
                color: "var(--fg)",
                padding: "16px 28px",
                borderRadius: "var(--radius-btn)",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: 16,
                border: "1px solid var(--border-2)",
              }}
            >
              Посмотреть 35 шаблонов →
            </Link>
          </div>

          <p style={{ marginTop: 28, color: "var(--fg-3)", fontSize: 14 }}>
            Бесплатно в бете · 35 стилей PDF/DOCX · 8500+ задач ФИПИ · оценка 2–5 за 5 секунд
          </p>
        </div>

        {/* PDF mock card */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 24,
            padding: 28,
            boxShadow: "var(--shadow-lg)",
            transform: "rotate(-1.5deg)",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: 12,
              padding: 32,
              minHeight: 380,
              boxShadow: "var(--shadow-md)",
              fontFamily: '"Times New Roman", serif',
            }}
          >
            <div style={{ textAlign: "center", color: "var(--primary)", fontSize: 20, fontWeight: 700, marginBottom: 14 }}>
              Текстовые задачи. Движение по реке
            </div>
            <div style={{ textAlign: "center", color: "var(--fg-3)", fontSize: 12, marginBottom: 22, fontStyle: "italic" }}>
              ЕГЭ профиль · Класс 11 · T1
            </div>
            <div style={{ borderRadius: 4, padding: 8, fontSize: 11, color: "var(--fg-3)", marginBottom: 16, border: "1px solid var(--border)" }}>
              ФИО: __________________ &nbsp; Класс: ___ &nbsp; Дата: ______
            </div>
            <div style={{ border: "1px solid var(--primary)", borderRadius: 8, padding: 14, marginBottom: 12, fontSize: 12, color: "var(--fg)", position: "relative" }}>
              <div style={{ position: "absolute", top: -10, left: 8, background: "var(--primary)", color: "white", fontSize: 9, padding: "2px 8px", borderRadius: 3 }}>
                Задача №1
              </div>
              <div style={{ marginTop: 4, lineHeight: 1.4 }}>
                Моторная лодка прошла против течения 112&nbsp;км и вернулась, затратив на обратный путь на 6&nbsp;часов меньше...
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                <span style={{ color: "var(--primary)", fontWeight: 600, fontSize: 11, marginRight: 6 }}>Ответ:</span>
                <div style={{ width: 90, height: 24, border: "1px solid var(--fg-3)", borderRadius: 3 }} />
              </div>
            </div>
            <div style={{ border: "1px solid var(--primary)", borderRadius: 8, padding: 14, fontSize: 12, color: "var(--fg)", position: "relative" }}>
              <div style={{ position: "absolute", top: -10, left: 8, background: "var(--primary)", color: "white", fontSize: 9, padding: "2px 8px", borderRadius: 3 }}>
                Задача №2
              </div>
              <div style={{ marginTop: 4, lineHeight: 1.4 }}>
                Лодка прошла 96&nbsp;км по течению и обратно, потратив на путь 20&nbsp;часов...
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                <span style={{ color: "var(--primary)", fontWeight: 600, fontSize: 11, marginRight: 6 }}>Ответ:</span>
                <div style={{ width: 90, height: 24, border: "1px solid var(--fg-3)", borderRadius: 3 }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ background: "var(--surface)", padding: "72px 48px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--display)", fontSize: 32, fontWeight: 700, marginBottom: 48, textAlign: "center" }}>
            Как это работает
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
            {[
              { n: 1, t: "Опиши тему или возьми банк", d: "GigaChat сгенерирует задачи по теме. Или выбери задание из банка ФИПИ — реальные задачи ЕГЭ/ОГЭ." },
              { n: 2, t: "Выбери шаблон", d: "35 стилей: от классики до неоновой контрольной. Со своим лого и цветом школы." },
              { n: 3, t: "Скачай и проверь", d: "PDF, DOCX, .tex или Overleaf. После урока — введи ответы в форму, получи оценки 2–5 автоматически." },
            ].map((s) => (
              <div
                key={s.n}
                style={{
                  background: "var(--bg)",
                  borderRadius: "var(--radius-card)",
                  padding: 28,
                  boxShadow: "var(--shadow-sm)",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: "var(--primary-soft)",
                    color: "var(--primary)",
                    display: "grid",
                    placeItems: "center",
                    fontFamily: "var(--display)",
                    fontWeight: 800,
                    fontSize: 18,
                    marginBottom: 16,
                  }}
                >
                  {s.n}
                </div>
                <h3 style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 20, margin: "0 0 8px" }}>{s.t}</h3>
                <p style={{ color: "var(--fg-2)", fontSize: 14, lineHeight: 1.55, margin: 0 }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "32px 48px", color: "var(--fg-3)", fontSize: 13 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", justifyContent: "space-between" }}>
          <span>© РабочийЛист.ai · 2026</span>
          <span>
            <a href="https://github.com/pavelneumoin/latex_ai" style={{ color: "var(--fg-3)" }}>
              GitHub
            </a>
          </span>
        </div>
      </footer>
    </main>
  );
}
