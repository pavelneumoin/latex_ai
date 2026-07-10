// Кабинет · Проверки: список всех проверок работ.

import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; cls: string }> = {
  draft: { label: "Черновик", cls: "badge" },
  uploaded: { label: "Работы загружены", cls: "badge badge-primary" },
  processing: { label: "Проверяется…", cls: "badge badge-accent" },
  review: { label: "На разметке", cls: "badge badge-accent" },
  done: { label: "Завершена", cls: "badge badge-success" },
  failed: { label: "Ошибка", cls: "badge badge-error" },
};

export default async function ChecksPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user!.id;

  const jobs = await prisma.checkJob.findMany({
    where: { userId },
    include: {
      class: { select: { name: true } },
      product: { select: { title: true } },
      _count: { select: { results: true, uploads: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 980 }}>
      <div className="rl-row-between">
        <div>
          <h1 style={{ fontSize: "clamp(22px, 4vw, 30px)" }}>Проверка работ</h1>
          <p className="muted-2" style={{ marginTop: 4, fontSize: 14.5 }}>
            Загрузите работы учеников — получите баллы, проценты, отметки и отчёт.
          </p>
        </div>
        <Link href="/cabinet/checks/new" className="btn btn-primary">
          + Новая проверка
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="rl2-empty rl2-gridpaper" style={{ padding: 60 }}>
          <div className="big">✅</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--fg-2)" }}>
            Проверок пока нет
          </div>
          <div style={{ marginTop: 6, maxWidth: 460, marginLeft: "auto", marginRight: "auto" }}>
            Как это работает: выбираете материал и класс → печатаете и раздаёте лист →
            загружаете фото или PDF заполненных работ → система считает баллы и отметки,
            а красивый отчёт для родителей и завуча собирается в PDF.
          </div>
          <div style={{ marginTop: 14 }}>
            <Link href="/cabinet/checks/new" className="btn btn-primary">
              Создать первую проверку
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {jobs.map((j) => {
            const st = STATUS[j.status] ?? STATUS.draft;
            return (
              <Link
                key={j.id}
                href={`/cabinet/checks/${j.id}`}
                className="card card-hover"
                style={{ padding: 16, textDecoration: "none" }}
              >
                <div className="rl-row-between">
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontFamily: "var(--display)", fontSize: 15.5 }}>
                      {j.class?.name ? `${j.class.name} · ` : ""}
                      {j.title}
                    </div>
                    <div className="muted" style={{ fontSize: 12.5, marginTop: 3 }}>
                      {j.product?.title ? `${j.product.title} · ` : ""}
                      {j._count.uploads} файлов · {j._count.results} учеников ·{" "}
                      {j.createdAt.toLocaleDateString("ru-RU")}
                    </div>
                  </div>
                  <span className={st.cls}>{st.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
