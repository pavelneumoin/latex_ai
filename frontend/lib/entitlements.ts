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

/** Ранг с учётом «нет доступа» = 0 (tierRank трактует null как basic=1). */
function accessRank(t: Tier | null): number {
  return t == null ? 0 : tierRank(t);
}

/**
 * Доступ пользователя к продукту.
 *
 * Фаза 1 (сейчас): все PDF (basic) открыты бесплатно у товаров с isFree=true;
 * исходники Marp/LaTeX (source) — только по подписке предмета или «Всё включено»
 * (или разовой покупке, если её когда-нибудь снова включат). Чтобы позже перевести
 * ВСЁ на подписку, достаточно снять isFree с товаров (см. ALL_FREE в
 * prisma/seed-library.ts) — тогда и basic-уровень потребует подписку.
 *
 * userId = null → доступен только бесплатный basic-уровень (скачивание всё равно
 * просит вход — так копится библиотека учителя), исходники закрыты.
 */
export async function getProductAccess(
  userId: string | null,
  product: { id: string; subject: string; isFree: boolean }
): Promise<ProductAccess> {
  let maxTier: Tier | null = null;
  let via: ProductAccess["via"] = null;
  let purchaseTier: Tier | null = null;

  // Бесплатный доступ к PDF (basic) — открытая база материалов.
  if (product.isFree) {
    maxTier = "basic";
    via = "free";
  }

  if (userId) {
    const [purchase, subs] = await Promise.all([
      prisma.purchase.findUnique({
        where: { userId_productId: { userId, productId: product.id } },
      }),
      getActiveSubscriptions(userId),
    ]);

    if (purchase) {
      purchaseTier = purchase.tier as Tier;
      const pt: Tier = purchase.tier === "source" ? "source" : "basic";
      if (accessRank(pt) > accessRank(maxTier)) {
        maxTier = pt;
        via = "purchase";
      }
    }

    // Подписка предмета (tier=source) или «Всё включено» открывает исходники.
    if (subsCover(subs, product.subject, "source") && accessRank("source") > accessRank(maxTier)) {
      maxTier = "source";
      via = "subscription";
    } else if (subsCover(subs, product.subject, "basic") && accessRank("basic") > accessRank(maxTier)) {
      maxTier = "basic";
      if (via == null) via = "subscription";
    }
  }

  return { maxTier, via, purchaseTier };
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
