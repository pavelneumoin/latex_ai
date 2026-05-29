import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { bankStats } from "@/lib/bank";
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
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/dashboard");
  }
  const userId = session.user.id;

  const [user, subscription, recent, totalWorksheets, bank] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    }),
    prisma.worksheet.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.worksheet.count({ where: { userId } }),
    bankStats().catch(() => null),
  ]);

  const plan = subscription?.plan;
  const usedW = subscription?.usedWorksheets ?? 0;
  const limitW = plan?.worksheetsLimit ?? 0;
  const isUnlimited = limitW === -1;
  const usagePct = !plan || isUnlimited
    ? 0
    : Math.min(100, Math.round((usedW / Math.max(1, limitW)) * 100));

  return (
    <div className="hi" style={{ minHeight: "100vh", background: "var(--surface)" }}>
      <Header />
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 28px 64px" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ marginBottom: 4 }}>
            Привет{user?.name ? `, ${user.name}` : ""}!
          </h1>
          <p className="muted" style={{ fontSize: 15 }}>
            Что будем делать сегодня?
          </p>
        </div>

        {/* 4 quick cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 16,
            marginBottom: 28,
          }}
        >
          <Link
            href="/create"
            className="card card-hover"
            style={{ padding: 24, textDecoration: "none", color: "var(--fg)", display: "flex", flexDirection: "column", gap: 8 }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--accent-soft)", display: "grid", placeItems: "center", fontSize: 22, marginBottom: 6 }}>
              ✏️
            </div>
            <div style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 17 }}>Создать лист</div>
            <div className="muted" style={{ fontSize: 13 }}>Опиши тему — получи PDF за минуту</div>
          </Link>

          <Link
            href="/upload"
            className="card card-hover"
            style={{ padding: 24, textDecoration: "none", color: "var(--fg)", display: "flex", flexDirection: "column", gap: 8 }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "#EEF2FF", color: "#4338CA", display: "grid", placeItems: "center", fontSize: 22, marginBottom: 6 }}>
              ⬆️
            </div>
            <div style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 17 }}>Загрузить PDF</div>
            <div className="muted" style={{ fontSize: 13 }}>Превратить готовый PDF в рабочий лист</div>
          </Link>

          <Link
            href="/my"
            className="card card-hover"
            style={{ padding: 24, textDecoration: "none", color: "var(--fg)", display: "flex", flexDirection: "column", gap: 8 }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--primary-soft)", color: "var(--primary)", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 18, marginBottom: 6 }}>
              {totalWorksheets}
            </div>
            <div style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 17 }}>Мои листы</div>
            <div className="muted" style={{ fontSize: 13 }}>Создано: {totalWorksheets} листов</div>
          </Link>

          <Link
            href="/templates"
            className="card card-hover"
            style={{ padding: 24, textDecoration: "none", color: "var(--fg)", display: "flex", flexDirection: "column", gap: 8 }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "#D1FAE5", color: "#065F46", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
              {bank ? bank.total.toLocaleString("ru") : "8k+"}
            </div>
            <div style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 17 }}>Банк задач</div>
            <div className="muted" style={{ fontSize: 13 }}>
              {bank ? `${bank.total.toLocaleString("ru")} задач ЕГЭ/ОГЭ` : "Задачи из ФИПИ"}
            </div>
          </Link>
        </div>

        {/* Plan status */}
        <div className="card" style={{ padding: 24, marginBottom: 28 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <div>
              <div style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 18 }}>
                Тариф: {plan?.name ?? "не назначен"}
              </div>
              {plan?.description && (
                <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                  {plan.description}
                </div>
              )}
            </div>
            <Link href="/pricing" className="btn btn-outline">
              Сменить план
            </Link>
          </div>

          {plan && (
            <div style={{ marginTop: 16 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                  color: "var(--fg-2)",
                  marginBottom: 6,
                }}
              >
                <span>Листы в этом периоде</span>
                <span>
                  {usedW} из {isUnlimited ? "∞" : limitW}
                </span>
              </div>
              <div className="progress">
                <div className="progress-bar" style={{ width: `${usagePct}%` }} />
              </div>
              {subscription?.currentPeriodEnd && (
                <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>
                  Период до: {formatDate(subscription.currentPeriodEnd)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recent worksheets */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <h2>Последние листы</h2>
            <Link href="/my" style={{ color: "var(--primary)", textDecoration: "none", fontSize: 14 }}>
              Все мои листы →
            </Link>
          </div>

          {recent.length === 0 ? (
            <div
              className="card"
              style={{
                padding: 40,
                textAlign: "center",
                color: "var(--fg-3)",
                fontSize: 14,
              }}
            >
              У вас пока нет листов.{" "}
              <Link href="/create" style={{ color: "var(--primary)" }}>
                Создать первый
              </Link>
            </div>
          ) : (
            <div className="card" style={{ overflow: "hidden" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Название</th>
                    <th>Тема</th>
                    <th>Статус</th>
                    <th>Дата</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((w) => {
                    const b = statusBadge(w.status);
                    return (
                      <tr key={w.id}>
                        <td style={{ fontWeight: 500 }}>{w.title}</td>
                        <td className="muted">{w.topic ?? "—"}</td>
                        <td>
                          <span style={badgeStyle(b.color)}>{b.text}</span>
                        </td>
                        <td className="muted" style={{ fontSize: 13 }}>
                          {formatDate(w.createdAt)}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <Link
                            href={`/my/${w.id}`}
                            className="btn btn-outline btn-sm"
                          >
                            Открыть
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
