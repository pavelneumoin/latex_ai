import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Header } from "../_components/Header";

export const dynamic = "force-dynamic";

type StatusColor = "primary" | "success" | "error" | "default";

function statusBadge(status: string): { text: string; color: StatusColor } {
  switch (status) {
    case "ready":
      return { text: "Готов", color: "success" };
    case "generating":
      return { text: "Генерируется...", color: "primary" };
    case "failed":
      return { text: "Ошибка", color: "error" };
    default:
      return { text: "Черновик", color: "default" };
  }
}

function badgeStyle(color: StatusColor): React.CSSProperties {
  const map: Record<StatusColor, React.CSSProperties> = {
    primary: { background: "var(--primary-soft)", color: "var(--primary)" },
    success: { background: "#D1FAE5", color: "#065F46" },
    error: { background: "#FEE2E2", color: "#991B1B" },
    default: { background: "var(--surface-2)", color: "var(--fg-2)" },
  };
  return {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 500,
    ...map[color],
  };
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export default async function MyPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/my");
  }
  const userId = session.user.id;

  const worksheets = await prisma.worksheet.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="hi" style={{ minHeight: "100vh", background: "var(--surface)" }}>
      <Header />
      <main style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 28px 64px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <div>
            <h1 style={{ marginBottom: 4 }}>Мои рабочие листы</h1>
            <p className="muted" style={{ fontSize: 14 }}>
              Всего: {worksheets.length}
            </p>
          </div>
          <Link href="/create" className="btn btn-primary btn-lg">
            + Создать новый
          </Link>
        </div>

        {worksheets.length === 0 ? (
          <div
            className="card"
            style={{
              padding: 64,
              textAlign: "center",
              color: "var(--fg-3)",
              fontSize: 15,
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.5 }}>📄</div>
            <p style={{ marginBottom: 6, color: "var(--fg-2)" }}>
              У вас пока нет рабочих листов
            </p>
            <p style={{ marginBottom: 20, fontSize: 14 }}>
              Создайте свой первый лист за минуту.
            </p>
            <Link href="/create" className="btn btn-primary">
              Создать первый лист
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
            {worksheets.map((w) => {
              const b = statusBadge(w.status);
              const hasPdf = Boolean(w.pdfPath);
              return (
                <div
                  key={w.id}
                  className="card"
                  style={{
                    padding: 20,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <span style={badgeStyle(b.color)}>{b.text}</span>
                    {w.isPublic && (
                      <span
                        style={{
                          ...badgeStyle("default"),
                          background: "var(--accent-soft)",
                          color: "#92400E",
                        }}
                      >
                        В маркете
                      </span>
                    )}
                  </div>

                  <div>
                    <div
                      style={{
                        fontFamily: "var(--display)",
                        fontWeight: 600,
                        fontSize: 16,
                        marginBottom: 4,
                        lineHeight: 1.3,
                      }}
                    >
                      {w.title}
                    </div>
                    <div className="muted" style={{ fontSize: 13, marginBottom: 4 }}>
                      {w.topic ?? "—"}
                    </div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      {formatDate(w.createdAt)}
                      {w.grade ? ` · ${w.grade} класс` : ""}
                      {w.variant && w.variant !== "A" ? ` · вариант ${w.variant}` : ""}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      marginTop: "auto",
                      paddingTop: 6,
                      flexWrap: "wrap",
                    }}
                  >
                    <Link
                      href={`/my/${w.id}`}
                      className="btn btn-outline btn-sm"
                      style={{ flex: "1 1 auto" }}
                    >
                      Открыть
                    </Link>
                    {hasPdf ? (
                      <a
                        href={w.pdfPath ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-blue btn-sm"
                      >
                        PDF
                      </a>
                    ) : (
                      <span
                        title="PDF будет готов после подключения LLM утром"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "6px 12px",
                          minHeight: 32,
                          borderRadius: 10,
                          fontSize: 13,
                          fontWeight: 600,
                          background: "var(--surface-2)",
                          color: "var(--fg-3)",
                          cursor: "not-allowed",
                        }}
                      >
                        PDF
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
