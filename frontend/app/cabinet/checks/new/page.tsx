// Мастер новой проверки: материал → класс → название.

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getActiveSubscriptions, subsCover } from "@/lib/entitlements";
import { NewCheckClient } from "./NewCheckClient";

export const dynamic = "force-dynamic";

export default async function NewCheckPage({
  searchParams,
}: {
  searchParams: { classId?: string; productId?: string };
}) {
  const session = await getServerSession(authOptions);
  const userId = session!.user!.id;

  const [classes, purchases, subs, freeCheckable] = await Promise.all([
    prisma.class.findMany({
      where: { userId, archived: false },
      include: { _count: { select: { students: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.purchase.findMany({
      where: { userId },
      include: {
        product: { select: { id: true, title: true, subject: true, checkable: true, isPublished: true } },
      },
    }),
    getActiveSubscriptions(userId),
    prisma.product.findMany({
      where: { isPublished: true, isFree: true },
      select: { id: true, title: true, subject: true, checkable: true },
    }),
  ]);

  // Материалы, доступные для проверки: купленные + бесплатные + по подписке
  const map = new Map<string, { id: string; title: string; subject: string; checkable: boolean }>();
  for (const p of purchases) {
    if (p.product.isPublished) map.set(p.product.id, p.product);
  }
  for (const p of freeCheckable) map.set(p.id, p);
  for (const subj of ["math", "informatics"] as const) {
    if (subsCover(subs, subj, "basic")) {
      const list = await prisma.product.findMany({
        where: { isPublished: true, subject: subj, isFree: false },
        select: { id: true, title: true, subject: true, checkable: true },
      });
      for (const p of list) map.set(p.id, p);
    }
  }

  return (
    <NewCheckClient
      classes={classes.map((c) => ({
        id: c.id,
        name: c.name,
        students: c._count.students,
      }))}
      products={Array.from(map.values()).sort((a, b) => a.title.localeCompare(b.title, "ru"))}
      preselect={{
        classId: searchParams.classId ?? null,
        productId: searchParams.productId ?? null,
      }}
    />
  );
}
