import Link from "next/link";
import { prisma } from "@/lib/db";
import { Header } from "../_components/Header";

export const dynamic = "force-dynamic";

type SP = {
  subject?: string;
  grade?: string;
  q?: string;
  price?: string;
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

type PubRow = {
  id: string;
  title: string;
  price: number;
  downloads: number;
  rating: number;
  ratingCount: number;
  isFeatured: boolean;
  tags: string | null;
  user: { name: string | null; email: string | null };
  worksheet: { subject: string | null; grade: number | null } | null;
};

function PubCard({ p, highlight = false }: { p: PubRow; highlight?: boolean }) {
  const tags = p.tags
    ? p.tags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 4)
    : [];
  const authorName = p.user.name?.trim() || p.user.email?.split("@")[0] || "Автор";
  const free = p.price === 0;
  return (
    <Link
      href={`/marketplace/${p.id}`}
      className="card card-hover"
      style={{
        padding: 20,
        textDecoration: "none",
        color: "var(--fg)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        border: highlight ? "1px solid var(--accent)" : undefined,
        boxShadow: highlight ? "0 4px 16px rgba(245,158,11,0.14)" : undefined,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: free ? "#065F46" : "var(--accent-fg)",
            background: free ? "#D1FAE5" : "var(--accent-soft)",
            padding: "3px 10px",
            borderRadius: 999,
          }}
        >
          {formatPrice(p.price)}
        </span>
        {p.ratingCount > 0 && (
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--fg-2)" }}>
            <span style={{ color: "#F59E0B" }}>★</span> {p.rating.toFixed(1)}
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

      <div className="muted" style={{ fontSize: 12, marginTop: "auto", paddingTop: 6 }}>
        {p.downloads > 0 ? `↓ ${p.downloads} скачиваний` : "Новинка"}
      </div>
    </Link>
  );
}

function Chip({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      className="card-hover"
      style={{
        flex: "0 0 auto",
        padding: "8px 16px",
        borderRadius: 999,
        fontSize: 14,
        fontWeight: 600,
        textDecoration: "none",
        whiteSpace: "nowrap",
        border: `1px solid ${active ? "var(--primary)" : "var(--border-2)"}`,
        background: active ? "var(--primary)" : "white",
        color: active ? "white" : "var(--fg-2)",
      }}
    >
      {label}
    </Link>
  );
}

const GRID_AUTO: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
  gap: 16,
};

export default async function MarketplacePage({ searchParams }: { searchParams: SP }) {
  const subject = searchParams.subject?.trim() || "";
  const grade = searchParams.grade?.trim() || "";
  const q = searchParams.q?.trim() || "";
  const priceFilter = searchParams.price?.trim() || "";
  const noFilters = !subject && !grade && !q && !priceFilter;

  const where: {
    worksheet?: { subject?: string; grade?: number };
    price?: number;
    OR?: Array<Record<string, unknown>>;
  } = {};

  if (subject || grade) {
    where.worksheet = {};
    if (subject) where.worksheet.subject = subject;
    if (grade) where.worksheet.grade = Number(grade);
  }
  if (priceFilter === "free") where.price = 0;
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
      { tags: { contains: q } },
    ];
  }

  const [publications, featuredRaw, allTagRows] = await Promise.all([
    prisma.publication.findMany({
      where,
      orderBy: [{ isFeatured: "desc" }, { downloads: "desc" }, { createdAt: "desc" }],
      include: {
        user: { select: { name: true, email: true } },
        worksheet: { select: { subject: true, grade: true } },
      },
      take: 60,
    }),
    noFilters
      ? prisma.publication.findMany({
          where: { isFeatured: true },
          orderBy: [{ downloads: "desc" }],
          include: {
            user: { select: { name: true, email: true } },
            worksheet: { select: { subject: true, grade: true } },
          },
          take: 3,
        })
      : Promise.resolve([] as PubRow[]),
    noFilters
      ? prisma.publication.findMany({ select: { tags: true } })
      : Promise.resolve([] as { tags: string }[]),
  ]);

  // Популярные темы из тегов всех публикаций.
  const tagCounts = new Map<string, number>();
  for (const row of allTagRows) {
    for (const t of (row.tags || "").split(",").map((s) => s.trim()).filter(Boolean)) {
      tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
    }
  }
  const popularTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([t]) => t);

  return (
    <div className="hi" style={{ minHeight: "100vh", background: "var(--surface)" }}>
      <Header />
      <main className="rl-container" style={{ maxWidth: 1180, paddingTop: 32, paddingBottom: 64 }}>
        <div style={{ marginBottom: 20 }}>
          <h1 className="rl-h2" style={{ marginBottom: 6 }}>Маркетплейс листов</h1>
          <p className="muted" style={{ fontSize: 15 }}>
            Готовые рабочие листы от других учителей. Открывайте, сохраняйте себе и используйте на уроке.
          </p>
        </div>

        {/* Категории — горизонтальный скролл на мобильном */}
        <div className="rl-scroller" style={{ marginBottom: 16 }}>
          <Chip label="Все" href="/marketplace" active={noFilters} />
          <Chip label="Математика" href="/marketplace?subject=math" active={subject === "math"} />
          <Chip label="Информатика" href="/marketplace?subject=informatics" active={subject === "informatics"} />
          <Chip label="ЕГЭ" href="/marketplace?q=%D0%95%D0%93%D0%AD" active={q === "ЕГЭ"} />
          <Chip label="ОГЭ" href="/marketplace?q=%D0%9E%D0%93%D0%AD" active={q === "ОГЭ"} />
          <Chip label="Бесплатные" href="/marketplace?price=free" active={priceFilter === "free"} />
        </div>

        {/* Точный фильтр — гибкий, переносится на мобильном */}
        <form
          method="get"
          className="card"
          style={{
            padding: 14,
            marginBottom: 24,
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            alignItems: "center",
          }}
        >
          <input
            type="search"
            name="q"
            defaultValue={q}
            className="rl-input"
            placeholder="Поиск по названию, описанию, тегам"
            style={{ flex: "1 1 240px" }}
          />
          <select name="subject" defaultValue={subject} className="rl-input" style={{ flex: "1 1 150px" }}>
            {SUBJECTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <select name="grade" defaultValue={grade} className="rl-input" style={{ flex: "1 1 130px" }}>
            {GRADES.map((g) => (
              <option key={g} value={g}>{g ? `${g} класс` : "Все классы"}</option>
            ))}
          </select>
          <button type="submit" className="btn btn-blue rl-btn-block-mobile" style={{ flex: "0 0 auto" }}>
            Найти
          </button>
        </form>

        {/* ⭐ Лучшее */}
        {noFilters && featuredRaw.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <div className="rl-row-between" style={{ marginBottom: 12 }}>
              <h2 style={{ fontSize: 22 }}>⭐ Лучшее</h2>
              <span className="muted" style={{ fontSize: 13 }}>Отобрано редакцией</span>
            </div>
            <div style={GRID_AUTO}>
              {(featuredRaw as PubRow[]).map((p) => (
                <PubCard key={p.id} p={p} highlight />
              ))}
            </div>
          </section>
        )}

        {/* Популярные темы */}
        {noFilters && popularTags.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div className="muted" style={{ fontSize: 13, marginBottom: 8, fontWeight: 600 }}>
              Популярные темы
            </div>
            <div className="rl-scroller">
              {popularTags.map((t) => (
                <Link
                  key={t}
                  href={`/marketplace?q=${encodeURIComponent(t)}`}
                  style={{
                    flex: "0 0 auto",
                    fontSize: 13,
                    padding: "5px 12px",
                    borderRadius: 999,
                    textDecoration: "none",
                    background: "var(--surface-2)",
                    color: "var(--fg-2)",
                    whiteSpace: "nowrap",
                  }}
                >
                  #{t}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Результаты */}
        <div className="rl-row-between" style={{ marginBottom: 12 }}>
          <h2 style={{ fontSize: 22 }}>
            {noFilters ? "Все листы" : "Результаты поиска"}
          </h2>
          <span className="muted" style={{ fontSize: 13 }}>
            {publications.length} {publications.length === 1 ? "лист" : "листов"}
          </span>
        </div>

        {publications.length === 0 ? (
          <div
            className="card"
            style={{ padding: 64, textAlign: "center", color: "var(--fg-3)", fontSize: 15 }}
          >
            <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }}>🔍</div>
            <p style={{ marginBottom: 4, color: "var(--fg-2)" }}>По вашему запросу ничего не найдено</p>
            <p style={{ fontSize: 13 }}>
              <Link href="/marketplace" style={{ color: "var(--primary)" }}>Сбросить фильтры</Link>
            </p>
          </div>
        ) : (
          <div style={GRID_AUTO}>
            {(publications as PubRow[]).map((p) => (
              <PubCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
