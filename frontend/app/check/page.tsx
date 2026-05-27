import Link from "next/link";

export default function CheckPage() {
  return (
    <main style={{ minHeight: "100vh", background: "var(--surface)", color: "var(--fg)" }}>
      <div style={{ maxWidth: 820, margin: "0 auto", padding: 32 }}>
        <h1 style={{ fontFamily: "var(--display)", fontSize: 32, fontWeight: 700, margin: "0 0 8px" }}>
          Проверка работ
        </h1>
        <p style={{ color: "var(--fg-3)", marginTop: 0, marginBottom: 28 }}>
          Два способа: ввести ответы вручную в форму или загрузить фото заполненной работы.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Link
            href="/check-text"
            style={{
              display: "block",
              padding: 22,
              border: "2px solid var(--primary)",
              borderRadius: 14,
              background: "var(--primary-soft)",
              textDecoration: "none",
              color: "var(--fg)",
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700 }}>По таблице ответов</div>
            <div style={{ fontSize: 13, color: "var(--fg-2)", marginTop: 6, lineHeight: 1.5 }}>
              Учитель открывает лист, вводит ответы ученика в форму. Сервер сравнивает с эталоном и сразу
              ставит оценку 2–5. Работает с любым листом, не требует фотографии.
            </div>
            <div style={{ marginTop: 12, fontSize: 12, fontWeight: 700, color: "var(--primary)" }}>
              Готово к использованию →
            </div>
          </Link>

          <div
            style={{
              padding: 22,
              border: "2px dashed var(--border-2)",
              borderRadius: 14,
              background: "var(--bg)",
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700 }}>По фото работы</div>
            <div style={{ fontSize: 13, color: "var(--fg-2)", marginTop: 6, lineHeight: 1.5 }}>
              Загружаешь сфотографированную работу — vision-модель распознаёт ответы по координатам
              полей и сравнивает с эталоном. Возвращает таблицу оценок класса.
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: "var(--fg-3)" }}>
              Требует подключения vision-LLM — функция в разработке. Пока пользуйся проверкой по таблице.
            </div>
          </div>
        </div>

        <div style={{ marginTop: 28, padding: 18, background: "var(--bg)", borderRadius: 12, border: "1px solid var(--border)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Шкала оценок</div>
          <div style={{ fontSize: 13, color: "var(--fg-2)" }}>
            ≥ 86% правильных → <strong>5</strong> · 70–85% → <strong>4</strong> · 50–69% → <strong>3</strong> · &lt; 50% → <strong>2</strong>
          </div>
          <div style={{ marginTop: 4, fontSize: 12, color: "var(--fg-3)" }}>
            Та же шкала, что используется в журнале МЭШ.
          </div>
        </div>
      </div>
    </main>
  );
}
