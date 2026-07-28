export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { redactWorksheetAnswers } from "@/lib/worksheet-privacy";
import { safeParseJson } from "@/lib/worksheets";

export const runtime = "nodejs";

function publicContentJson(json: string | null): string | null {
  const parsed = safeParseJson(json);
  return parsed == null ? null : JSON.stringify(redactWorksheetAnswers(parsed));
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subject = searchParams.get("subject");
    const limit = Math.min(
      200,
      Math.max(1, Number(searchParams.get("limit") ?? "100") || 100)
    );

    const worksheetWhere: Record<string, unknown> = { isPublic: true };
    if (subject) worksheetWhere.subject = subject;
    const where: Record<string, unknown> = {
      isBestlist: true,
      worksheet: worksheetWhere,
    };

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
      worksheet: {
        ...r.worksheet,
        contentJson: publicContentJson(r.worksheet.contentJson),
      },
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
