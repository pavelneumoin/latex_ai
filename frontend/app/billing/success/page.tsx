import Link from "next/link";
import { Header } from "../../_components/Header";

export const dynamic = "force-dynamic";

type SP = { pid?: string; mock?: string; status?: string };

export default function BillingSuccessPage({ searchParams }: { searchParams: SP }) {
  const isMock = searchParams.mock === "1";
  const pid = searchParams.pid ?? null;
  const status = searchParams.status ?? "succeeded";

  let title: string;
  let subtitle: string;

  if (isMock) {
    title = "Платёж принят (mock)";
    subtitle = "Это тестовый платёж — реальные деньги не списались. Реальные платежи через ЮKassa подключим после получения ключей.";
  } else if (status === "pending") {
    title = "Платёж в обработке";
    subtitle = "ЮKassa обрабатывает ваш платёж. Подписка активируется автоматически после подтверждения — обычно это занимает до минуты.";
  } else {
    title = "Платёж принят";
    subtitle = "Спасибо! Ваша подписка активирована. Можно идти создавать листы.";
  }

  return (
    <div className="hi" style={{ minHeight: "100vh", background: "var(--surface)" }}>
      <Header />
      <main style={{ display: "grid", placeItems: "center", padding: "64px 24px" }}>
        <div
          className="card"
          style={{
            width: "100%",
            maxWidth: 480,
            padding: 40,
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 999,
              background: status === "pending" ? "var(--accent-soft)" : "#D1FAE5",
              color: status === "pending" ? "#92400E" : "#065F46",
              display: "grid",
              placeItems: "center",
              margin: "0 auto 20px",
              fontSize: 36,
              fontWeight: 700,
            }}
          >
            {status === "pending" ? "..." : "✓"}
          </div>
          <h1 style={{ marginBottom: 10 }}>{title}</h1>
          <p className="muted-2" style={{ fontSize: 15, lineHeight: 1.55, marginBottom: 24 }}>
            {subtitle}
          </p>
          {pid && (
            <div
              style={{
                padding: "8px 12px",
                background: "var(--surface)",
                borderRadius: 8,
                fontSize: 12,
                color: "var(--fg-3)",
                marginBottom: 24,
                fontFamily: "monospace",
              }}
            >
              ID платежа: {pid}
            </div>
          )}
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <Link href="/dashboard" className="btn btn-blue btn-lg">
              В кабинет
            </Link>
            <Link href="/billing" className="btn btn-outline btn-lg">
              История платежей
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
