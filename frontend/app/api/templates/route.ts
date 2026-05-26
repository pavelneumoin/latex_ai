import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subject = searchParams.get("subject");
    const gradeRaw = searchParams.get("grade");
    const layout = searchParams.get("layout");

    const where: {
      isActive: boolean;
      subject?: string;
      grade?: number;
      layout?: string;
    } = { isActive: true };

    if (subject) where.subject = subject;
    if (layout) where.layout = layout;
    if (gradeRaw) {
      const g = Number(gradeRaw);
      if (Number.isFinite(g)) where.grade = g;
    }

    const list = await prisma.template.findMany({
      where,
      orderBy: { id: "asc" },
    });

    const templates = list.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      subject: t.subject,
      grade: t.grade,
      layout: t.layout,
      style: t.style,
      taskCount: t.taskCount,
      tags: t.tags
        ? t.tags
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    }));

    return NextResponse.json({ templates });
  } catch (e) {
    console.error("[templates] error", e);
    return NextResponse.json(
      { error: "internal_error", detail: (e as Error).message },
      { status: 500 }
    );
  }
}
