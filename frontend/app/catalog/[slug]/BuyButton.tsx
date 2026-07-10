"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function BuyButton({
  productId,
  tier,
  label,
  className,
  loggedIn,
}: {
  productId: string;
  tier: "basic" | "source";
  label: string;
  className?: string;
  loggedIn: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function buy() {
    if (!loggedIn) {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, tier }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
      window.location.href = data.confirmationUrl;
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" className={className ?? "btn btn-primary"} disabled={busy} onClick={buy}>
        {busy ? "Переходим к оплате…" : label}
      </button>
      {error && <div style={{ color: "var(--error)", fontSize: 13, marginTop: 6 }}>{error}</div>}
    </>
  );
}
