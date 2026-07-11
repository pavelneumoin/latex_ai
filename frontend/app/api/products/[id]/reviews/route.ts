// Отзывы и оценки материала.
// GET — список; POST — создать/обновить свой отзыв (rating 1–5 + текст).
// verified = у автора есть покупка (или материал открыт подпиской) — бейдж «покупал».

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser, getSessionUser } from "@/lib/session";
import { getProductAccess } from "@/lib/entitlements";

export const runtime = "nodejs";

async function recalcRating(productId: string) {
  const agg = await prisma.review.aggregate({
    where: { productId },
    _avg: { rating: true },
    _count: true,
  });
  await prisma.product.update({
    where: { id: productId },
    data: {
      rating: Math.round((agg._avg.rating ?? 0) * 10) / 10,
      ratingCount: agg._count,
    },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const me = await getSessionUser();
  const reviews = await prisma.review.findMany({
    where: { productId: params.id },
    include: { user: { select: { name: true, id: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      text: r.text,
      verified: r.verified,
      author: r.user.name?.trim() || "Учитель",
      mine: me?.id === r.userId,
      createdAt: r.createdAt,
    })),
  });
}

const postSchema = z.object({
  rating: z.number().int().min(1).max(5),
  text: z.string().max(2000).optional(),
});

export async function POST(
  req: NextRequest,
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
    select: { id: true, subject: true, isFree: true, isPublished: true },
  });
  if (!product?.isPublished) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const access = await getProductAccess(user.id, product);
  const verified = access.via === "purchase" || access.via === "subscription";

  await prisma.review.upsert({
    where: { userId_productId: { userId: user.id, productId: product.id } },
    update: {
      rating: parsed.data.rating,
      text: parsed.data.text?.trim() || null,
      verified,
    },
    create: {
      userId: user.id,
      productId: product.id,
      rating: parsed.data.rating,
      text: parsed.data.text?.trim() || null,
      verified,
    },
  });

  await recalcRating(product.id);
  const updated = await prisma.product.findUnique({
    where: { id: product.id },
    select: { rating: true, ratingCount: true },
  });

  return NextResponse.json({ ok: true, ...updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  await prisma.review.deleteMany({
    where: { userId: user.id, productId: params.id },
  });
  await recalcRating(params.id);
  return NextResponse.json({ ok: true });
}
