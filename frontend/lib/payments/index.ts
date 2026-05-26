import { MockPayments } from "./mock";
import { YooKassaPayments } from "./yookassa";
import type { PaymentsProvider } from "./types";

const providers: Record<string, PaymentsProvider> = {
  mock: new MockPayments(),
  yookassa: new YooKassaPayments(),
  // qiwi: новый файл lib/payments/qiwi.ts — добавим при необходимости.
};

export function getPayments(): PaymentsProvider {
  const key = process.env.PAYMENTS_PROVIDER || "mock";
  const p = providers[key];
  if (p && p.isReady()) return p;
  if (key !== "mock") {
    console.warn(`[payments] provider "${key}" not ready — falling back to mock`);
  }
  return providers.mock;
}

export type { PaymentsProvider, CreatePaymentInput, CreatePaymentResult, WebhookEvent } from "./types";
