import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="hi"
      style={{
        minHeight: "100vh",
        background: "var(--surface)",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <div
          style={{
            fontFamily: "var(--display)",
            fontSize: 96,
            fontWeight: 800,
            color: "var(--primary)",
            lineHeight: 1,
            marginBottom: 8,
          }}
        >
          404
        </div>
        <h1 style={{ marginBottom: 10 }}>Страница не найдена</h1>
        <p className="muted-2" style={{ fontSize: 15, marginBottom: 24 }}>
          Возможно, лист удалён, ссылка устарела или вы ошиблись адресом.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/" className="btn btn-blue btn-lg">
            На главную
          </Link>
          <Link href="/create" className="btn btn-outline btn-lg">
            Создать лист
          </Link>
        </div>
      </div>
    </div>
  );
}
