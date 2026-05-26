import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { readUploadedFile } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const upload = await prisma.upload.findUnique({
    where: { id: params.id },
  });
  if (!upload) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (upload.userId !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let buf: Buffer;
  try {
    buf = await readUploadedFile(upload.path);
  } catch (e) {
    console.error("[uploads GET] read error", e);
    return NextResponse.json(
      { error: "read_failed", detail: (e as Error).message },
      { status: 500 }
    );
  }

  const body = new Uint8Array(buf);
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": upload.mimeType || "application/octet-stream",
      "Content-Length": String(buf.length),
      "Content-Disposition": `inline; filename="${encodeURIComponent(upload.filename)}"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}
