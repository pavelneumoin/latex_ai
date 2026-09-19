import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getPayments } from "@/lib/payments";

export const runtime = "nodejs";

const schema = z
  .object({
    planId: z.string().min(1).max(40).optional(),
    period: z.literal("month").optional(), // для подписки; default month
    productId: z.string().min(1).max(60).optional(),
    tier: z.enum(["basic", "source"]).optional(), // для покупки; default basic
    credits: z.number().int().min(1).max(10000).optional(),
  })
  .refine(
    (d) => [d.planId, d.productId, d.credits].filter(Boolean).length === 1,
    { message: "expected exactly one of planId, productId or credits" }
  );

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

  if (parsed.data.planId !== "all") return NextResponse.json({ error: "only_monthly_library_subscription_available" }, { status: 400 });

  const plan = await prisma.plan.findUnique({ where: { id: "all" } });
  if (!plan?.isActive || plan.priceMonthly <= 0) {
    return NextResponse.json({ error: "plan_not_found" }, { status: 404 });
  }
  const amount = plan.priceMonthly;
  const description = `Подписка «${plan.name}» на месяц (Неумошка)`;
  const purpose = "subscription";
  const metadata = { planId: plan.id, period: "month" };

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
