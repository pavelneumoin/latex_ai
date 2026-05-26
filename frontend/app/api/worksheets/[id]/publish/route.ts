import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export const runtime = "nodejs";

const schema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(5000).optional(),
  tags: z.array(z.string().min(1).max(64)).max(20).optional(),
  price: z.number().int().min(0).max(10_000_000).optional(),
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

  const ws = await prisma.worksheet.findUnique({
    where: { id: params.id },
  });
  if (!ws) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (ws.userId !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const title = parsed.data.title ?? ws.title;
  const description = parsed.data.description ?? null;
  const tags = (parsed.data.tags ?? []).join(",");
  const price = parsed.data.price ?? 0;

  const publication = await prisma.publication.upsert({
    where: { worksheetId: ws.id },
    create: {
      worksheetId: ws.id,
      userId: user.id,
      title,
      description,
      tags,
      price,
    },
    update: {
      title,
      description,
      tags,
      price,
    },
  });

  await prisma.worksheet.update({
    where: { id: ws.id },
    data: {
      isPublic: true,
      publishedAt: ws.publishedAt ?? new Date(),
    },
  });

  return NextResponse.json({
    publication: {
      id: publication.id,
      worksheetId: publication.worksheetId,
      title: publication.title,
      description: publication.description,
      tags: publication.tags
        ? publication.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [],
      price: publication.price,
      downloads: publication.downloads,
      rating: publication.rating,
      ratingCount: publication.ratingCount,
      isFeatured: publication.isFeatured,
      isBestlist: publication.isBestlist,
      createdAt: publication.createdAt,
    },
  });
}
