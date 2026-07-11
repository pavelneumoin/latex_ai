// Закладка материала (toggle) — личный список «посмотреть позже», покупка не нужна.

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

  const existing = await prisma.favorite.findFirst({
    where: { userId: user.id, productId: product.id },
  });

  let bookmarked: boolean;
  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    bookmarked = false;
  } else {
    await prisma.favorite.create({
      data: { userId: user.id, productId: product.id },
    });
    bookmarked = true;
  }

  return NextResponse.json({ bookmarked });
}
