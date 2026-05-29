import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Header } from "../../_components/Header";
import { WorksheetActions } from "./WorksheetActions";
import { WorksheetPreview } from "./WorksheetPreview";
import { QualityBadge } from "./QualityBadge";
import { validateWorksheet } from "@/lib/worksheet-validator";

export const dynamic = "force-dynamic";

type Task = {
  n?: number | string;
  condition?: string;
  expected?: string;
  hint?: string;
  answer?: string;
};

type Content = {
  title?: string;
  subtitle?: string;
  tasks?: Task[];
};

function parseContent(json: string | null): Content | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as Content;
  } catch {
    return null;
  }
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function statusLabel(status: string): string {
  switch (status) {
    case "ready":
      return "Готов";
    case "generating":
      return "Генерируется";
    case "failed":
      return "Ошибка";
    default:
      return "Черновик";
  }
}

export default async function WorksheetDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/my");
  }
  const userId = session.user.id;

  const worksheet = await prisma.worksheet.findUnique({
    where: { id: params.id },
    include: {
      template: true,
      children: { orderBy: { createdAt: "desc" } },
      parent: true,
    },
  });

  if (!worksheet) {
    notFound();
  }
  if (worksheet.userId && worksheet.userId !== userId) {
    redirect("/my");
  }

  const content = parseContent(worksheet.contentJson);
  const tasks = content?.tasks ?? [];

  return (
    <div className="hi" style={{ minHeight: "100vh", background: "var(--surface)" }}>
      <Header />
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 28px 64px" }}>
        <div style={{ marginBottom: 16 }}>
          <Link
            href="/my"
            style={{ color: "var(--fg-3)", fontSize: 13, textDecoration: "none" }}
          >
            ← Все мои листы
          </Link>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 320px",
            gap: 24,
          }}
        >
          {/* Main content */}
          <div>
            <div className="card" style={{ padding: 28, marginBottom: 20 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    padding: "2px 10px",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 500,
                    background: "var(--surface-2)",
                    color: "var(--fg-2)",
                  }}
                >
                  {statusLabel(worksheet.status)}
                </span>
                {worksheet.isPublic && (
                  <span
                    style={{
                      display: "inline-block",
                      padding: "2px 10px",
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 500,
                      background: "var(--accent-soft)",
                      color: "#92400E",
                    }}
                  >
                    В маркетплейсе
                  </span>
                )}
                {worksheet.variant && worksheet.variant !== "A" && (
                  <span
                    style={{
                      display: "inline-block",
                      padding: "2px 10px",
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 500,
                      background: "var(--primary-soft)",
                      color: "var(--primary)",
                    }}
                  >
                    Вариант {worksheet.variant}
                  </span>
                )}
              </div>
              <h1 style={{ marginBottom: 8 }}>{worksheet.title}</h1>
              {content?.subtitle && (
                <p className="muted-2" style={{ fontSize: 15, marginBottom: 8 }}>
                  {content.subtitle}
                </p>
              )}
              <div className="muted" style={{ fontSize: 13 }}>
                Создан: {formatDate(worksheet.createdAt)}
                {worksheet.template && ` · Шаблон: ${worksheet.template.name}`}
              </div>

              {worksheet.parent && (
                <div
                  style={{
                    marginTop: 16,
                    padding: 12,
                    background: "var(--surface)",
                    borderRadius: 10,
                    fontSize: 13,
                  }}
                >
                  Этот лист — производный от{" "}
                  <Link
                    href={`/my/${worksheet.parent.id}`}
                    style={{ color: "var(--primary)", textDecoration: "none" }}
                  >
                    {worksheet.parent.title}
                  </Link>
                </div>
              )}
            </div>

            {tasks.length === 0 ? (
              <div
                className="card"
                style={{
                  padding: 28,
                  textAlign: "center",
                  color: "var(--fg-3)",
                  fontSize: 14,
                }}
              >
                {worksheet.status === "generating"
                  ? "Задачи генерируются — обновите страницу через минуту."
                  : "Контент ещё не сгенерирован. Нажмите «Поговорить с нейросетью» или подключите LLM в настройках."}
              </div>
            ) : (
              <WorksheetPreview
                title={content?.title || worksheet.title}
                subtitle={content?.subtitle || undefined}
                templateStyle={worksheet.template?.style ?? null}
                templateName={worksheet.template?.name ?? null}
                templateId={worksheet.template?.id ?? worksheet.templateId}
                tasks={tasks.map((t, i) => ({
                  n: t.n ?? i + 1,
                  condition: t.condition ?? "",
                  expected_answer: t.expected ?? t.answer ?? undefined,
                  hint: t.hint,
                }))}
                showAnswers={true}
              />
            )}

            {/* Children tree */}
            {worksheet.children.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <h2 style={{ marginBottom: 12 }}>Варианты и усложнения</h2>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                    gap: 12,
                  }}
                >
                  {worksheet.children.map((c) => (
                    <Link
                      key={c.id}
                      href={`/my/${c.id}`}
                      className="card card-hover"
                      style={{
                        padding: 16,
                        textDecoration: "none",
                        color: "var(--fg)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          color: "var(--fg-3)",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                        }}
                      >
                        {c.difficulty === "hard" ? "Усложнено" : `Вариант ${c.variant}`}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.3 }}>
                        {c.title}
                      </div>
                      <div className="muted" style={{ fontSize: 12 }}>
                        {formatDate(c.createdAt)}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar with actions + params */}
          <aside>
            <div className="card" style={{ padding: 20, marginBottom: 16 }}>
              <h3 style={{ marginBottom: 14 }}>Действия</h3>
              <WorksheetActions
                worksheetId={worksheet.id}
                hasPdf={Boolean(worksheet.pdfPath)}
                pdfPath={worksheet.pdfPath}
                isPublic={worksheet.isPublic}
              />
            </div>

            {tasks.length > 0 && (
              <div className="card" style={{ padding: 20, marginBottom: 16 }}>
                <h3 style={{ marginBottom: 14 }}>Качество</h3>
                <QualityBadge result={validateWorksheet(content)} />
              </div>
            )}

            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ marginBottom: 14 }}>Параметры</h3>
              <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 12px", fontSize: 13, margin: 0 }}>
                <dt style={{ color: "var(--fg-3)" }}>Шаблон</dt>
                <dd style={{ margin: 0, fontWeight: 500 }}>{worksheet.template?.name ?? worksheet.templateId}</dd>

                <dt style={{ color: "var(--fg-3)" }}>Предмет</dt>
                <dd style={{ margin: 0 }}>{worksheet.subject ?? "—"}</dd>

                <dt style={{ color: "var(--fg-3)" }}>Класс</dt>
                <dd style={{ margin: 0 }}>{worksheet.grade ?? "—"}</dd>

                <dt style={{ color: "var(--fg-3)" }}>Сложность</dt>
                <dd style={{ margin: 0 }}>{worksheet.difficulty}</dd>

                <dt style={{ color: "var(--fg-3)" }}>LLM</dt>
                <dd style={{ margin: 0 }}>{worksheet.llmProvider ?? "mock"}</dd>
              </dl>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
