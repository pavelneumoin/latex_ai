import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export const runtime = "nodejs";

const schema = z
  .object({
    worksheetId: z.string().min(1).max(64).optional(),
    publicationId: z.string().min(1).max(64).optional(),
  })
  .refine((d) => !!d.worksheetId !== !!d.publicationId, {
    message: "expected exactly one of worksheetId or publicationId",
  });

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { worksheetId, publicationId } = parsed.data;

  // Toggle
  if (worksheetId) {
    const existing = await prisma.favorite.findUnique({
      where: { userId_worksheetId: { userId: user.id, worksheetId } },
    });
    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return NextResponse.json({ favorited: false });
    }
    const fav = await prisma.favorite.create({
      data: { userId: user.id, worksheetId },
    });
    return NextResponse.json({ favorited: true, id: fav.id });
  }

  // publicationId
  const existing = await prisma.favorite.findUnique({
    where: {
      userId_publicationId: { userId: user.id, publicationId: publicationId! },
    },
  });
  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return NextResponse.json({ favorited: false });
  }
  const fav = await prisma.favorite.create({
    data: { userId: user.id, publicationId: publicationId! },
  });
  return NextResponse.json({ favorited: true, id: fav.id });
}

export async function GET() {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const favs = await prisma.favorite.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      worksheet: {
        select: { id: true, title: true, subject: true, grade: true },
      },
      publication: {
        select: { id: true, title: true, price: true, downloads: true },
      },
    },
  });

  return NextResponse.json({ favorites: favs });
}
