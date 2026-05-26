// ЮKassa провайдер. Самописная fetch-обёртка (официального TS-SDK от ЮKassa нет).
// Документация: https://yookassa.ru/developers/api
// Утром: задать YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY в .env.local — провайдер
// автоматически станет ready и заменит mock (см. lib/payments/index.ts).

import { randomUUID } from "node:crypto";
import { prisma } from "../db";
import type {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentsProvider,
  WebhookEvent,
} from "./types";

const API_BASE = "https://api.yookassa.ru/v3";

export class YooKassaPayments implements PaymentsProvider {
  readonly name = "yookassa";

  isReady(): boolean {
    return Boolean(process.env.YOOKASSA_SHOP_ID && process.env.YOOKASSA_SECRET_KEY);
  }

  private authHeader(): string {
    const shopId = process.env.YOOKASSA_SHOP_ID!;
    const key = process.env.YOOKASSA_SECRET_KEY!;
    return "Basic " + Buffer.from(`${shopId}:${key}`).toString("base64");
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    if (!this.isReady()) throw new Error("yookassa_not_configured");

    const idempotenceKey = randomUUID();
    const payload = {
      amount: { value: (input.amount / 100).toFixed(2), currency: input.currency ?? "RUB" },
      capture: true,
      confirmation: { type: "redirect", return_url: input.returnUrl },
      description: input.description,
      metadata: { ...(input.metadata ?? {}), userId: input.userId, purpose: input.purpose },
    };

    const res = await fetch(`${API_BASE}/payments`, {
      method: "POST",
      headers: {
        Authorization: this.authHeader(),
        "Idempotence-Key": idempotenceKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`yookassa_error_${res.status}: ${text}`);
    }
    const data = (await res.json()) as {
      id: string;
      status: string;
      confirmation?: { confirmation_url?: string };
    };

    const payment = await prisma.payment.create({
      data: {
        userId: input.userId,
        amount: input.amount,
        currency: input.currency ?? "RUB",
        status: data.status === "succeeded" ? "succeeded" : "pending",
        provider: this.name,
        providerPaymentId: data.id,
        purpose: input.purpose,
        metadata: JSON.stringify(payload.metadata),
      },
    });

    return {
      paymentId: payment.id,
      providerPaymentId: data.id,
      confirmationUrl: data.confirmation?.confirmation_url ?? input.returnUrl,
      status: data.status === "succeeded" ? "succeeded" : "pending",
    };
  }

  async parseWebhook(_headers: Record<string, string>, body: unknown): Promise<WebhookEvent | null> {
    // YooKassa webhook: { event: "payment.succeeded" | ..., object: { id, status, amount: { value, currency } } }
    const b = body as {
      event?: string;
      object?: { id: string; status: string; amount?: { value: string; currency: string } };
    };
    if (!b?.object?.id) return null;
    const status =
      b.event === "payment.succeeded"
        ? "succeeded"
        : b.event === "payment.canceled"
          ? "cancelled"
          : "failed";
    return {
      providerPaymentId: b.object.id,
      status,
      amount: b.object.amount ? Math.round(parseFloat(b.object.amount.value) * 100) : 0,
      raw: body,
    };
  }
}
