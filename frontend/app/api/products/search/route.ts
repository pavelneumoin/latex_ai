// Поиск по каталогу материалов со скорингом.
// Все слова запроса должны встретиться (AND) хотя бы в одном из полей;
// вес: точное вхождение в название > курс > описание. Плюс лёгкий буст
// бесплатных и высокорейтинговых — чтобы топ выдачи был убедительным.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

interface Scored {
  id: string;
  slug: string;
  title: string;
  course: string | null;
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

function norm(s: string): string {
  return s.toLowerCase().replace(/ё/g, "е");
}

export async function GET(req: NextRequest) {
  const qRaw = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 120);
  const subject = req.nextUrl.searchParams.get("subject") ?? undefined;
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit")) || 12, 40);

  if (qRaw.length < 2) {
    return NextResponse.json({ query: qRaw, results: [] });
  }

  const words = norm(qRaw).split(/\s+/).filter((w) => w.length >= 2);
  if (words.length === 0) {
    return NextResponse.json({ query: qRaw, results: [] });
  }

  // SQLite LIKE нечувствителен к регистру только для ASCII — фильтруем в JS.
  const all = await prisma.product.findMany({
    where: {
      isPublished: true,
      ...(subject === "math" || subject === "informatics" ? { subject } : {}),
    },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      course: true,
      subject: true,
      lessonNo: true,
      kind: true,
      isFree: true,
      priceBasic: true,
      rating: true,
      ratingCount: true,
      previewPath: true,
      likes: true,
    },
  });

  const results: Scored[] = [];
  for (const p of all) {
    const title = norm(p.title);
    const course = norm(p.course ?? "");
    const desc = norm(p.description ?? "");

    let score = 0;
    let matchedAll = true;
    for (const w of words) {
      let wordScore = 0;
      if (title.includes(w)) wordScore += title.startsWith(w) ? 30 : 20;
      if (course.includes(w)) wordScore += 10;
      if (desc.includes(w)) wordScore += 4;
      if (wordScore === 0) {
        matchedAll = false;
        break;
      }
      score += wordScore;
    }
    if (!matchedAll) continue;

    // Фраза целиком в названии — сильный буст
    if (title.includes(norm(qRaw))) score += 25;
    if (p.isFree) score += 6;
    score += Math.min(p.rating * p.ratingCount, 15) * 0.4 + Math.min(p.likes, 20) * 0.2;
    if (p.kind === "course_bundle") score += 3;

    results.push({
      id: p.id,
      slug: p.slug,
      title: p.title,
      course: p.course,
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

  results.sort((a, b) => b.score - a.score);

  return NextResponse.json({
    query: qRaw,
    total: results.length,
    results: results.slice(0, limit),
  });
}
