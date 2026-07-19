// Кабинет · Библиотека: всё купленное, скачивание в один клик, повторно и навсегда.

import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getActiveSubscriptions, subsCover, tierRank } from "@/lib/entitlements";
import { ASSET_KIND_LABEL, subjectName } from "@/lib/products";
import { AssetIcon, IconLibrary } from "@/app/_components/Icons";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user!.id;

  const productCardSelect = {
    id: true,
    slug: true,
    title: true,
    subject: true,
    course: true,
    lessonNo: true,
    isFree: true,
    priceBasic: true,
    isPublished: true,
  } as const;

  const [purchases, subs, bookmarks, likes] = await Promise.all([
    prisma.purchase.findMany({
      where: { userId },
      include: { product: { include: { assets: { orderBy: { sortKey: "asc" } } } } },
      orderBy: { createdAt: "desc" },
    }),
    getActiveSubscriptions(userId),
    prisma.favorite.findMany({
      where: { userId, productId: { not: null } },
      include: { product: { select: productCardSelect } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.productLike.findMany({
      where: { userId },
      include: { product: { select: productCardSelect } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Материалы, доступные по подписке (не купленные отдельно)
  const purchasedIds = new Set(purchases.map((p) => p.productId));
  const subSubjects: { subject: string; tier: string }[] = [];
  for (const subj of ["math", "informatics"] as const) {
    const src = subsCover(subs, subj, "source");
    const basic = subsCover(subs, subj, "basic");
    if (src) subSubjects.push({ subject: subj, tier: "source" });
    else if (basic) subSubjects.push({ subject: subj, tier: "basic" });
  }
  const bySubscription =
    subSubjects.length > 0
      ? await prisma.product.findMany({
          where: {
            isPublished: true,
            isFree: false,
            id: { notIn: Array.from(purchasedIds) },
            subject: { in: subSubjects.map((s) => s.subject) },
          },
          include: { assets: { orderBy: { sortKey: "asc" } } },
          orderBy: [{ courseSlug: "asc" }, { lessonNo: "asc" }],
        })
      : [];

  const freeSaved = await prisma.product.findMany({
    where: { isPublished: true, isFree: true },
    include: { assets: { orderBy: { sortKey: "asc" } } },
    orderBy: [{ courseSlug: "asc" }, { lessonNo: "asc" }],
  });

  const sections = [
    {
      key: "purchased",
      title: "Куплено",
      note: "Навсегда в вашей библиотеке",
      items: purchases.map((p) => ({
        product: p.product,
        tier: p.tier,
        badge: p.tier === "source" ? "PDF + исходники" : "PDF",
      })),
    },
    {
      key: "subscription",
      title: "По подписке",
      note: "Доступно, пока подписка активна",
      items: bySubscription.map((prod) => {
        const cover = subSubjects.find((s) => s.subject === prod.subject);
        return {
          product: prod,
          tier: cover?.tier ?? "basic",
          badge: cover?.tier === "source" ? "PDF + исходники" : "PDF",
        };
      }),
    },
    {
      key: "free",
      title: "Бесплатные материалы",
      note: "Готовые PDF — открыты всем",
      items: freeSaved.map((prod) => ({
        product: prod,
        tier: "basic",
        badge: "бесплатно",
      })),
    },
  ];

  // Сохранённое: лайки и закладки (без покупки) — из них строим личную подборку.
  const likedProducts = likes.map((l) => l.product).filter((p) => p.isPublished);
  const bookmarkedProducts = bookmarks.map((b) => b.product!).filter((p) => p.isPublished);

  const empty =
    sections.every((s) => s.items.length === 0) &&
    likedProducts.length === 0 &&
    bookmarkedProducts.length === 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 1060 }}>
      <div>
        <h1 style={{ fontSize: "clamp(22px, 4vw, 30px)" }}>Библиотека</h1>
        <p className="muted-2" style={{ marginTop: 4, fontSize: 14.5 }}>
          Все ваши материалы: купленные — навсегда, по подписке — пока она активна.
        </p>
      </div>

      {empty && (
        <div className="rl2-empty rl2-gridpaper" style={{ padding: 60 }}>
          <div style={{ color: "var(--fg-3)", marginBottom: 10 }}>
            <IconLibrary size={34} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--fg-2)" }}>
            Пока пусто
          </div>
          <div style={{ marginTop: 6 }}>
            Все готовые PDF в каталоге бесплатны — скачивайте и печатайте.
          </div>
          <div style={{ marginTop: 14 }}>
            <Link href="/catalog" className="btn btn-primary">
              Открыть каталог
            </Link>
          </div>
        </div>
      )}

      {/* Сохранённое без покупки: понравившиеся (❤) и закладки (🔖) */}
      <SavedSection title="Понравившиеся" note="Отмечено лайком" products={likedProducts} />
      <SavedSection title="Закладки" note="Сохранено на потом" products={bookmarkedProducts} />

      {sections.map(
        (sec) =>
          sec.items.length > 0 && (
            <section key={sec.key}>
              <div className="rl-row" style={{ gap: 10, marginBottom: 12 }}>
                <h2 style={{ fontSize: 19 }}>{sec.title}</h2>
                <span className="muted" style={{ fontSize: 12.5 }}>
                  {sec.note}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {sec.items.map(({ product, tier, badge }) => {
                  const visibleAssets = product.assets.filter(
                    (a) => tierRank(tier) >= tierRank(a.tier)
                  );
                  return (
                    <div key={product.id} className="card rl2-card-subject" data-subject={product.subject} style={{ padding: 16 }}>
                      <div className="rl-row-between" style={{ marginBottom: 10 }}>
                        <div style={{ minWidth: 0 }}>
                          <Link
                            href={`/catalog/${product.slug}`}
                            style={{ fontWeight: 700, fontFamily: "var(--display)", fontSize: 15.5, textDecoration: "none" }}
                          >
                            {product.title}
                          </Link>
                          <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>
                            {subjectName(product.subject)}
                            {product.course ? ` · ${product.course}` : ""}
                            {product.lessonNo ? ` · урок ${product.lessonNo}` : ""}
                          </div>
                        </div>
                        <span className="rl2-tier" data-tier={tier === "source" ? "source" : badge === "бесплатно" ? "free" : "basic"}>
                          {badge}
                        </span>
                      </div>
                      <div className="rl-row" style={{ gap: 8 }}>
                        {visibleAssets.map((a) => (
                          <a
                            key={a.id}
                            href={`/api/download/${a.id}`}
                            className="btn btn-sm btn-outline"
                            style={{ gap: 6 }}
                          >
                            <AssetIcon kind={a.kind} size={14} />
                            {a.label || ASSET_KIND_LABEL[a.kind] || a.kind}
                          </a>
                        ))}
                        {visibleAssets.length === 0 && (
                          <span className="muted" style={{ fontSize: 13 }}>
                            Файлы готовятся к выкладке.
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )
      )}
    </div>
  );
}

type SavedProduct = {
  id: string;
  slug: string;
  title: string;
  subject: string;
  course: string | null;
  lessonNo: number | null;
  isFree: boolean;
  priceBasic: number;
};

function SavedSection({
  title,
  note,
  products,
}: {
  title: string;
  note: string;
  products: SavedProduct[];
}) {
  if (products.length === 0) return null;
  return (
    <section>
      <div className="rl-row" style={{ gap: 10, marginBottom: 12 }}>
        <h2 style={{ fontSize: 19 }}>{title}</h2>
        <span className="muted" style={{ fontSize: 12.5 }}>
          {note}
        </span>
      </div>
      <div className="rl-grid rl-grid-2">
        {products.map((p) => (
          <Link
            key={p.id}
            href={`/catalog/${p.slug}`}
            className="card card-hover rl2-card-subject"
            data-subject={p.subject}
            style={{ padding: 14, textDecoration: "none", display: "flex", justifyContent: "space-between", gap: 10 }}
          >
            <span style={{ minWidth: 0 }}>
              <span style={{ display: "block", fontWeight: 700, fontFamily: "var(--display)", fontSize: 14.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {p.title}
              </span>
              <span className="muted" style={{ fontSize: 12 }}>
                {p.course ?? subjectName(p.subject)}
                {p.lessonNo ? ` · урок ${p.lessonNo}` : ""}
              </span>
            </span>
            <span className="rl2-price" style={{ fontSize: 15, whiteSpace: "nowrap" }}>
              {p.isFree ? (
                <span className="rl2-price-free">Бесплатно</span>
              ) : (
                `${Math.round(p.priceBasic / 100)} ₽`
              )}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
