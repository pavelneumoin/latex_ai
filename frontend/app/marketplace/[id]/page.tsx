import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Header } from "../../_components/Header";
import { PublicationActions } from "./PublicationActions";

export const dynamic = "force-dynamic";

type Task = { n?: number | string; condition?: string; expected?: string };
type Content = { title?: string; subtitle?: string; tasks?: Task[] };

function parseContent(json: string | null): Content | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as Content;
  } catch {
    return null;
  }
}

function formatPrice(kopecks: number): string {
  if (kopecks === 0) return "Бесплатно";
  return `${Math.round(kopecks / 100)} ₽`;
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export default async function PublicationDetailPage({ params }: { params: { id: string } }) {
  const [session, publication] = await Promise.all([
    getServerSession(authOptions),
    prisma.publication.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { name: true, email: true } },
        worksheet: true,
      },
    }),
  ]);

  if (!publication) notFound();

  const content = parseContent(publication.worksheet.contentJson);
  const tasks = content?.tasks ?? [];
  const tags = publication.tags
    ? publication.tags.split(",").map((t) => t.trim()).filter(Boolean)
    : [];
  const authorName = publication.user.name?.trim() || publication.user.email?.split("@")[0] || "Автор";
  const loggedIn = Boolean(session?.user?.id);

  return (
    <div className="hi" style={{ minHeight: "100vh", background: "var(--surface)" }}>
      <Header />
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 28px 64px" }}>
        <div style={{ marginBottom: 16 }}>
          <Link href="/marketplace" style={{ color: "var(--fg-3)", fontSize: 13, textDecoration: "none" }}>
            ← К маркетплейсу
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}>
          <div>
            <div className="card" style={{ padding: 28, marginBottom: 20 }}>
              <h1 style={{ marginBottom: 8 }}>{publication.title}</h1>
              <div className="muted" style={{ fontSize: 14, marginBottom: 12 }}>
                Автор: {authorName} · Опубликовано: {formatDate(publication.createdAt)}
              </div>

              {publication.description && (
                <p style={{ marginBottom: 16, fontSize: 15, lineHeight: 1.55, color: "var(--fg-2)" }}>
                  {publication.description}
                </p>
              )}

              {tags.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {tags.map((t) => (
                    <span
                      key={t}
                      style={{
                        fontSize: 12,
                        padding: "3px 10px",
                        borderRadius: 999,
                        background: "var(--surface-2)",
                        color: "var(--fg-2)",
                      }}
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="card" style={{ padding: 28 }}>
              <h2 style={{ marginBottom: 16 }}>Превью</h2>
              {tasks.length === 0 ? (
                <div
                  style={{
                    padding: 24,
                    background: "var(--surface)",
                    borderRadius: 10,
                    color: "var(--fg-3)",
                    fontSize: 14,
                    textAlign: "center",
                  }}
                >
                  Превью контента появится после подключения LLM.
                </div>
              ) : (
                <ol style={{ paddingLeft: 22, display: "flex", flexDirection: "column", gap: 12 }}>
                  {tasks.slice(0, 5).map((t, i) => (
                    <li key={i} style={{ fontSize: 14, lineHeight: 1.55 }}>
                      {t.condition ?? "—"}
                    </li>
                  ))}
                  {tasks.length > 5 && (
                    <li
                      style={{
                        listStyle: "none",
                        color: "var(--fg-3)",
                        fontSize: 13,
                        marginTop: 4,
                      }}
                    >
                      ...и ещё {tasks.length - 5} задач
                    </li>
                  )}
                </ol>
              )}
            </div>
          </div>

          <aside>
            <div className="card" style={{ padding: 20, marginBottom: 16 }}>
              <div
                style={{
                  fontFamily: "var(--display)",
                  fontWeight: 700,
                  fontSize: 28,
                  marginBottom: 10,
                  color: publication.price > 0 ? "var(--accent-fg)" : "#065F46",
                }}
              >
                {formatPrice(publication.price)}
              </div>
              <PublicationActions
                publicationId={publication.id}
                price={publication.price}
                pdfPath={publication.worksheet.pdfPath}
                loggedIn={loggedIn}
              />
            </div>

            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ marginBottom: 12 }}>О листе</h3>
              <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 12px", fontSize: 13, margin: 0 }}>
                <dt style={{ color: "var(--fg-3)" }}>Предмет</dt>
                <dd style={{ margin: 0 }}>{publication.worksheet.subject ?? "—"}</dd>

                <dt style={{ color: "var(--fg-3)" }}>Класс</dt>
                <dd style={{ margin: 0 }}>{publication.worksheet.grade ?? "—"}</dd>

                <dt style={{ color: "var(--fg-3)" }}>Скачиваний</dt>
                <dd style={{ margin: 0 }}>{publication.downloads}</dd>

                <dt style={{ color: "var(--fg-3)" }}>Рейтинг</dt>
                <dd style={{ margin: 0 }}>
                  {publication.ratingCount > 0
                    ? `${publication.rating.toFixed(1)} (${publication.ratingCount})`
                    : "Нет оценок"}
                </dd>
              </dl>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
