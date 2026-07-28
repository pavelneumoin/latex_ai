import { MockPayments } from "./mock";
import { YooKassaPayments } from "./yookassa";
import type { PaymentsProvider } from "./types";
import { isMockPaymentsAllowed } from "./config";

const providers: Record<string, PaymentsProvider> = {
  mock: new MockPayments(),
  yookassa: new YooKassaPayments(),
  // qiwi: новый файл lib/payments/qiwi.ts — добавим при необходимости.
};

export function getPayments(): PaymentsProvider {
  const key = (process.env.PAYMENTS_PROVIDER || "mock").trim().toLowerCase();
  const p = providers[key];

  if (!p) {
    throw new Error(`payments_provider_unsupported:${key}`);
  }
  if (key === "mock" && !isMockPaymentsAllowed()) {
    throw new Error(
      "mock_payments_disabled: set PAYMENTS_PROVIDER=yookassa or explicitly enable ALLOW_MOCK_PAYMENTS=true"
    );
  }
  if (!p.isReady()) {
    throw new Error(`payments_provider_not_configured:${key}`);
  }
  return p;
}

export type { PaymentsProvider, CreatePaymentInput, CreatePaymentResult, WebhookEvent } from "./types";
export { isMockPaymentsAllowed } from "./config";
