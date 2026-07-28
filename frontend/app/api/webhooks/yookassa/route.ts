import { NextRequest, NextResponse } from "next/server";
import type { Payment, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  getPayments,
  type PaymentsProvider,
  type WebhookEvent,
} from "@/lib/payments";

export const runtime = "nodejs";

function parseMetadata<T>(payment: Payment): T | null {
  if (!payment.metadata) return null;
  try {
    return JSON.parse(payment.metadata) as T;
  } catch {
    return null;
  }
}

async function grantPaymentEntitlement(
  tx: Prisma.TransactionClient,
  payment: Payment
) {
  if (payment.purpose === "subscription") {
    const metadata = parseMetadata<{ planId?: string; period?: string }>(payment);
    const planId = metadata?.planId || "pro";
    const plan = await tx.plan.findUnique({ where: { id: planId } });
    const subject = plan?.subject ?? "all";

    const periodEnd = new Date();
    if (metadata?.period === "year") {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    await tx.subscription.upsert({
      where: {
        userId_subject: { userId: payment.userId, subject },
      },
      update: {
        planId,
        status: "active",
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        usedWorksheets: 0,
        usedVariants: 0,
        usedChecks: 0,
      },
      create: {
        userId: payment.userId,
        planId,
        subject,
        status: "active",
        currentPeriodEnd: periodEnd,
      },
    });
    return;
  }

  if (payment.purpose === "one_time") {
    const metadata = parseMetadata<{ productId?: string; tier?: string }>(
      payment
    );
    const productId = metadata?.productId;
    const tier = metadata?.tier === "source" ? "source" : "basic";
    if (!productId) return;

    const grant = async (targetProductId: string, paid: number) => {
      const existing = await tx.purchase.findUnique({
        where: {
          userId_productId: {
            userId: payment.userId,
            productId: targetProductId,
          },
        },
      });
      if (existing) {
        if (existing.tier !== "source" && tier === "source") {
          await tx.purchase.update({
            where: { id: existing.id },
            data: {
              tier,
              paymentId: payment.id,
              pricePaid: paid,
            },
          });
        }
        return;
      }

      await tx.purchase.create({
        data: {
          userId: payment.userId,
          productId: targetProductId,
          tier,
          pricePaid: paid,
          paymentId: payment.id,
        },
      });
    };

    await grant(productId, payment.amount);

    const product = await tx.product.findUnique({ where: { id: productId } });
    if (product?.kind === "course_bundle" && product.courseSlug) {
      const lessons = await tx.product.findMany({
        where: {
          courseSlug: product.courseSlug,
          kind: { not: "course_bundle" },
          isPublished: true,
        },
        select: { id: true },
      });
      for (const lesson of lessons) {
        await grant(lesson.id, 0);
      }
    }
    return;
  }

  if (payment.purpose === "credits") {
    const metadata = parseMetadata<{ credits?: number }>(payment);
    const credits = metadata?.credits ?? 0;
    if (credits > 0) {
      await tx.credit.create({
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

export async function POST(req: NextRequest) {
  // Подлинность события ЮKassa подтверждает provider через отдельный API-запрос.
  // Mock принимается только в явно разрешённом локальном/тестовом режиме.
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

  let provider: PaymentsProvider;
  let event: WebhookEvent | null;
  try {
    provider = getPayments();
    event = await provider.parseWebhook(headers, body);
  } catch (e) {
    const detail = (e as Error).message;
    console.error("[payment webhook] verification error", detail);
    const status =
      detail.startsWith("payments_provider_") ||
      detail.startsWith("mock_payments_disabled") ||
      detail.startsWith("yookassa_not_configured")
        ? 503
        : 502;
    return NextResponse.json(
      { error: "verification_failed" },
      { status }
    );
  }
  if (!event) {
    return NextResponse.json({ error: "unrecognized" }, { status: 200 });
  }

  // Идентификатор провайдера сверяется ещё и с выбранным провайдером:
  // mock-событие не сможет изменить платёж ЮKassa и наоборот.
  const payment = await prisma.payment.findFirst({
    where: {
      providerPaymentId: event.providerPaymentId,
      provider: provider.name,
    },
  });
  if (!payment) {
    console.warn(
      "[payment webhook] payment not found for providerPaymentId=",
      event.providerPaymentId
    );
    // createPayment получает providerPaymentId до сохранения локального Payment.
    // Уведомление может прийти в это короткое окно. Не подтверждаем его кодом 200:
    // ЮKassa повторяет доставку уведомлений с non-2xx, и следующий запрос сможет
    // сопоставить платёж, не ослабляя server-to-server проверку выше.
    return NextResponse.json(
      { error: "payment_not_ready", retryable: true },
      { status: 503 }
    );
  }

  if (
    event.amount !== payment.amount ||
    event.currency.toUpperCase() !== payment.currency.toUpperCase()
  ) {
    console.warn("[payment webhook] amount or currency mismatch", {
      paymentId: payment.id,
      provider: provider.name,
    });
    return NextResponse.json(
      { error: "payment_details_mismatch" },
      { status: 400 }
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      if (event.status === "succeeded") {
        // Сначала атомарно «захватываем» pending-платёж. При повторной доставке
        // updateMany вернёт 0, поэтому подписка/покупка/кредиты не выдаются ещё раз.
        const transition = await tx.payment.updateMany({
          where: {
            id: payment.id,
            status: { not: "succeeded" },
          },
          data: { status: "succeeded" },
        });
        if (transition.count === 0) {
          return { status: "succeeded", entitlementGranted: false };
        }

        await grantPaymentEntitlement(tx, payment);
        return { status: "succeeded", entitlementGranted: true };
      }

      // Позднее cancelled/failed-событие не должно откатить уже успешный платёж.
      const transition = await tx.payment.updateMany({
        where: {
          id: payment.id,
          status: { not: "succeeded" },
        },
        data: { status: event.status },
      });
      if (transition.count > 0) {
        return { status: event.status, entitlementGranted: false };
      }

      const current = await tx.payment.findUnique({
        where: { id: payment.id },
        select: { status: true },
      });
      return {
        status: current?.status ?? event.status,
        entitlementGranted: false,
      };
    });

    return NextResponse.json({
      ok: true,
      paymentId: payment.id,
      status: result.status,
      duplicate: event.status === "succeeded" && !result.entitlementGranted,
    });
  } catch (e) {
    console.error("[payment webhook] transaction failed", e);
    return NextResponse.json(
      { error: "processing_failed" },
      { status: 500 }
    );
  }
}
