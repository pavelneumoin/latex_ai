// Скачивание ассета продукта с проверкой прав (покупка / подписка / бесплатный).

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { canDownloadAsset } from "@/lib/entitlements";
import { readUploadedFile, guessMime } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: { assetId: string } }
) {
  const asset = await prisma.productAsset.findUnique({
    where: { id: params.assetId },
    include: { product: true },
  });
  if (!asset || !asset.product.isPublished) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const user = await getSessionUser();

  // Бесплатные материалы скачиваются только после входа — так копится библиотека учителя.
  if (!user) {
    return NextResponse.json({ error: "login_required" }, { status: 401 });
  }

  const allowed = await canDownloadAsset(user.id, asset.product, asset.tier);
  if (!allowed) {
    return NextResponse.json({ error: "not_purchased", tier: asset.tier }, { status: 403 });
  }

  let buf: Buffer;
  try {
    buf = await readUploadedFile(asset.path);
  } catch {
    return NextResponse.json({ error: "file_missing" }, { status: 410 });
  }

  await prisma.product.update({
    where: { id: asset.productId },
    data: { downloads: { increment: 1 } },
  });

  const filename = asset.path.split("/").pop() || "material.bin";
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": guessMime(filename),
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Content-Length": String(buf.length),
      "Cache-Control": "private, no-store",
    },
  });
}
