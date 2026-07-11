// Лайк материала (toggle). Покупка не требуется — только вход.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

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

  const product = await prisma.product.findUnique({
    where: { id: params.id },
    select: { id: true, isPublished: true },
  });
  if (!product?.isPublished) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const existing = await prisma.productLike.findUnique({
    where: { userId_productId: { userId: user.id, productId: product.id } },
  });

  let liked: boolean;
  if (existing) {
    await prisma.productLike.delete({ where: { id: existing.id } });
    liked = false;
  } else {
    await prisma.productLike.create({
      data: { userId: user.id, productId: product.id },
    });
    liked = true;
  }

  const likes = await prisma.productLike.count({ where: { productId: product.id } });
  await prisma.product.update({ where: { id: product.id }, data: { likes } });

  return NextResponse.json({ liked, likes });
}
