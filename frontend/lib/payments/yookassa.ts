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

type YooKassaPayment = {
  id: string;
  status: string;
  amount?: {
    value: string;
    currency: string;
  };
  confirmation?: {
    confirmation_url?: string;
  };
};

function amountToKopecks(value: string): number | null {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value)) return null;
  const [rubles, kopecks = ""] = value.split(".");
  const amount = Number(rubles) * 100 + Number(kopecks.padEnd(2, "0"));
  return Number.isSafeInteger(amount) ? amount : null;
}

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
    const data = (await res.json()) as YooKassaPayment;

    const payment = await prisma.payment.create({
      data: {
        userId: input.userId,
        amount: input.amount,
        currency: input.currency ?? "RUB",
        // "succeeded" зарезервирован за атомарно обработанным webhook:
        // до выдачи entitlement локальная запись остаётся pending.
        status: "pending",
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
      status: "pending",
    };
  }

  async parseWebhook(_headers: Record<string, string>, body: unknown): Promise<WebhookEvent | null> {
    // Тело уведомления сообщает только id. Статус и сумма считаются достоверными
    // лишь после отдельного запроса к API ЮKassa с секретным ключом магазина.
    const notification = body as { object?: { id?: unknown } };
    const providerPaymentId =
      typeof notification?.object?.id === "string"
        ? notification.object.id.trim()
        : "";
    if (!providerPaymentId) return null;
    if (!this.isReady()) throw new Error("yookassa_not_configured");

    const res = await fetch(
      `${API_BASE}/payments/${encodeURIComponent(providerPaymentId)}`,
      {
        method: "GET",
        headers: {
          Authorization: this.authHeader(),
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );
    if (!res.ok) {
      throw new Error(`yookassa_verification_failed:${res.status}`);
    }

    const payment = (await res.json()) as YooKassaPayment;
    if (payment.id !== providerPaymentId) {
      throw new Error("yookassa_verification_id_mismatch");
    }
    if (!payment.amount?.currency) {
      throw new Error("yookassa_verification_amount_missing");
    }

    const amount = amountToKopecks(payment.amount.value);
    if (amount == null) {
      throw new Error("yookassa_verification_amount_invalid");
    }

    const status =
      payment.status === "succeeded"
        ? "succeeded"
        : payment.status === "canceled"
          ? "cancelled"
          : null;
    if (!status) return null;

    return {
      providerPaymentId,
      status,
      amount,
      currency: payment.amount.currency.toUpperCase(),
      raw: {
        notification: body,
        verifiedPayment: payment,
      },
    };
  }
}
