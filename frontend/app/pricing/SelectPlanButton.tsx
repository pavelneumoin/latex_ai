"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  planId: string;
  isCurrent: boolean;
  isFree: boolean;
  loggedIn: boolean;
  highlight: boolean;
};

type CreatePaymentResponse = {
  confirmationUrl?: string;
  mock?: boolean;
  error?: string;
};

export function SelectPlanButton({ planId, isCurrent, isFree, loggedIn, highlight }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);

  async function onClick(): Promise<void> {
    if (isCurrent) return;
    if (!loggedIn) {
      router.push(`/login?callbackUrl=/pricing`);
      return;
    }
    if (isFree) {
      // Free plans: just call create-payment with planId, will trigger downgrade flow
      // For safety, redirect to billing
      router.push("/billing");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/billing/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data: CreatePaymentResponse = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErr(data.error ?? "Не удалось создать платёж");
        return;
      }
      if (data.confirmationUrl) {
        window.location.href = data.confirmationUrl;
        return;
      }
      router.push("/billing/success?mock=1");
    } catch {
      setErr("Не удалось связаться с сервером");
    } finally {
      setBusy(false);
    }
  }

  const label = isCurrent
    ? "Ваш текущий тариф"
    : isFree
      ? "Бесплатно"
      : busy
        ? "Готовим оплату..."
        : "Выбрать";

  return (
    <div>
      <button
        type="button"
        className={highlight ? "btn btn-primary btn-lg" : "btn btn-outline btn-lg"}
        disabled={busy || isCurrent}
        onClick={onClick}
        style={{ width: "100%" }}
      >
        {label}
      </button>
      {err && (
        <div
          style={{
            marginTop: 8,
            padding: "6px 10px",
            background: "#FEE2E2",
            color: "#991B1B",
            borderRadius: 8,
            fontSize: 12,
          }}
        >
          {err}
        </div>
      )}
    </div>
  );
}
