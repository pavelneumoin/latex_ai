// Публичное превью материала: обложка (?p не задан) или страница галереи (?p=0..N).
// Галерея — первые страницы PDF, отрендеренные при сиде (pdftoppm).

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readUploadedFile, guessMime } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: { productId: string } }
) {
  const product = await prisma.product.findUnique({
    where: { id: params.productId },
    select: { previewPath: true, previewPagesJson: true, isPublished: true },
  });
  if (!product?.isPublished) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  let relPath = product.previewPath;
  const pRaw = req.nextUrl.searchParams.get("p");
  if (pRaw != null && product.previewPagesJson) {
    try {
      const pages = JSON.parse(product.previewPagesJson) as string[];
      const idx = Number(pRaw);
      if (Number.isInteger(idx) && idx >= 0 && idx < pages.length) {
        relPath = pages[idx];
      }
    } catch {
      // битый JSON — отдаём обложку
    }
  }
  if (!relPath) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  let buf: Buffer;
  try {
    buf = await readUploadedFile(relPath);
  } catch {
    return NextResponse.json({ error: "file_missing" }, { status: 410 });
  }

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": guessMime(relPath),
      "Cache-Control": "public, max-age=86400",
    },
  });
}
