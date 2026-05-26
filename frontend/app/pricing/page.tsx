import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Header } from "../_components/Header";
import { SelectPlanButton } from "./SelectPlanButton";

export const dynamic = "force-dynamic";

function formatPrice(kopecks: number): string {
  if (kopecks === 0) return "0 ₽";
  return `${Math.round(kopecks / 100).toLocaleString("ru-RU")} ₽`;
}

function limitText(n: number, what: string): string {
  if (n === -1) return `Безлимит ${what}`;
  return `${n} ${what}`;
}

export default async function PricingPage() {
  const [session, plans] = await Promise.all([
    getServerSession(authOptions),
    prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { priceMonthly: "asc" },
    }),
  ]);

  const userId = session?.user?.id;
  const subscription = userId
    ? await prisma.subscription.findUnique({ where: { userId } })
    : null;

  return (
    <div className="hi" style={{ minHeight: "100vh", background: "var(--surface)" }}>
      <Header />
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 28px 64px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1 style={{ marginBottom: 8 }}>Тарифы</h1>
          <p className="muted-2" style={{ fontSize: 16, maxWidth: 620, margin: "0 auto" }}>
            Выберите план под свою нагрузку. Все тарифы — без ограничений по творчеству, только по количеству листов в месяц.
          </p>
        </div>

        {plans.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--fg-3)" }}>
            Тарифы пока не настроены.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${Math.min(plans.length, 3)}, 1fr)`,
              gap: 20,
            }}
          >
            {plans.map((p, idx) => {
              const isCurrent = subscription?.planId === p.id;
              const isFree = p.priceMonthly === 0;
              const highlight = idx === 1 || (plans.length === 2 && idx === 1);
              return (
                <div
                  key={p.id}
                  className="card"
                  style={{
                    padding: 28,
                    border: highlight ? "2px solid var(--primary)" : "1px solid var(--border)",
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                  }}
                >
                  {highlight && (
                    <div
                      style={{
                        position: "absolute",
                        top: -12,
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "var(--primary)",
                        color: "white",
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        padding: "4px 12px",
                        borderRadius: 999,
                      }}
                    >
                      Популярный
                    </div>
                  )}

                  <div>
                    <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 22 }}>
                      {p.name}
                    </div>
                    {p.description && (
                      <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                        {p.description}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <div style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: 36 }}>
                      {formatPrice(p.priceMonthly)}
                    </div>
                    {!isFree && <div className="muted" style={{ fontSize: 14 }}>/ мес</div>}
                  </div>

                  <ul
                    style={{
                      listStyle: "none",
                      padding: 0,
                      margin: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                      fontSize: 14,
                      color: "var(--fg-2)",
                    }}
                  >
                    <li>✓ {limitText(p.worksheetsLimit, "листов в месяц")}</li>
                    <li>✓ {limitText(p.variantsLimit, "доп-вариантов")}</li>
                    <li>✓ {limitText(p.checksLimit, "автопроверок")}</li>
                    <li>✓ Комиссия маркетплейса {p.marketplaceCommissionPct}%</li>
                  </ul>

                  <div style={{ marginTop: "auto" }}>
                    <SelectPlanButton
                      planId={p.id}
                      isCurrent={isCurrent}
                      isFree={isFree}
                      loggedIn={Boolean(userId)}
                      highlight={highlight}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div
          style={{
            marginTop: 32,
            padding: 16,
            background: "var(--accent-soft)",
            color: "#92400E",
            borderRadius: 12,
            fontSize: 13,
            textAlign: "center",
          }}
        >
          MVP: оплата работает в mock-режиме. Реальные платежи через ЮKassa подключим после получения ключей.
        </div>
      </main>
    </div>
  );
}
