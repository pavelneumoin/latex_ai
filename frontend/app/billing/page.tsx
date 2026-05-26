import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Header } from "../_components/Header";

export const dynamic = "force-dynamic";

function formatPrice(kopecks: number): string {
  if (kopecks === 0) return "0 ₽";
  return `${Math.round(kopecks / 100).toLocaleString("ru-RU")} ₽`;
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

function paymentStatusLabel(s: string): { text: string; color: string } {
  switch (s) {
    case "succeeded":
      return { text: "Оплачено", color: "#065F46" };
    case "pending":
      return { text: "В обработке", color: "#92400E" };
    case "failed":
      return { text: "Ошибка", color: "#991B1B" };
    case "cancelled":
      return { text: "Отменено", color: "#475569" };
    default:
      return { text: s, color: "#475569" };
  }
}

export default async function BillingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/billing");
  }
  const userId = session.user.id;

  const [subscription, payments] = await Promise.all([
    prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    }),
    prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  const plan = subscription?.plan;

  return (
    <div className="hi" style={{ minHeight: "100vh", background: "var(--surface)" }}>
      <Header />
      <main style={{ maxWidth: 980, margin: "0 auto", padding: "32px 28px 64px" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ marginBottom: 4 }}>Биллинг</h1>
          <p className="muted" style={{ fontSize: 14 }}>
            Управление подпиской и история платежей.
          </p>
        </div>

        {/* Current plan */}
        <div className="card" style={{ padding: 28, marginBottom: 24 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 16,
            }}
          >
            <div>
              <div style={{ fontFamily: "var(--display)", fontSize: 13, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Текущий тариф
              </div>
              <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 24, marginTop: 4 }}>
                {plan?.name ?? "Не назначен"}
              </div>
              {plan?.description && (
                <div className="muted" style={{ fontSize: 14, marginTop: 4 }}>
                  {plan.description}
                </div>
              )}
              {subscription?.currentPeriodEnd && (
                <div className="muted" style={{ fontSize: 13, marginTop: 12 }}>
                  Период до: {formatDate(subscription.currentPeriodEnd)}
                  {subscription.cancelAtPeriodEnd && " (отменён, не продлится)"}
                </div>
              )}
            </div>
            <Link href="/pricing" className="btn btn-blue">
              Сменить план
            </Link>
          </div>

          {subscription && plan && (
            <div
              style={{
                marginTop: 20,
                paddingTop: 20,
                borderTop: "1px solid var(--border)",
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 20,
              }}
            >
              <div>
                <div style={{ fontSize: 12, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Листы
                </div>
                <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 22, marginTop: 4 }}>
                  {subscription.usedWorksheets} / {plan.worksheetsLimit === -1 ? "∞" : plan.worksheetsLimit}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Варианты
                </div>
                <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 22, marginTop: 4 }}>
                  {subscription.usedVariants} / {plan.variantsLimit === -1 ? "∞" : plan.variantsLimit}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Автопроверки
                </div>
                <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 22, marginTop: 4 }}>
                  {subscription.usedChecks} / {plan.checksLimit === -1 ? "∞" : plan.checksLimit}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Payments history */}
        <h2 style={{ marginBottom: 12 }}>История платежей</h2>
        {payments.length === 0 ? (
          <div
            className="card"
            style={{
              padding: 40,
              textAlign: "center",
              color: "var(--fg-3)",
              fontSize: 14,
            }}
          >
            Платежей пока не было.
          </div>
        ) : (
          <div className="card" style={{ overflow: "hidden" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Назначение</th>
                  <th>Способ</th>
                  <th>Сумма</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => {
                  const s = paymentStatusLabel(p.status);
                  return (
                    <tr key={p.id}>
                      <td className="muted">{formatDate(p.createdAt)}</td>
                      <td>{p.purpose}</td>
                      <td style={{ textTransform: "capitalize" }}>{p.provider}</td>
                      <td style={{ fontWeight: 600 }}>{formatPrice(p.amount)}</td>
                      <td>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "3px 10px",
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 500,
                            background: "var(--surface-2)",
                            color: s.color,
                          }}
                        >
                          {s.text}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
