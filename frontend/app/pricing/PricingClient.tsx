"use client";

// Тарифы v2: подписки по предметам, переключатель месяц/год, мягкие цены.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export interface PlanView {
  id: string;
  name: string;
  description: string | null;
  subject: string;
  tier: string;
  priceMonthly: number;
  priceYearly: number;
  checksLimit: number;
}

function rub(kopecks: number): string {
  return `${Math.round(kopecks / 100).toLocaleString("ru-RU")} ₽`;
}

const FEATURES: Record<string, string[]> = {
  free: [
    "Все PDF-материалы бесплатно",
    "Кабинет: классы и списки учеников",
    "10 автопроверок работ в месяц",
    "Новые материалы — сразу в каталоге",
  ],
  math: [
    "Все PDF по математике — бесплатно",
    "Редактируемые Marp/LaTeX-исходники по математике",
    "300 автопроверок в месяц",
    "LaTeX-отчёты по классам без ограничений",
  ],
  informatics: [
    "Все PDF по информатике — бесплатно",
    "Редактируемые Marp/LaTeX-исходники по информатике",
    "300 автопроверок в месяц",
    "LaTeX-отчёты по классам без ограничений",
  ],
  all: [
    "Исходники Marp/LaTeX по обоим предметам",
    "Математика и информатика — всё сразу",
    "Безлимит автопроверок",
    "Приоритетная поддержка и заявки на материалы",
  ],
};

export function PricingClient({
  plans,
  activePlanIds,
  loggedIn,
}: {
  plans: PlanView[];
  activePlanIds: string[];
  loggedIn: boolean;
}) {
  const router = useRouter();
  const [period, setPeriod] = useState<"month" | "year">("month");
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function subscribe(planId: string) {
    if (!loggedIn) {
      router.push(`/login?callbackUrl=/pricing`);
      return;
    }
    setBusyPlan(planId);
    setError(null);
    try {
      const res = await fetch("/api/billing/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, period }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
      window.location.href = data.confirmationUrl;
    } catch (e) {
      setError((e as Error).message);
      setBusyPlan(null);
    }
  }

  const ordered = [
    plans.find((p) => p.id === "free"),
    plans.find((p) => p.id === "math"),
    plans.find((p) => p.id === "informatics"),
    plans.find((p) => p.id === "all"),
  ].filter(Boolean) as PlanView[];

  return (
    <>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 30 }}>
        <div className="rl2-seg">
          <button type="button" className={period === "month" ? "on" : ""} onClick={() => setPeriod("month")}>
            Помесячно
          </button>
          <button type="button" className={period === "year" ? "on" : ""} onClick={() => setPeriod("year")}>
            На год <span style={{ color: "var(--success)", fontWeight: 800 }}>−25%</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{ color: "var(--error)", textAlign: "center", marginBottom: 16, fontSize: 14 }}>{error}</div>
      )}

      <div className="rl-grid rl-grid-4" style={{ gap: 16, alignItems: "stretch" }}>
        {ordered.map((p) => {
          const isFree = p.priceMonthly === 0;
          const isCurrent = activePlanIds.includes(p.id);
          const highlight = p.id === "all";
          const price = period === "year" && p.priceYearly > 0 ? p.priceYearly : p.priceMonthly;
          const monthlyEq = period === "year" && p.priceYearly > 0 ? Math.round(p.priceYearly / 12) : null;

          return (
            <div
              key={p.id}
              className="card"
              style={{
                padding: 22,
                display: "flex",
                flexDirection: "column",
                gap: 14,
                position: "relative",
                border: highlight ? "2px solid var(--primary)" : "1px solid var(--border)",
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
                    whiteSpace: "nowrap",
                  }}
                >
                  Максимум + исходники
                </div>
              )}

              <div>
                <div style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: 19 }}>{p.name}</div>
                {p.description && (
                  <div className="muted" style={{ fontSize: 12.5, marginTop: 4, minHeight: 34 }}>
                    {p.description}
                  </div>
                )}
              </div>

              <div>
                <span className="rl2-price" style={{ fontSize: 30 }}>
                  {isFree ? "0 ₽" : rub(period === "year" ? price : p.priceMonthly)}
                </span>
                <span className="muted" style={{ fontSize: 13 }}>
                  {isFree ? "" : period === "year" ? " / год" : " / мес"}
                </span>
                {monthlyEq != null && !isFree && (
                  <div className="rl2-price-note">≈ {rub(monthlyEq)} в месяц</div>
                )}
              </div>

              <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 7, fontSize: 13.5, color: "var(--fg-2)", flex: 1 }}>
                {(FEATURES[p.id] ?? []).map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>

              {isCurrent ? (
                <div className="badge badge-success" style={{ justifyContent: "center", padding: "10px 0" }}>
                  Ваш текущий план ✓
                </div>
              ) : isFree ? (
                <Link href={loggedIn ? "/catalog" : "/register"} className="btn btn-outline" style={{ width: "100%" }}>
                  {loggedIn ? "Открыть каталог" : "Начать бесплатно"}
                </Link>
              ) : (
                <button
                  type="button"
                  className={`btn ${highlight ? "btn-primary" : "btn-blue"}`}
                  style={{ width: "100%" }}
                  disabled={busyPlan !== null}
                  onClick={() => subscribe(p.id)}
                >
                  {busyPlan === p.id ? "Переходим к оплате…" : "Подключить"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
