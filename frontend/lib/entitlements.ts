// Права доступа v2: покупки поштучно + подписки по предметам + уровни материалов.
//
// Уровни (tier): basic = все PDF комплекта; source = PDF + исходники (Marp .md / LaTeX .tex).
// Подписка плана с tier="source" покрывает оба уровня; покупка source включает basic.

import { prisma } from "./db";
import type { Prisma } from "@prisma/client";

export type Tier = "basic" | "source";
export type Subject = "math" | "informatics";

export function tierRank(t: string): number {
  return t === "source" ? 2 : 1;
}

export type SubscriptionWithPlan = Prisma.SubscriptionGetPayload<{
  include: { plan: true };
}>;

/** Активные (не истёкшие) подписки пользователя со включёнными планами. */
export async function getActiveSubscriptions(
  userId: string
): Promise<SubscriptionWithPlan[]> {
  return prisma.subscription.findMany({
    where: {
      userId,
      status: "active",
      currentPeriodEnd: { gte: new Date() },
    },
    include: { plan: true },
    orderBy: { createdAt: "asc" },
  });
}

/** Лучшая (самая «широкая») активная подписка — для лимитов генератора/проверок. */
export async function getPrimarySubscription(
  userId: string
): Promise<SubscriptionWithPlan | null> {
  const subs = await getActiveSubscriptions(userId);
  if (subs.length === 0) return null;
  return subs.reduce((best, s) =>
    s.plan.priceMonthly > best.plan.priceMonthly ? s : best
  );
}

/** Покрывает ли какая-то активная подписка предмет+уровень. */
export function subsCover(
  subs: SubscriptionWithPlan[],
  subject: string,
  tier: Tier
): SubscriptionWithPlan | null {
  for (const s of subs) {
    const subjOk = s.plan.subject === "all" || s.plan.subject === subject;
    const tierOk = tierRank(s.plan.tier) >= tierRank(tier);
    if (subjOk && tierOk && s.plan.id !== "free") return s;
  }
  return null;
}

export interface ProductAccess {
  /** Максимальный доступный уровень: null = нет доступа даже к basic. */
  maxTier: Tier | null;
  via: "free" | "purchase" | "subscription" | null;
  purchaseTier: Tier | null;
}

/**
 * Доступ пользователя к продукту.
 * userId = null → только бесплатные материалы (basic-уровень без регистрации не скачиваем,
 * просим войти — но право показываем).
 */
export async function getProductAccess(
  userId: string | null,
  product: { id: string; subject: string; isFree: boolean }
): Promise<ProductAccess> {
  if (product.isFree) {
    // Бесплатные образцы открывают и исходники — это демо уровня source.
    return { maxTier: "source", via: "free", purchaseTier: null };
  }
  if (!userId) return { maxTier: null, via: null, purchaseTier: null };

  const [purchase, subs] = await Promise.all([
    prisma.purchase.findUnique({
      where: { userId_productId: { userId, productId: product.id } },
    }),
    getActiveSubscriptions(userId),
  ]);

  const viaSubSource = subsCover(subs, product.subject, "source");
  const viaSubBasic = subsCover(subs, product.subject, "basic");

  let maxTier: Tier | null = null;
  let via: ProductAccess["via"] = null;

  if (purchase) {
    maxTier = purchase.tier === "source" ? "source" : "basic";
    via = "purchase";
  }
  if (viaSubSource && tierRank("source") > tierRank(maxTier ?? "")) {
    maxTier = "source";
    via = "subscription";
  } else if (!maxTier && viaSubBasic) {
    maxTier = "basic";
    via = "subscription";
  }

  return {
    maxTier,
    via,
    purchaseTier: purchase ? (purchase.tier as Tier) : null,
  };
}

/** Может ли пользователь скачать конкретный ассет продукта. */
export async function canDownloadAsset(
  userId: string | null,
  product: { id: string; subject: string; isFree: boolean },
  assetTier: string
): Promise<boolean> {
  const access = await getProductAccess(userId, product);
  if (!access.maxTier) return false;
  return tierRank(access.maxTier) >= tierRank(assetTier);
}

/** Лимит автопроверок в текущем периоде (по лучшей подписке; без подписки — 0). */
export async function checkChecksLimit(userId: string): Promise<{
  ok: boolean;
  planId: string;
  used: number;
  limit: number; // -1 = безлимит
}> {
  const sub = await getPrimarySubscription(userId);
  if (!sub) return { ok: false, planId: "none", used: 0, limit: 0 };
  const limit = sub.plan.checksLimit;
  const used = sub.usedChecks;
  if (limit < 0) return { ok: true, planId: sub.planId, used, limit };
  return { ok: used < limit, planId: sub.planId, used, limit };
}

export async function incrementChecksUsage(userId: string, by = 1): Promise<void> {
  await prisma.subscription.updateMany({
    where: { userId, status: "active" },
    data: { usedChecks: { increment: by } },
  });
}

/** Человекочитаемое имя предмета. */
export function subjectLabel(s: string): string {
  return s === "informatics" ? "Информатика" : "Математика";
}

export function tierLabel(t: string): string {
  return t === "source" ? "PDF + исходники" : "PDF";
}
