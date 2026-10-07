import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { Header } from "../_components/Header";
import { CatalogView } from "./CatalogView";
import { catalogAdmin } from "@/lib/catalog-admin";
import { fanIndices, previewLabels, parseStrings } from "@/lib/catalog-kit";

export async function LibraryPage() {
  const admin = await catalogAdmin();
  const products = await prisma.product.findMany({
    where: admin ? {} : { isPublished: true },
    select: { id: true, slug: true, title: true, description: true, subject: true, course: true, courseSlug: true, audience: true, kind: true, isFree: true, priceBasic: true, previewPath: true, createdAt: true, examTask:true, topic:true, subtopic:true, compositionJson:true, previewPagesJson:true, previewLabelsJson:true, isPublished:true, assets: { select: { kind: true, tier: true, label:true, sortKey:true } } },
    orderBy: { createdAt: "desc" },
  });
  return <div className="hi library-site"><Header /><Suspense fallback={<div className="library-loading">Открываем библиотеку…</div>}><CatalogView admin={!!admin} products={products.map(({previewPagesJson,previewLabelsJson,compositionJson,...p}) => ({ ...p, examTask:p.examTask ?? (Number(p.course?.match(/Задание\s*(\d+)/i)?.[1]) || null), composition:parseStrings(compositionJson), fan:fanIndices(previewLabels({...p,previewPagesJson,previewLabelsJson})), createdAt: p.createdAt.toISOString() }))} /></Suspense></div>;
}
