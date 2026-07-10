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

  // Если оплата прошла — активируем то, за что платили
  if (event.status === "succeeded") {
    if (payment.purpose === "subscription") {
      const metaRaw = payment.metadata
        ? (() => {
            try {
              return JSON.parse(payment.metadata) as {
                planId?: string;
                period?: string; // month | year
              };
            } catch {
              return null;
            }
          })()
        : null;
      const planId = metaRaw?.planId || "pro";
      const plan = await prisma.plan.findUnique({ where: { id: planId } });
      const subject = plan?.subject ?? "all";

      const periodEnd = new Date();
      if (metaRaw?.period === "year") {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      // Подписки раздельные по предметам: upsert по (userId, subject)
      await prisma.subscription.upsert({
        where: {
          userId_subject: { userId: payment.userId, subject },
        },
        update: {
          planId,
          status: "active",
          currentPeriodStart: new Date(),
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
          // Сброс счётчиков нового периода
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
    } else if (payment.purpose === "one_time") {
      // Покупка материала из каталога: metadata { productId, tier }
      const metaRaw = payment.metadata
        ? (() => {
            try {
              return JSON.parse(payment.metadata) as {
                productId?: string;
                tier?: string;
              };
            } catch {
              return null;
            }
          })()
        : null;
      const productId = metaRaw?.productId;
      const tier = metaRaw?.tier === "source" ? "source" : "basic";
      if (productId) {
        const grant = async (pid: string, paid: number) => {
          const existing = await prisma.purchase.findUnique({
            where: { userId_productId: { userId: payment.userId, productId: pid } },
          });
          if (existing) {
            // Апгрейд уровня (basic → source); даунгрейда не бывает.
            if (existing.tier !== "source" && tier === "source") {
              await prisma.purchase.update({
                where: { id: existing.id },
                data: { tier, paymentId: payment.id, pricePaid: paid },
              });
            }
          } else {
            await prisma.purchase.create({
              data: {
                userId: payment.userId,
                productId: pid,
                tier,
                pricePaid: paid,
                paymentId: payment.id,
              },
            });
          }
        };

        await grant(productId, payment.amount);

        // Бандл курса открывает все его уроки.
        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (product?.kind === "course_bundle" && product.courseSlug) {
          const lessons = await prisma.product.findMany({
            where: {
              courseSlug: product.courseSlug,
              kind: { not: "course_bundle" },
              isPublished: true,
            },
            select: { id: true },
          });
          for (const l of lessons) {
            await grant(l.id, 0);
          }
        }
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
