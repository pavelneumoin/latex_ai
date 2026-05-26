// Платёжная абстракция: один интерфейс под YooKassa, QIWI, Tinkoff, mock.
// Утром: установить @yookassa-js/sdk-nodejs (или fetch-обёртку) и подключить YooKassaProvider.

export interface CreatePaymentInput {
  amount: number;          // копейки
  currency?: string;       // default "RUB"
  description: string;
  metadata?: Record<string, string | number | boolean>;
  returnUrl: string;
  userId: string;
  purpose: "subscription" | "credits" | "one_time";
}

export interface CreatePaymentResult {
  paymentId: string;        // наш Payment.id
  providerPaymentId: string;
  confirmationUrl: string;  // куда редиректить
  status: "pending" | "succeeded" | "failed";
}

export interface WebhookEvent {
  providerPaymentId: string;
  status: "succeeded" | "failed" | "cancelled";
  amount: number;
  raw: unknown;
}

export interface PaymentsProvider {
  readonly name: string;
  isReady(): boolean;
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  parseWebhook(headers: Record<string, string>, body: unknown): Promise<WebhookEvent | null>;
}
