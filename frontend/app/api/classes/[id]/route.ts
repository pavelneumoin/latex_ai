import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export const runtime = "nodejs";

async function ownClass(userId: string, id: string) {
  const cls = await prisma.class.findUnique({ where: { id } });
  if (!cls || cls.userId !== userId) return null;
  return cls;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const cls = await ownClass(user.id, params.id);
  if (!cls) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const students = await prisma.student.findMany({
    where: { classId: cls.id },
    orderBy: [{ sortKey: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({
    class: {
      id: cls.id,
      name: cls.name,
      subject: cls.subject,
      gradeLevel: cls.gradeLevel,
      scale5: cls.scale5,
      scale4: cls.scale4,
      scale3: cls.scale3,
      archived: cls.archived,
    },
    students: students.map((s) => ({ id: s.id, name: s.name })),
  });
}

const patchSchema = z.object({
  name: z.string().min(1).max(40).optional(),
  subject: z.enum(["math", "informatics"]).optional(),
  gradeLevel: z.number().int().min(1).max(11).nullish(),
  scale5: z.number().int().min(1).max(100).optional(),
  scale4: z.number().int().min(1).max(100).optional(),
  scale3: z.number().int().min(1).max(100).optional(),
  archived: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const cls = await ownClass(user.id, params.id);
  if (!cls) return NextResponse.json({ error: "not_found" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const d = parsed.data;
  // Пороги не должны пересекаться: 5 > 4 > 3
  const s5 = d.scale5 ?? cls.scale5;
  const s4 = d.scale4 ?? cls.scale4;
  const s3 = d.scale3 ?? cls.scale3;
  if (!(s5 > s4 && s4 > s3)) {
    return NextResponse.json({ error: "invalid_scale" }, { status: 400 });
  }

  const updated = await prisma.class.update({
    where: { id: cls.id },
    data: {
      ...(d.name !== undefined ? { name: d.name.trim() } : {}),
      ...(d.subject !== undefined ? { subject: d.subject } : {}),
      ...(d.gradeLevel !== undefined ? { gradeLevel: d.gradeLevel } : {}),
      scale5: s5,
      scale4: s4,
      scale3: s3,
      ...(d.archived !== undefined ? { archived: d.archived } : {}),
    },
  });

  return NextResponse.json({ ok: true, id: updated.id });
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
  const cls = await ownClass(user.id, params.id);
  if (!cls) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await prisma.class.delete({ where: { id: cls.id } });
  return NextResponse.json({ ok: true });
}
