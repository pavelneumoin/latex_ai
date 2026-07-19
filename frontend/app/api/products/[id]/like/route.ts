// Лайк материала (toggle). Покупка не требуется — только вход.

import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { checkRate, rateLimited } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Anti-abuse: не более 30 переключений лайка в минуту на пользователя.
  const r = checkRate("product-like", user.id, { limit: 30, windowMs: 60_000 });
  if (!r.ok) return rateLimited(r);

  const product = await prisma.product.findUnique({
    where: { id: params.id },
    select: { id: true, isPublished: true },
  });
  if (!product?.isPublished) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Транзакция: toggle + пересчёт денормализованного Product.likes атомарно,
  // иначе гонка двух запросов даёт дрейф счётчика или 500 по P2002.
  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.productLike.findUnique({
      where: { userId_productId: { userId: user.id, productId: product.id } },
    });

    let liked: boolean;
    if (existing) {
      await tx.productLike.delete({ where: { id: existing.id } });
      liked = false;
    } else {
      try {
        await tx.productLike.create({
          data: { userId: user.id, productId: product.id },
        });
        liked = true;
      } catch (e) {
        // Параллельный запрос уже успел поставить лайк — считаем этот toggle-off.
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === "P2002"
        ) {
          await tx.productLike.deleteMany({
            where: { userId: user.id, productId: product.id },
          });
          liked = false;
        } else {
          throw e;
        }
      }
    }

    const likes = await tx.productLike.count({ where: { productId: product.id } });
    await tx.product.update({ where: { id: product.id }, data: { likes } });
    return { liked, likes };
  });

  return NextResponse.json(result);
}
