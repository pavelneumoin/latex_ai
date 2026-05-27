export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const PAGE_LIMIT = 50;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subject = searchParams.get("subject");
    const gradeRaw = searchParams.get("grade");
    const q = searchParams.get("q");
    const featured = searchParams.get("featured");
    const offset = Math.max(
      0,
      Number(searchParams.get("offset") ?? "0") || 0
    );

    const where: Record<string, unknown> = {};
    if (featured === "1" || featured === "true") {
      where.isFeatured = true;
    }
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
      ];
    }

    // subject/grade живут на Worksheet — фильтруем через relation
    const worksheetWhere: Record<string, unknown> = {};
    if (subject) worksheetWhere.subject = subject;
    if (gradeRaw) {
      const g = Number(gradeRaw);
      if (Number.isFinite(g)) worksheetWhere.grade = g;
    }
    if (Object.keys(worksheetWhere).length > 0) {
      where.worksheet = worksheetWhere;
    }

    const rows = await prisma.publication.findMany({
      where,
      orderBy: [{ downloads: "desc" }, { createdAt: "desc" }],
      take: PAGE_LIMIT,
      skip: offset,
      include: {
        worksheet: {
          select: {
            id: true,
            subject: true,
            grade: true,
            templateId: true,
            difficulty: true,
          },
        },
        user: { select: { name: true, id: true } },
      },
    });

    const items = rows.map((r) => ({
      id: r.id,
      worksheetId: r.worksheetId,
      title: r.title,
      description: r.description,
      tags: r.tags
        ? r.tags.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
      price: r.price,
      downloads: r.downloads,
      rating: r.rating,
      ratingCount: r.ratingCount,
      isFeatured: r.isFeatured,
      isBestlist: r.isBestlist,
      author: { id: r.user.id, name: r.user.name },
      worksheet: r.worksheet,
      createdAt: r.createdAt,
    }));

    return NextResponse.json({ publications: items, limit: PAGE_LIMIT, offset });
  } catch (e) {
    console.error("[marketplace] error", e);
    return NextResponse.json(
      { error: "internal_error", detail: (e as Error).message },
      { status: 500 }
    );
  }
}
