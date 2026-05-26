import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  let session;
  try {
    session = await requireUser();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      school: true,
      subjects: true,
      grades: true,
      logoPath: true,
      watermark: true,
      accentColor: true,
      createdAt: true,
    },
  });
  if (!user) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const sub = await prisma.subscription.findUnique({
    where: { userId: user.id },
    include: { plan: true },
  });

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      school: user.school,
      subjects: user.subjects
        ? user.subjects.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
      grades: user.grades
        ? user.grades
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .map((g) => Number(g))
            .filter((g) => Number.isFinite(g))
        : [],
      logoPath: user.logoPath,
      watermark: user.watermark,
      accentColor: user.accentColor,
      createdAt: user.createdAt,
    },
    subscription: sub
      ? {
          planId: sub.planId,
          status: sub.status,
          usedWorksheets: sub.usedWorksheets,
          usedVariants: sub.usedVariants,
          usedChecks: sub.usedChecks,
          currentPeriodStart: sub.currentPeriodStart,
          currentPeriodEnd: sub.currentPeriodEnd,
          cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        }
      : null,
    plan: sub?.plan
      ? {
          id: sub.plan.id,
          name: sub.plan.name,
          description: sub.plan.description,
          priceMonthly: sub.plan.priceMonthly,
          worksheetsLimit: sub.plan.worksheetsLimit,
          variantsLimit: sub.plan.variantsLimit,
          checksLimit: sub.plan.checksLimit,
          marketplaceCommissionPct: sub.plan.marketplaceCommissionPct,
        }
      : null,
  });
}
