// Кабинет · Библиотека: всё купленное, скачивание в один клик, повторно и навсегда.

import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getActiveSubscriptions, subsCover, tierRank } from "@/lib/entitlements";
import { ASSET_KIND_LABEL, ASSET_KIND_EMOJI, subjectName } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user!.id;

  const [purchases, subs] = await Promise.all([
    prisma.purchase.findMany({
      where: { userId },
      include: { product: { include: { assets: { orderBy: { sortKey: "asc" } } } } },
      orderBy: { createdAt: "desc" },
    }),
    getActiveSubscriptions(userId),
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
      note: "Открыты всем — включая исходники",
      items: freeSaved.map((prod) => ({
        product: prod,
        tier: "source",
        badge: "бесплатно",
      })),
    },
  ];

  const empty = sections.every((s) => s.items.length === 0);

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
          <div className="big">📚</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--fg-2)" }}>
            Пока пусто
          </div>
          <div style={{ marginTop: 6 }}>
            Начните с бесплатных уроков в каталоге — первый урок каждого курса открыт.
          </div>
          <div style={{ marginTop: 14 }}>
            <Link href="/catalog" className="btn btn-primary">
              Открыть каталог
            </Link>
          </div>
        </div>
      )}

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
                            <span aria-hidden>{ASSET_KIND_EMOJI[a.kind] ?? "📄"}</span>
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
