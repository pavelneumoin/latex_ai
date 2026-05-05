import Link from "next/link";

export function StubPage({ title, description }: { title: string; description: string }) {
  return (
    <main style={{ minHeight: "100vh", background: "var(--surface)", color: "var(--fg)" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 32px",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg)",
        }}
      >
        <Link href="/" style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: "var(--primary)",
              color: "var(--primary-fg)",
              display: "grid",
              placeItems: "center",
              fontFamily: "var(--display)",
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            РЛ
          </div>
          <span style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 16 }}>
            РабочийЛист·ai
          </span>
        </Link>
        <nav style={{ display: "flex", gap: 16, fontSize: 14 }}>
          <Link href="/create" style={{ color: "var(--fg-2)", textDecoration: "none" }}>
            Создать
          </Link>
          <Link href="/catalog" style={{ color: "var(--fg-2)", textDecoration: "none" }}>
            Каталог
          </Link>
        </nav>
      </header>
      <div style={{ maxWidth: 720, margin: "120px auto", textAlign: "center", padding: 32 }}>
        <h1 style={{ fontFamily: "var(--display)", fontSize: 40, fontWeight: 800, margin: 0, marginBottom: 16 }}>
          {title}
        </h1>
        <p style={{ color: "var(--fg-2)", fontSize: 17, lineHeight: 1.55, marginBottom: 32 }}>{description}</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Link
            href="/create"
            style={{
              background: "var(--accent)",
              color: "var(--accent-fg)",
              padding: "14px 24px",
              borderRadius: "var(--radius-btn)",
              textDecoration: "none",
              fontWeight: 700,
              boxShadow: "var(--shadow-sm)",
            }}
          >
            Создать рабочий лист →
          </Link>
          <Link
            href="/"
            style={{
              background: "var(--bg)",
              color: "var(--fg)",
              padding: "14px 24px",
              borderRadius: "var(--radius-btn)",
              textDecoration: "none",
              border: "1px solid var(--border-2)",
            }}
          >
            На главную
          </Link>
        </div>
      </div>
    </main>
  );
}
