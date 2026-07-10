// Mock — для dev. Создаёт «успешный» платёж сразу, без редиректа на платёжку.

import { randomUUID } from "node:crypto";
import { prisma } from "../db";
import type {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentsProvider,
  WebhookEvent,
} from "./types";

export class MockPayments implements PaymentsProvider {
  readonly name = "mock";

  isReady(): boolean {
    return true;
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const providerPaymentId = `mock_${randomUUID()}`;

    const payment = await prisma.payment.create({
      data: {
        userId: input.userId,
        amount: input.amount,
        currency: input.currency ?? "RUB",
        status: "pending",
        provider: this.name,
        providerPaymentId,
        purpose: input.purpose,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      },
    });

    // В mock-режиме отправляем на нашу «тестовую кассу» /billing/checkout/[id]:
    // страница выглядит как платёжная форма и по кнопке «Оплатить» дёргает webhook.
    const base = process.env.NEXTAUTH_URL || "http://localhost:3010";
    const confirmationUrl = `${base}/billing/checkout/${payment.id}?return=${encodeURIComponent(
      input.returnUrl
    )}`;

    return {
      paymentId: payment.id,
      providerPaymentId,
      confirmationUrl,
      status: "pending",
    };
  }

  async parseWebhook(_headers: Record<string, string>, body: unknown): Promise<WebhookEvent | null> {
    const b = body as { providerPaymentId?: string; status?: string; amount?: number };
    if (!b?.providerPaymentId) return null;
    return {
      providerPaymentId: b.providerPaymentId,
      status: (b.status as "succeeded" | "failed" | "cancelled") ?? "succeeded",
      amount: b.amount ?? 0,
      raw: body,
    };
  }
}
