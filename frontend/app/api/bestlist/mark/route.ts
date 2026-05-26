import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export const runtime = "nodejs";

const schema = z.object({
  publicationId: z.string().min(1).max(64),
  isBestlist: z.boolean(),
});

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // role: moderator | admin
  const me = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  if (!me || (me.role !== "moderator" && me.role !== "admin")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const pub = await prisma.publication.findUnique({
    where: { id: parsed.data.publicationId },
  });
  if (!pub) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const updated = await prisma.publication.update({
    where: { id: pub.id },
    data: { isBestlist: parsed.data.isBestlist },
    select: { id: true, isBestlist: true },
  });

  return NextResponse.json({ publication: updated });
}
