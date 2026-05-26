import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const ws = await prisma.worksheet.findUnique({ where: { id: params.id } });
  if (!ws) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (ws.userId !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  await prisma.publication.deleteMany({ where: { worksheetId: ws.id } });

  await prisma.worksheet.update({
    where: { id: ws.id },
    data: { isPublic: false, publishedAt: null },
  });

  return NextResponse.json({ ok: true });
}
