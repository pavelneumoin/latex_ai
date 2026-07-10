// Кабинет · Обзор: сводка без перегруза — детали в разделах и LaTeX-отчётах.

import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getActiveSubscriptions, subjectLabel, tierLabel } from "@/lib/entitlements";
import { formatKopecks } from "@/lib/products";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  draft: "черновик",
  uploaded: "работы загружены",
  processing: "проверяется",
  review: "на разметке",
  done: "завершена",
  failed: "ошибка",
};

export default async function CabinetOverview() {
  const session = await getServerSession(authOptions);
  const userId = session!.user!.id;
  const firstName = (session?.user?.name || "").trim().split(/\s+/)[0] || "коллега";

  const [subs, purchases, checks, classes, reports] = await Promise.all([
    getActiveSubscriptions(userId),
    prisma.purchase.findMany({
      where: { userId },
      include: { product: { select: { title: true, slug: true, subject: true } } },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.checkJob.findMany({
      where: { userId },
      include: { class: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.class.count({ where: { userId, archived: false } }),
    prisma.report.count({ where: { userId } }),
  ]);

  const paidSubs = subs.filter((s) => s.planId !== "free");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1060 }}>
      <div className="rl-row-between">
        <div>
          <h1 style={{ fontSize: "clamp(22px, 4vw, 30px)" }}>Здравствуйте, {firstName}!</h1>
          <p className="muted-2" style={{ marginTop: 4, fontSize: 14.5 }}>
            Кабинет учителя: материалы, классы, проверка работ и отчёты.
          </p>
        </div>
        <div className="rl-row">
          <Link href="/catalog" className="btn btn-outline">
            Каталог
          </Link>
          <Link href="/cabinet/checks/new" className="btn btn-primary">
            + Новая проверка
          </Link>
        </div>
      </div>

      {/* Сводка */}
      <div className="rl-grid rl-grid-4">
        <div className="rl2-stat">
          <span className="rl2-stat-label">Материалы</span>
          <span className="rl2-stat-value">{purchasesCount(purchases.length)}</span>
          <Link href="/cabinet/library" style={{ fontSize: 12.5, color: "var(--primary)" }}>
            В библиотеку →
          </Link>
        </div>
        <div className="rl2-stat">
          <span className="rl2-stat-label">Классы</span>
          <span className="rl2-stat-value">{classes}</span>
          <Link href="/cabinet/classes" style={{ fontSize: 12.5, color: "var(--primary)" }}>
            К классам →
          </Link>
        </div>
        <div className="rl2-stat">
          <span className="rl2-stat-label">Проверки</span>
          <span className="rl2-stat-value">{checks.length > 0 ? checks.length : 0}</span>
          <Link href="/cabinet/checks" style={{ fontSize: 12.5, color: "var(--primary)" }}>
            К проверкам →
          </Link>
        </div>
        <div className="rl2-stat">
          <span className="rl2-stat-label">Отчёты</span>
          <span className="rl2-stat-value">{reports}</span>
          <Link href="/cabinet/reports" style={{ fontSize: 12.5, color: "var(--primary)" }}>
            К отчётам →
          </Link>
        </div>
      </div>

      {/* Подписка */}
      <div className="card" style={{ padding: 18 }}>
        <div className="rl-row-between">
          <div>
            <div style={{ fontWeight: 700, fontFamily: "var(--display)", fontSize: 16 }}>
              {paidSubs.length > 0
                ? paidSubs
                    .map((s) => `${s.plan.name} (${tierLabel(s.plan.tier)})`)
                    .join(" · ")
                : "Подписки нет — бесплатный доступ"}
            </div>
            <div className="muted" style={{ fontSize: 13, marginTop: 3 }}>
              {paidSubs.length > 0
                ? `Действует до ${paidSubs[0].currentPeriodEnd.toLocaleDateString("ru-RU")}`
                : "Подписка открывает все PDF предмета и автопроверку без ограничений."}
            </div>
          </div>
          <Link href={paidSubs.length > 0 ? "/cabinet/billing" : "/pricing"} className="btn btn-blue">
            {paidSubs.length > 0 ? "Управлять" : "Подключить"}
          </Link>
        </div>
      </div>

      <div className="rl-grid rl-grid-2" style={{ alignItems: "start" }}>
        {/* Последние покупки */}
        <div className="card" style={{ padding: 18 }}>
          <div className="rl-row-between" style={{ marginBottom: 12 }}>
            <h3>Библиотека</h3>
            <Link href="/cabinet/library" style={{ fontSize: 13, color: "var(--primary)" }}>
              Все →
            </Link>
          </div>
          {purchases.length === 0 ? (
            <div className="rl2-empty rl2-gridpaper">
              <div className="big">📚</div>
              Купленные материалы появятся здесь.
              <div style={{ marginTop: 10 }}>
                <Link href="/catalog" className="btn btn-sm btn-outline">
                  Открыть каталог
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {purchases.map((p) => (
                <Link
                  key={p.id}
                  href={`/catalog/${p.product.slug}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    textDecoration: "none",
                    fontSize: 14,
                  }}
                >
                  <span style={{ fontWeight: 600, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.product.title}
                  </span>
                  <span className="rl2-tier" data-tier={p.tier}>
                    {p.tier === "source" ? "исходники" : "PDF"}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Последние проверки */}
        <div className="card" style={{ padding: 18 }}>
          <div className="rl-row-between" style={{ marginBottom: 12 }}>
            <h3>Проверки</h3>
            <Link href="/cabinet/checks" style={{ fontSize: 13, color: "var(--primary)" }}>
              Все →
            </Link>
          </div>
          {checks.length === 0 ? (
            <div className="rl2-empty rl2-gridpaper">
              <div className="big">✅</div>
              Загрузите работы учеников — система посчитает баллы и отметки.
              <div style={{ marginTop: 10 }}>
                <Link href="/cabinet/checks/new" className="btn btn-sm btn-primary">
                  Новая проверка
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {checks.map((c) => (
                <Link
                  key={c.id}
                  href={`/cabinet/checks/${c.id}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    textDecoration: "none",
                    fontSize: 14,
                  }}
                >
                  <span style={{ fontWeight: 600, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.class?.name ? `${c.class.name} · ` : ""}
                    {c.title}
                  </span>
                  <span className="badge">{STATUS_LABEL[c.status] ?? c.status}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function purchasesCount(n: number): string {
  return String(n);
}
