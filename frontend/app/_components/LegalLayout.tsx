import Link from "next/link";
import { Header } from "./Header";

// Единое оформление юридических страниц (оферта / политика / соглашение).
export function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="hi" style={{ minHeight: "100vh", background: "var(--surface)" }}>
      <Header />
      <main style={{ maxWidth: 780, margin: "0 auto", padding: "32px 28px 80px" }}>
        <Link href="/" style={{ color: "var(--fg-3)", fontSize: 13, textDecoration: "none" }}>
          ← На главную
        </Link>
        <h1 style={{ marginTop: 14, marginBottom: 4 }}>{title}</h1>
        <p className="muted" style={{ fontSize: 13, marginBottom: 28 }}>
          Редакция от {updated}
        </p>
        <article
          className="legal"
          style={{ fontSize: 14, lineHeight: 1.7, color: "var(--fg-2)" }}
        >
          {children}
        </article>

        <div
          style={{
            marginTop: 40,
            paddingTop: 20,
            borderTop: "1px solid var(--border)",
            display: "flex",
            gap: 18,
            flexWrap: "wrap",
            fontSize: 13,
          }}
        >
          <Link href="/offer" style={{ color: "var(--primary)", textDecoration: "none" }}>Публичная оферта</Link>
          <Link href="/privacy" style={{ color: "var(--primary)", textDecoration: "none" }}>Политика конфиденциальности</Link>
          <Link href="/terms" style={{ color: "var(--primary)", textDecoration: "none" }}>Пользовательское соглашение</Link>
        </div>
      </main>
      <style>{`
        .legal h2 { font-family: var(--display); font-size: 19px; font-weight: 700; margin: 28px 0 10px; color: var(--fg); }
        .legal h3 { font-size: 15px; font-weight: 600; margin: 18px 0 6px; color: var(--fg); }
        .legal p { margin: 0 0 12px; }
        .legal ul, .legal ol { margin: 0 0 14px; padding-left: 22px; }
        .legal li { margin-bottom: 6px; }
        .legal strong { color: var(--fg); }
        .legal a { color: var(--primary); }
      `}</style>
    </div>
  );
}
