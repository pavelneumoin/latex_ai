// Кабинет · Подписка и платежи: статус по предметам, покупки, история.

import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getActiveSubscriptions, subjectLabel, tierLabel } from "@/lib/entitlements";
import { formatKopecks } from "@/lib/products";

export const dynamic = "force-dynamic";

const PAY_STATUS: Record<string, string> = {
  pending: "ожидает",
  succeeded: "оплачен",
  failed: "ошибка",
  cancelled: "отменён",
};

export default async function CabinetBillingPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user!.id;

  const [subs, purchases, payments] = await Promise.all([
    getActiveSubscriptions(userId),
    prisma.purchase.findMany({
      where: { userId },
      include: { product: { select: { title: true, slug: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const paidSubs = subs.filter((s) => s.planId !== "free");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 900 }}>
      <div>
        <h1 style={{ fontSize: "clamp(22px, 4vw, 30px)" }}>Подписка и платежи</h1>
        <p className="muted-2" style={{ marginTop: 4, fontSize: 14.5 }}>
          Подписки раздельные: математика и информатика. Покупки — навсегда.
        </p>
      </div>

      {/* Подписки */}
      <div className="card" style={{ padding: 18 }}>
        <div className="rl-row-between" style={{ marginBottom: 12 }}>
          <h3>Подписки</h3>
          <Link href="/pricing" className="btn btn-sm btn-outline">
            Тарифы
          </Link>
        </div>
        {paidSubs.length === 0 ? (
          <div className="rl2-empty rl2-gridpaper">
            <div className="big">🔓</div>
            Активных подписок нет. Бесплатный доступ: открытые материалы и 10 проверок в месяц.
            <div style={{ marginTop: 12 }}>
              <Link href="/pricing" className="btn btn-primary">
                Выбрать подписку
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {paidSubs.map((s) => (
              <div
                key={s.id}
                className="rl-row-between"
                style={{
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontFamily: "var(--display)" }}>
                    {s.plan.name}{" "}
                    <span className="rl2-tier" data-tier={s.plan.tier} style={{ marginLeft: 6 }}>
                      {tierLabel(s.plan.tier)}
                    </span>
                  </div>
                  <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>
                    {s.plan.subject === "all"
                      ? "Оба предмета"
                      : subjectLabel(s.plan.subject)}{" "}
                    · до {s.currentPeriodEnd.toLocaleDateString("ru-RU")} · проверок
                    использовано: {s.usedChecks}
                    {s.plan.checksLimit > 0 ? ` из ${s.plan.checksLimit}` : " (безлимит)"}
                  </div>
                </div>
                <span className="badge badge-success">активна</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Покупки */}
      <div className="card" style={{ padding: 18 }}>
        <h3 style={{ marginBottom: 12 }}>Покупки</h3>
        {purchases.length === 0 ? (
          <p className="muted" style={{ fontSize: 13.5 }}>
            Купленных материалов пока нет — загляните в{" "}
            <Link href="/catalog" style={{ color: "var(--primary)" }}>
              каталог
            </Link>
            .
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {purchases.map((p) => (
              <div key={p.id} className="rl-row-between" style={{ fontSize: 14 }}>
                <Link href={`/catalog/${p.product.slug}`} style={{ fontWeight: 600, textDecoration: "none" }}>
                  {p.product.title}
                </Link>
                <span className="rl-row" style={{ gap: 8 }}>
                  <span className="rl2-tier" data-tier={p.tier}>
                    {tierLabel(p.tier)}
                  </span>
                  <span className="muted" style={{ fontSize: 12.5 }}>
                    {p.pricePaid > 0 ? formatKopecks(p.pricePaid) : "—"}
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* История платежей */}
      <div className="card" style={{ padding: 18 }}>
        <h3 style={{ marginBottom: 12 }}>История платежей</h3>
        {payments.length === 0 ? (
          <p className="muted" style={{ fontSize: 13.5 }}>
            Платежей ещё не было.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Сумма</th>
                  <th>Назначение</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td>{p.createdAt.toLocaleDateString("ru-RU")}</td>
                    <td style={{ fontWeight: 600 }}>{formatKopecks(p.amount)}</td>
                    <td className="muted">
                      {p.purpose === "subscription"
                        ? "Подписка"
                        : p.purpose === "one_time"
                          ? "Покупка материала"
                          : "Пакет генераций"}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          p.status === "succeeded"
                            ? "badge-success"
                            : p.status === "pending"
                              ? "badge-accent"
                              : "badge-error"
                        }`}
                      >
                        {PAY_STATUS[p.status] ?? p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="muted" style={{ fontSize: 12.5 }}>
        Оплата сейчас работает в тестовом режиме (локальная касса). Перед запуском
        подключаем ЮKassa: карты РФ, СБП, чеки по 54-ФЗ. Хостинг — Yandex Cloud.
      </p>
    </div>
  );
}
