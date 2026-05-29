// Публичная страница рабочего листа.
// Открывается по ссылке /share/<id> — без авторизации, если лист опубликован (isPublic=true)
// или просматривается владельцем.
// Используется учителями, чтобы делиться листами с коллегами/учениками/родителями.

import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { WorksheetPreview } from "../../my/[id]/WorksheetPreview";

export const dynamic = "force-dynamic";

type Content = {
  title?: string;
  subtitle?: string;
  tasks?: Array<{
    n?: number | string;
    condition?: string;
    expected?: string;
    expected_answer?: string;
    answer?: string;
    hint?: string;
  }>;
};

function parseContent(json: string | null): Content | null {
  if (!json) return null;
  try { return JSON.parse(json) as Content; } catch { return null; }
}

export default async function SharePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { answers?: string };
}) {
  const showAnswers = searchParams?.answers !== "0";

  const ws = await prisma.worksheet.findUnique({
    where: { id: params.id },
    include: {
      template: true,
      user: { select: { name: true, school: true } },
    },
  });
  if (!ws) notFound();

  // Доступ: публичный лист ИЛИ владелец
  let allowed = ws.isPublic;
  if (!allowed) {
    const session = await getServerSession(authOptions);
    const uid = (session?.user as { id?: string } | undefined)?.id;
    allowed = !!uid && uid === ws.userId;
  }
  if (!allowed) notFound();

  const content = parseContent(ws.contentJson);
  const tasks = content?.tasks ?? [];

  return (
    <div
      className="hi"
      style={{
        minHeight: "100vh",
        background: "var(--surface)",
        padding: "32px 16px",
      }}
    >
      <main style={{ maxWidth: 860, margin: "0 auto" }}>
        {/* Шапка с брендом */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 18,
            padding: "0 4px",
          }}
        >
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              textDecoration: "none",
              color: "var(--fg-2)",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: 24,
                height: 24,
                background: "var(--primary)",
                color: "white",
                borderRadius: 6,
                display: "grid",
                placeItems: "center",
                fontFamily: "var(--display)",
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              РЛ
            </span>
            РабочийЛист.ai
          </Link>
          {ws.isPublic && (
            <span
              style={{
                fontSize: 11,
                color: "var(--fg-3)",
                background: "var(--surface-2)",
                padding: "3px 8px",
                borderRadius: 4,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Опубликовано
            </span>
          )}
        </header>

        {tasks.length === 0 ? (
          <div
            className="card"
            style={{
              padding: 32,
              textAlign: "center",
              color: "var(--fg-3)",
              fontSize: 14,
            }}
          >
            Этот лист ещё не сгенерирован.
          </div>
        ) : (
          <WorksheetPreview
            title={content?.title || ws.title}
            subtitle={content?.subtitle || undefined}
            templateStyle={ws.template?.style ?? null}
            templateName={ws.template?.name ?? null}
            templateId={ws.template?.id ?? ws.templateId}
            tasks={tasks.map((t, i) => ({
              n: t.n ?? i + 1,
              condition: t.condition ?? "",
              expected_answer: t.expected_answer ?? t.expected ?? t.answer ?? undefined,
              hint: t.hint,
            }))}
            showAnswers={showAnswers}
            teacherName={ws.user?.name ?? null}
            schoolName={ws.user?.school ?? null}
          />
        )}

        {/* Тулбар под превью */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 18,
            padding: "0 4px",
            fontSize: 12,
            color: "var(--fg-3)",
          }}
        >
          <div>
            <Link
              href={
                showAnswers ? `?answers=0` : `?answers=1`
              }
              style={{ color: "var(--fg-2)", textDecoration: "none" }}
            >
              {showAnswers ? "Скрыть ответы" : "Показать ответы"}
            </Link>
          </div>
          <div>
            <a
              href={`/api/worksheets/${ws.id}/export?format=pdf`}
              style={{ color: "var(--primary)", textDecoration: "none", marginRight: 14 }}
              target="_blank"
              rel="noopener noreferrer"
            >
              Скачать PDF
            </a>
            <a
              href={`/api/worksheets/${ws.id}/export?format=docx`}
              style={{ color: "var(--primary)", textDecoration: "none" }}
              target="_blank"
              rel="noopener noreferrer"
            >
              DOCX
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
