import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const classes = await prisma.class.findMany({
    where: { userId: user.id, archived: false },
    include: {
      _count: { select: { students: true, checkJobs: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    classes: classes.map((c) => ({
      id: c.id,
      name: c.name,
      subject: c.subject,
      gradeLevel: c.gradeLevel,
      students: c._count.students,
      checks: c._count.checkJobs,
      scale5: c.scale5,
      scale4: c.scale4,
      scale3: c.scale3,
    })),
  });
}

const createSchema = z.object({
  name: z.string().min(1).max(40),
  subject: z.enum(["math", "informatics"]).default("math"),
  gradeLevel: z.number().int().min(1).max(11).nullish(),
  // Быстрый ввод: список учеников строками (из журнала)
  students: z.array(z.string().min(1).max(120)).max(60).optional(),
});

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const cls = await prisma.class.create({
    data: {
      userId: user.id,
      name: parsed.data.name.trim(),
      subject: parsed.data.subject,
      gradeLevel: parsed.data.gradeLevel ?? null,
      students: parsed.data.students?.length
        ? {
            create: parsed.data.students
              .map((s) => s.trim())
              .filter(Boolean)
              .map((name, i) => ({ name, sortKey: i })),
          }
        : undefined,
    },
    include: { _count: { select: { students: true } } },
  });

  return NextResponse.json({ id: cls.id, students: cls._count.students }, { status: 201 });
}
