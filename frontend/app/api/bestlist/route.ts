import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subject = searchParams.get("subject");
    const limit = Math.min(
      200,
      Math.max(1, Number(searchParams.get("limit") ?? "100") || 100)
    );

    const where: Record<string, unknown> = { isBestlist: true };
    if (subject) {
      where.worksheet = { subject };
    }

    const rows = await prisma.publication.findMany({
      where,
      orderBy: [{ rating: "desc" }, { downloads: "desc" }],
      take: limit,
      include: {
        worksheet: {
          select: {
            id: true,
            subject: true,
            grade: true,
            templateId: true,
            difficulty: true,
            contentJson: true,
          },
        },
        user: { select: { id: true, name: true } },
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
      rating: r.rating,
      downloads: r.downloads,
      author: { id: r.user.id, name: r.user.name },
      worksheet: r.worksheet,
    }));

    return NextResponse.json({ bestlist: items });
  } catch (e) {
    console.error("[bestlist] error", e);
    return NextResponse.json(
      { error: "internal_error", detail: (e as Error).message },
      { status: 500 }
    );
  }
}
