import Link from "next/link";
import { prisma } from "@/lib/db";
import { Header } from "../_components/Header";

export const dynamic = "force-dynamic";

type SP = {
  subject?: string;
  grade?: string;
  q?: string;
};

const SUBJECTS: { value: string; label: string }[] = [
  { value: "", label: "Все предметы" },
  { value: "math", label: "Математика" },
  { value: "informatics", label: "Информатика" },
  { value: "mixed", label: "Смешанное" },
];

const GRADES = ["", "5", "6", "7", "8", "9", "10", "11"];

function formatPrice(kopecks: number): string {
  if (kopecks === 0) return "Бесплатно";
  return `${Math.round(kopecks / 100)} ₽`;
}

export default async function MarketplacePage({ searchParams }: { searchParams: SP }) {
  const subject = searchParams.subject?.trim() || "";
  const grade = searchParams.grade?.trim() || "";
  const q = searchParams.q?.trim() || "";

  const where: {
    worksheet?: { subject?: string; grade?: number };
    OR?: Array<Record<string, unknown>>;
  } = {};

  if (subject || grade) {
    where.worksheet = {};
    if (subject) where.worksheet.subject = subject;
    if (grade) where.worksheet.grade = Number(grade);
  }
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
      { tags: { contains: q } },
    ];
  }

  const publications = await prisma.publication.findMany({
    where,
    orderBy: [{ isFeatured: "desc" }, { downloads: "desc" }, { createdAt: "desc" }],
    include: {
      user: { select: { name: true, email: true } },
      worksheet: { select: { subject: true, grade: true } },
    },
    take: 60,
  });

  return (
    <div className="hi" style={{ minHeight: "100vh", background: "var(--surface)" }}>
      <Header />
      <main style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 28px 64px" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ marginBottom: 4 }}>Маркетплейс листов</h1>
          <p className="muted" style={{ fontSize: 14 }}>
            Готовые рабочие листы от других учителей. Сохраняйте себе и используйте на уроке.
          </p>
        </div>

        {/* Filters */}
        <form
          method="get"
          className="card"
          style={{
            padding: 16,
            marginBottom: 20,
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr auto",
            gap: 10,
            alignItems: "center",
          }}
        >
          <input
            type="search"
            name="q"
            defaultValue={q}
            className="input"
            placeholder="Поиск по названию, описанию, тегам"
          />
          <select name="subject" defaultValue={subject} className="select">
            {SUBJECTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <select name="grade" defaultValue={grade} className="select">
            {GRADES.map((g) => (
              <option key={g} value={g}>
                {g ? `${g} класс` : "Все классы"}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-blue">
            Найти
          </button>
        </form>

        {publications.length === 0 ? (
          <div
            className="card"
            style={{
              padding: 64,
              textAlign: "center",
              color: "var(--fg-3)",
              fontSize: 15,
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }}>🔍</div>
            <p style={{ marginBottom: 4, color: "var(--fg-2)" }}>
              По вашему запросу ничего не найдено
            </p>
            <p style={{ fontSize: 13 }}>Попробуйте сбросить фильтры.</p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            {publications.map((p) => {
              const tags = p.tags
                ? p.tags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 4)
                : [];
              const authorName = p.user.name?.trim() || p.user.email?.split("@")[0] || "Автор";
              return (
                <Link
                  key={p.id}
                  href={`/marketplace/${p.id}`}
                  className="card card-hover"
                  style={{
                    padding: 20,
                    textDecoration: "none",
                    color: "var(--fg)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: p.price > 0 ? "var(--accent-fg)" : "#065F46",
                        background: p.price > 0 ? "var(--accent-soft)" : "#D1FAE5",
                        padding: "3px 10px",
                        borderRadius: 999,
                      }}
                    >
                      {formatPrice(p.price)}
                    </span>
                    {p.isFeatured && (
                      <span
                        style={{
                          fontSize: 11,
                          padding: "2px 8px",
                          borderRadius: 999,
                          background: "var(--primary-soft)",
                          color: "var(--primary)",
                          fontWeight: 500,
                        }}
                      >
                        Топ
                      </span>
                    )}
                  </div>

                  <div style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 16, lineHeight: 1.3 }}>
                    {p.title}
                  </div>

                  <div className="muted" style={{ fontSize: 12 }}>
                    {authorName}
                    {p.worksheet?.grade ? ` · ${p.worksheet.grade} класс` : ""}
                  </div>

                  {tags.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                      {tags.map((t) => (
                        <span
                          key={t}
                          style={{
                            fontSize: 11,
                            padding: "2px 8px",
                            borderRadius: 6,
                            background: "var(--surface-2)",
                            color: "var(--fg-2)",
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  <div
                    className="muted"
                    style={{ fontSize: 12, marginTop: "auto", paddingTop: 6 }}
                  >
                    {p.downloads > 0 ? `${p.downloads} скачиваний` : "Новинка"}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
