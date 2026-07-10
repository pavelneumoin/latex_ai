"use client";

import { useState } from "react";

export function CheckoutClient({
  payment,
  returnUrl,
}: {
  payment: {
    id: string;
    providerPaymentId: string;
    amountLabel: string;
    status: string;
    title: string;
  };
  returnUrl: string;
}) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(payment.status === "succeeded");
  const [error, setError] = useState<string | null>(null);

  async function pay(status: "succeeded" | "cancelled") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/webhooks/yookassa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerPaymentId: payment.providerPaymentId,
          status,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (status === "succeeded") {
        setDone(true);
        setTimeout(() => {
          window.location.href = returnUrl;
        }, 900);
      } else {
        window.location.href = "/cabinet/billing";
      }
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="card" style={{ width: "min(430px, 96vw)", padding: 26 }}>
      <div className="rl-row" style={{ gap: 10, marginBottom: 18 }}>
        <span
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: "var(--primary)",
            color: "white",
            display: "grid",
            placeItems: "center",
            fontWeight: 800,
            fontFamily: "var(--display)",
            fontSize: 13,
          }}
        >
          ТК
        </span>
        <div>
          <div style={{ fontWeight: 700, fontFamily: "var(--display)", fontSize: 15 }}>
            Тестовая касса
          </div>
          <div className="muted" style={{ fontSize: 11.5 }}>
            локальный режим · боевая оплата: ЮKassa (карты РФ, СБП)
          </div>
        </div>
      </div>

      <div className="rl-row-between" style={{ marginBottom: 6 }}>
        <span className="muted-2" style={{ fontSize: 14 }}>
          {payment.title}
        </span>
        <span className="rl2-price" style={{ fontSize: 26 }}>
          {payment.amountLabel}
        </span>
      </div>

      {done ? (
        <div
          style={{
            background: "var(--success-soft)",
            color: "#065F46",
            borderRadius: 12,
            padding: "16px 18px",
            fontWeight: 700,
            textAlign: "center",
            marginTop: 12,
          }}
        >
          ✓ Оплачено! Возвращаемся…
        </div>
      ) : (
        <>
          {/* Псевдо-форма карты */}
          <div
            style={{
              border: "1px solid var(--border-2)",
              borderRadius: 12,
              padding: 14,
              margin: "12px 0 16px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <input className="rl-input" value="4242 4242 4242 4242" readOnly aria-label="Номер карты (тест)" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <input className="rl-input" value="12/29" readOnly aria-label="Срок" />
              <input className="rl-input" value="123" readOnly aria-label="CVC" />
            </div>
            <div className="muted" style={{ fontSize: 11.5 }}>
              Тестовые данные — реальные деньги не списываются.
            </div>
          </div>

          {error && (
            <div style={{ color: "var(--error)", fontSize: 13, marginBottom: 10 }}>{error}</div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button
              type="button"
              className="btn btn-primary btn-lg"
              disabled={busy}
              onClick={() => pay("succeeded")}
            >
              {busy ? "Проводим платёж…" : `Оплатить ${payment.amountLabel}`}
            </button>
            <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => pay("cancelled")}>
              Отменить
            </button>
          </div>
        </>
      )}
    </div>
  );
}
