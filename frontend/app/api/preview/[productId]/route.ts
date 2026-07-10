// Публичное превью первой страницы материала (PNG/JPG из storage).

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readUploadedFile, guessMime } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: { productId: string } }
) {
  const product = await prisma.product.findUnique({
    where: { id: params.productId },
    select: { previewPath: true, isPublished: true },
  });
  if (!product?.isPublished || !product.previewPath) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  let buf: Buffer;
  try {
    buf = await readUploadedFile(product.previewPath);
  } catch {
    return NextResponse.json({ error: "file_missing" }, { status: 410 });
  }

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": guessMime(product.previewPath),
      "Cache-Control": "public, max-age=86400",
    },
  });
}
