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

const postSchema = z.object({
  // mode add: дописать; mode replace: заменить весь список (результаты у прошлых
  // проверок сохраняются — CheckResult держит имя строкой).
  mode: z.enum(["add", "replace"]).default("add"),
  names: z.array(z.string().min(1).max(120)).min(1).max(60),
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
  const cls = await ownClass(user.id, params.id);
  if (!cls) return NextResponse.json({ error: "not_found" }, { status: 404 });

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

  const names = parsed.data.names.map((n) => n.trim()).filter(Boolean);

  if (parsed.data.mode === "replace") {
    await prisma.student.deleteMany({ where: { classId: cls.id } });
    await prisma.student.createMany({
      data: names.map((name, i) => ({ classId: cls.id, name, sortKey: i })),
    });
  } else {
    const maxSort = await prisma.student.aggregate({
      where: { classId: cls.id },
      _max: { sortKey: true },
    });
    let sort = (maxSort._max.sortKey ?? -1) + 1;
    await prisma.student.createMany({
      data: names.map((name) => ({ classId: cls.id, name, sortKey: sort++ })),
    });
  }

  const count = await prisma.student.count({ where: { classId: cls.id } });
  return NextResponse.json({ ok: true, students: count });
}

const patchSchema = z.object({
  studentId: z.string().min(1),
  name: z.string().min(1).max(120),
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
    return NextResponse.json({ error: "validation_error" }, { status: 400 });
  }

  const student = await prisma.student.findUnique({
    where: { id: parsed.data.studentId },
  });
  if (!student || student.classId !== cls.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  await prisma.student.update({
    where: { id: student.id },
    data: { name: parsed.data.name.trim() },
  });
  return NextResponse.json({ ok: true });
}

const deleteSchema = z.object({ studentId: z.string().min(1) });

export async function DELETE(
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
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_error" }, { status: 400 });
  }

  const student = await prisma.student.findUnique({
    where: { id: parsed.data.studentId },
  });
  if (!student || student.classId !== cls.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  await prisma.student.delete({ where: { id: student.id } });
  return NextResponse.json({ ok: true });
}
