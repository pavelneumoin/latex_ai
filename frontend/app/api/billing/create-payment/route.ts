import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getPayments } from "@/lib/payments";

export const runtime = "nodejs";

const schema = z
  .object({
    planId: z.enum(["pro", "school"]).optional(),
    credits: z.number().int().min(1).max(10000).optional(),
  })
  .refine((d) => !!d.planId !== !!d.credits, {
    message: "expected exactly one of planId or credits",
  });

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
  let purpose: "subscription" | "credits" = "subscription";
  const metadata: Record<string, string | number> = {};

  if (parsed.data.planId) {
    const plan = await prisma.plan.findUnique({
      where: { id: parsed.data.planId },
    });
    if (!plan) {
      return NextResponse.json({ error: "plan_not_found" }, { status: 404 });
    }
    amount = plan.priceMonthly;
    description = `Подписка ${plan.name} (РабочийЛист.ai)`;
    purpose = "subscription";
    metadata.planId = plan.id;
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
    `${process.env.NEXTAUTH_URL || "http://localhost:3010"}/dashboard?paid=1`;

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
