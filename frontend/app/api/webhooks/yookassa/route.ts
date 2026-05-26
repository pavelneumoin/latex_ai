import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPayments } from "@/lib/payments";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // У ЮKassa нет HMAC подписи — рекомендуется проверка по IP-whitelist.
  // В mock-режиме просто принимаем тело.
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const headers: Record<string, string> = {};
  req.headers.forEach((v, k) => {
    headers[k] = v;
  });

  let event;
  try {
    event = await getPayments().parseWebhook(headers, body);
  } catch (e) {
    console.error("[yookassa webhook] parse error", e);
    return NextResponse.json(
      { error: "parse_failed", detail: (e as Error).message },
      { status: 400 }
    );
  }
  if (!event) {
    return NextResponse.json({ error: "unrecognized" }, { status: 200 });
  }

  // Найдём наш Payment по providerPaymentId
  const payment = await prisma.payment.findFirst({
    where: { providerPaymentId: event.providerPaymentId },
  });
  if (!payment) {
    console.warn(
      "[yookassa webhook] payment not found for providerPaymentId=",
      event.providerPaymentId
    );
    return NextResponse.json({ ok: true, ignored: true });
  }

  // Обновляем статус
  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: { status: event.status },
  });

  // Если оплата прошла и это подписка — продлеваем
  if (event.status === "succeeded") {
    if (payment.purpose === "subscription") {
      const metaRaw = payment.metadata
        ? (() => {
            try {
              return JSON.parse(payment.metadata) as { planId?: string };
            } catch {
              return null;
            }
          })()
        : null;
      const planId = metaRaw?.planId || "pro";

      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      const existing = await prisma.subscription.findUnique({
        where: { userId: payment.userId },
      });
      if (existing) {
        await prisma.subscription.update({
          where: { userId: payment.userId },
          data: {
            planId,
            status: "active",
            currentPeriodStart: new Date(),
            currentPeriodEnd: periodEnd,
            // Сброс счётчиков нового периода
            usedWorksheets: 0,
            usedVariants: 0,
            usedChecks: 0,
          },
        });
      } else {
        await prisma.subscription.create({
          data: {
            userId: payment.userId,
            planId,
            status: "active",
            currentPeriodEnd: periodEnd,
          },
        });
      }
    } else if (payment.purpose === "credits") {
      // Кредиты — записываем как entry в Credit
      const metaRaw = payment.metadata
        ? (() => {
            try {
              return JSON.parse(payment.metadata) as { credits?: number };
            } catch {
              return null;
            }
          })()
        : null;
      const credits = metaRaw?.credits ?? 0;
      if (credits > 0) {
        await prisma.credit.create({
          data: {
            userId: payment.userId,
            amount: credits,
            kind: "worksheets",
            reason: "purchase",
            refId: payment.id,
          },
        });
      }
    }
  }

  return NextResponse.json({ ok: true, paymentId: updated.id, status: updated.status });
}
