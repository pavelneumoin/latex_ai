import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { Header } from "../_components/Header";
import { CatalogView } from "./CatalogView";

export async function LibraryPage() {
  const products = await prisma.product.findMany({
    where: { isPublished: true },
    select: { id: true, slug: true, title: true, description: true, subject: true, course: true, courseSlug: true, audience: true, kind: true, isFree: true, priceBasic: true, previewPath: true, createdAt: true, assets: { select: { kind: true, tier: true } } },
    orderBy: { createdAt: "desc" },
  });
  return <div className="hi library-site"><Header /><Suspense fallback={<div className="library-loading">Открываем библиотеку…</div>}><CatalogView products={products.map(p => ({ ...p, createdAt: p.createdAt.toISOString() }))} /></Suspense></div>;
}
