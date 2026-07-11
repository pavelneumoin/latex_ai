// Кабинет · Отчёты: сформированные LaTeX-документы со статистикой.

import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { IconChart } from "@/app/_components/Icons";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = {
  check: "По проверке",
  class_period: "Класс за период",
  student: "По ученику",
};

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user!.id;

  const reports = await prisma.report.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 900 }}>
      <div>
        <h1 style={{ fontSize: "clamp(22px, 4vw, 30px)" }}>Отчёты</h1>
        <p className="muted-2" style={{ marginTop: 4, fontSize: 14.5 }}>
          Вся статистика — в аккуратных PDF-документах: для себя, родителей и завуча.
          Интерфейс не перегружаем.
        </p>
      </div>

      {reports.length === 0 ? (
        <div className="rl2-empty rl2-gridpaper" style={{ padding: 60 }}>
          <div style={{ color: "var(--fg-3)", marginBottom: 10 }}>
            <IconChart size={34} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--fg-2)" }}>
            Отчётов пока нет
          </div>
          <div style={{ marginTop: 6 }}>
            Завершите проверку и нажмите «Отчёт (PDF)» — документ появится здесь.
          </div>
          <div style={{ marginTop: 14 }}>
            <Link href="/cabinet/checks" className="btn btn-primary">
              К проверкам
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {reports.map((r) => (
            <div key={r.id} className="card" style={{ padding: 16 }}>
              <div className="rl-row-between">
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontFamily: "var(--display)", fontSize: 15 }}>
                    {r.title}
                  </div>
                  <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>
                    {KIND_LABEL[r.kind] ?? r.kind} · {r.createdAt.toLocaleString("ru-RU")}
                    {r.status === "failed" ? " · ошибка сборки" : ""}
                  </div>
                </div>
                <div className="rl-row" style={{ gap: 6 }}>
                  {r.pdfPath ? (
                    <a className="btn btn-sm btn-primary" href={`/api/reports/${r.id}/file?kind=pdf`}>
                      Скачать PDF
                    </a>
                  ) : (
                    <span className="badge">PDF не собран</span>
                  )}
                  {r.texPath && (
                    <a className="btn btn-sm btn-ghost" href={`/api/reports/${r.id}/file?kind=tex`} title="LaTeX-исходник">
                      .tex
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
