// Скачивание файла отчёта: ?kind=pdf | tex

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { readUploadedFile } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const report = await prisma.report.findUnique({ where: { id: params.id } });
  if (!report || report.userId !== user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const kind = req.nextUrl.searchParams.get("kind") === "tex" ? "tex" : "pdf";
  const relPath = kind === "tex" ? report.texPath : report.pdfPath;
  if (!relPath) {
    return NextResponse.json({ error: `${kind}_not_available` }, { status: 404 });
  }

  let buf: Buffer;
  try {
    buf = await readUploadedFile(relPath);
  } catch {
    return NextResponse.json({ error: "file_missing" }, { status: 410 });
  }

  const filename = `report-${report.id}.${kind}`;
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": kind === "pdf" ? "application/pdf" : "application/x-tex; charset=utf-8",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Content-Length": String(buf.length),
      "Cache-Control": "private, no-store",
    },
  });
}
