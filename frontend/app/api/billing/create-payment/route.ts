import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getPayments } from "@/lib/payments";

export const runtime = "nodejs";

const schema = z
  .object({
    planId: z.string().min(1).max(40).optional(),
    period: z.enum(["month", "year"]).optional(), // для подписки; default month
    productId: z.string().min(1).max(60).optional(),
    tier: z.enum(["basic", "source"]).optional(), // для покупки; default basic
    credits: z.number().int().min(1).max(10000).optional(),
  })
  .refine(
    (d) => [d.planId, d.productId, d.credits].filter(Boolean).length === 1,
    { message: "expected exactly one of planId, productId or credits" }
  );

const CREDIT_PRICE_KOPEEK = 1000; // ₽10 за 1 «генерацию» — пересмотрим утром.

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  let amount = 0;
  let description = "";
  let purpose: "subscription" | "credits" | "one_time" = "subscription";
  const metadata: Record<string, string | number> = {};

  if (parsed.data.planId) {
    const plan = await prisma.plan.findUnique({
      where: { id: parsed.data.planId },
    });
    if (!plan || !plan.isActive || plan.priceMonthly <= 0) {
      return NextResponse.json({ error: "plan_not_found" }, { status: 404 });
    }
    const period = parsed.data.period === "year" && plan.priceYearly > 0 ? "year" : "month";
    amount = period === "year" ? plan.priceYearly : plan.priceMonthly;
    description = `Подписка «${plan.name}» на ${period === "year" ? "год" : "месяц"} (РабочийЛист.ai)`;
    purpose = "subscription";
    metadata.planId = plan.id;
    metadata.period = period;
  } else if (parsed.data.productId) {
    const product = await prisma.product.findUnique({
      where: { id: parsed.data.productId },
    });
    if (!product || !product.isPublished) {
      return NextResponse.json({ error: "product_not_found" }, { status: 404 });
    }
    const tier = parsed.data.tier === "source" ? "source" : "basic";
    if (tier === "source" && product.priceSource == null) {
      return NextResponse.json({ error: "tier_unavailable" }, { status: 400 });
    }
    if (product.isFree) {
      return NextResponse.json({ error: "product_is_free" }, { status: 400 });
    }
    // Апгрейд basic → source: доплата разницы
    const existing = await prisma.purchase.findUnique({
      where: { userId_productId: { userId: user.id, productId: product.id } },
    });
    if (existing && existing.tier === "source") {
      return NextResponse.json({ error: "already_purchased" }, { status: 400 });
    }
    if (existing && tier === "basic") {
      return NextResponse.json({ error: "already_purchased" }, { status: 400 });
    }
    const basePrice = tier === "source" ? product.priceSource! : product.priceBasic;
    amount = existing && tier === "source"
      ? Math.max(basePrice - existing.pricePaid, 100) // доплата, минимум 1 ₽
      : basePrice;
    description = `«${product.title}» — уровень ${tier === "source" ? "PDF + исходники" : "PDF"} (РабочийЛист.ai)`;
    purpose = "one_time";
    metadata.productId = product.id;
    metadata.tier = tier;
  } else if (parsed.data.credits) {
    amount = parsed.data.credits * CREDIT_PRICE_KOPEEK;
    description = `Пакет ${parsed.data.credits} генераций (РабочийЛист.ai)`;
    purpose = "credits";
    metadata.credits = parsed.data.credits;
  }

  if (amount <= 0) {
    return NextResponse.json({ error: "invalid_amount" }, { status: 400 });
  }

  const returnUrl =
    process.env.YOOKASSA_RETURN_URL ||
    `${process.env.NEXTAUTH_URL || "http://localhost:3010"}/cabinet?paid=1`;

  try {
    const result = await getPayments().createPayment({
      amount,
      description,
      metadata,
      returnUrl,
      userId: user.id,
      purpose,
    });

    return NextResponse.json({
      confirmationUrl: result.confirmationUrl,
      paymentId: result.paymentId,
      providerPaymentId: result.providerPaymentId,
      status: result.status,
      amount,
      currency: "RUB",
    });
  } catch (e) {
    console.error("[create-payment] error", e);
    return NextResponse.json(
      { error: "payment_failed", detail: (e as Error).message },
      { status: 500 }
    );
  }
}
