// Поиск по каталогу материалов со скорингом.
// Все значимые слова запроса должны встретиться (AND) хотя бы в одном из полей.
// Общий scorer учитывает точные фразы, префиксы, метаданные и небольшие опечатки.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRate, ipFromReq, rateLimited } from "@/lib/rate-limit";
import { productSearchTerms, scoreProductSearch } from "@/lib/product-search";

export const runtime = "nodejs";

interface Scored {
  id: string;
  slug: string;
  title: string;
  course: string | null;
  audience: string | null;
  subject: string;
  lessonNo: number | null;
  kind: string;
  isFree: boolean;
  priceBasic: number;
  rating: number;
  ratingCount: number;
  hasPreview: boolean;
  score: number;
}

export async function GET(req: NextRequest) {
  // Anti-abuse: поиск сканирует всю таблицу + скоринг в JS — не более 60 запросов в минуту с IP.
  const r = checkRate("product-search", ipFromReq(req), { limit: 60, windowMs: 60_000 });
  if (!r.ok) return rateLimited(r);

  const qRaw = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 120);
  const subject = req.nextUrl.searchParams.get("subject") ?? undefined;
  const kind = (req.nextUrl.searchParams.get("kind") ?? "").trim().slice(0, 40);
  const course = (req.nextUrl.searchParams.get("course") ?? "").trim().slice(0, 80);
  const requestedLimit = Number(req.nextUrl.searchParams.get("limit")) || 12;
  const limit = Math.min(Math.max(requestedLimit, 1), 40);

  if (productSearchTerms(qRaw).length === 0) {
    return NextResponse.json({ query: qRaw, results: [] });
  }

  // SQLite LIKE нечувствителен к регистру только для ASCII — фильтруем в JS.
  const all = await prisma.product.findMany({
    where: {
      isPublished: true,
      ...(subject === "math" || subject === "informatics" ? { subject } : {}),
      ...(kind ? { kind } : {}),
      ...(course ? { courseSlug: course } : {}),
    },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      course: true,
      courseSlug: true,
      audience: true,
      subject: true,
      lessonNo: true,
      kind: true,
      isFree: true,
      priceBasic: true,
      rating: true,
      ratingCount: true,
      previewPath: true,
    },
  });

  const results: Scored[] = [];
  for (const p of all) {
    const score = scoreProductSearch(p, qRaw);
    if (score == null) continue;

    results.push({
      id: p.id,
      slug: p.slug,
      title: p.title,
      course: p.course,
      audience: p.audience,
      subject: p.subject,
      lessonNo: p.lessonNo,
      kind: p.kind,
      isFree: p.isFree,
      priceBasic: p.priceBasic,
      rating: p.rating,
      ratingCount: p.ratingCount,
      hasPreview: !!p.previewPath,
      score,
    });
  }

  results.sort(
    (a, b) =>
      b.score - a.score ||
      b.ratingCount - a.ratingCount ||
      b.rating - a.rating ||
      Number(b.isFree) - Number(a.isFree) ||
      (a.lessonNo ?? Number.MAX_SAFE_INTEGER) - (b.lessonNo ?? Number.MAX_SAFE_INTEGER) ||
      a.title.localeCompare(b.title, "ru")
  );

  return NextResponse.json({
    query: qRaw,
    total: results.length,
    results: results.slice(0, limit),
  });
}
