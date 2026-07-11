// Карточка материала: состав комплекта, уровни (PDF / PDF+исходники), покупка/скачивание.

import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Header } from "../../_components/Header";
import { getProductAccess, tierRank } from "@/lib/entitlements";
import { ASSET_KIND_LABEL, formatKopecks, subjectName } from "@/lib/products";
import { AssetIcon, IconLock } from "@/app/_components/Icons";
import { Stars } from "@/app/_components/Stars";
import { BuyButton } from "./BuyButton";
import { ProductSocial } from "./ProductSocial";
import { ReviewsSection } from "./ReviewsSection";
import { PreviewGallery } from "./PreviewGallery";

export const dynamic = "force-dynamic";

function galleryLabels(paths: string[]): string[] {
  return paths.map((p) => {
    const f = p.split("/").pop() ?? "";
    if (f.startsWith("gal-p")) return "Презентация";
    if (f.startsWith("gal-w")) return "Рабочий лист";
    if (f.startsWith("gal-c")) return "Шпаргалка";
    return "Страница";
  });
}

export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;

  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: { assets: { orderBy: { sortKey: "asc" } } },
  });
  if (!product || !product.isPublished) notFound();

  const [access, myLike, myBookmark] = await Promise.all([
    getProductAccess(userId, product),
    userId
      ? prisma.productLike.findUnique({
          where: { userId_productId: { userId, productId: product.id } },
        })
      : null,
    userId
      ? prisma.favorite.findFirst({ where: { userId, productId: product.id } })
      : null,
  ]);

  const basicAssets = product.assets.filter((a) => a.tier === "basic");
  const sourceAssets = product.assets.filter((a) => a.tier === "source");

  const canBasic = access.maxTier != null;
  const canSource = access.maxTier === "source";

  let galleryPages: string[] = [];
  try {
    if (product.previewPagesJson) {
      galleryPages = JSON.parse(product.previewPagesJson) as string[];
    }
  } catch {
    galleryPages = [];
  }

  const related = product.courseSlug
    ? await prisma.product.findMany({
        where: {
          courseSlug: product.courseSlug,
          isPublished: true,
          id: { not: product.id },
          kind: product.kind === "course_bundle" ? "lesson_kit" : undefined,
        },
        orderBy: { lessonNo: "asc" },
        select: { id: true, slug: true, title: true, lessonNo: true, isFree: true, priceBasic: true, kind: true },
      })
    : [];

  return (
    <div className="hi" style={{ minHeight: "100vh", background: "var(--surface)" }}>
      <Header />
      <main className="rl-container" style={{ paddingTop: 24, paddingBottom: 80 }}>
        <Link href="/catalog" style={{ fontSize: 13, color: "var(--primary)", textDecoration: "none" }}>
          ← Каталог
        </Link>

        <div className="rl-split" style={{ marginTop: 14, gap: 28 }}>
          {/* Левая колонка: описание и состав */}
          <div style={{ minWidth: 0 }}>
            <div className="rl-row" style={{ gap: 8, marginBottom: 10 }}>
              <span className="rl2-subject" data-subject={product.subject}>
                <i className="rl2-subject-dot" />
                {subjectName(product.subject)}
              </span>
              {product.course && (
                <span className="badge">
                  {product.course}
                  {product.lessonNo ? ` · урок ${product.lessonNo}` : ""}
                </span>
              )}
              {product.audience && <span className="badge">{product.audience}</span>}
              {product.checkable && (
                <span className="badge badge-success">автопроверка ✓</span>
              )}
            </div>

            <h1 className="rl-h2" style={{ marginBottom: 10 }}>
              {product.title}
            </h1>

            <div className="rl-row" style={{ gap: 14, marginBottom: 14 }}>
              <Stars rating={product.rating} count={product.ratingCount} size={16} />
              <ProductSocial
                productId={product.id}
                initialLiked={!!myLike}
                initialLikes={product.likes}
                initialBookmarked={!!myBookmark}
                loggedIn={!!userId}
              />
            </div>

            {product.description && (
              <p className="rl-lead" style={{ marginBottom: 20 }}>
                {product.description}
              </p>
            )}

            {/* Предпросмотр: галерея страниц или обложка */}
            {galleryPages.length > 0 ? (
              <PreviewGallery
                productId={product.id}
                pageCount={galleryPages.length}
                title={product.title}
                labels={galleryLabels(galleryPages)}
              />
            ) : (
              <div
                className="rl2-gridpaper"
                style={{
                  borderRadius: 16,
                  border: "1px solid var(--border)",
                  background: "var(--bg)",
                  padding: 24,
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: 24,
                }}
              >
                {product.previewPath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/preview/${product.id}`}
                    alt={`Превью: ${product.title}`}
                    style={{ maxWidth: "100%", borderRadius: 8, boxShadow: "var(--shadow-lg)" }}
                  />
                ) : (
                  <div className="rl2-product-paper" style={{ width: "46%" }} aria-hidden>
                    <i />
                    <i />
                    <i />
                    <i />
                    <i style={{ width: "40%" }} />
                  </div>
                )}
              </div>
            )}

            {/* Состав комплекта */}
            <h3 style={{ marginBottom: 10 }}>Состав комплекта</h3>
            <div className="card" style={{ padding: 6, marginBottom: 24 }}>
              {basicAssets.length === 0 && sourceAssets.length === 0 && (
                <p className="muted" style={{ padding: 14, fontSize: 14 }}>
                  Файлы комплекта готовятся к выкладке.
                </p>
              )}
              {[...basicAssets, ...sourceAssets].map((a) => {
                const unlocked = tierRank(access.maxTier ?? "") >= tierRank(a.tier);
                return (
                  <div
                    key={a.id}
                    className="rl-row-between"
                    style={{
                      padding: "10px 14px",
                      borderBottom: "1px solid var(--border)",
                      fontSize: 14,
                    }}
                  >
                    <span style={{ display: "inline-flex", gap: 8, alignItems: "center", minWidth: 0 }}>
                      <span aria-hidden style={{ color: "var(--fg-3)", display: "inline-flex" }}>
                        <AssetIcon kind={a.kind} size={16} />
                      </span>
                      <span style={{ fontWeight: 600 }}>{a.label || ASSET_KIND_LABEL[a.kind]}</span>
                      {a.pages ? (
                        <span className="muted" style={{ fontSize: 12 }}>
                          {a.pages} стр.
                        </span>
                      ) : null}
                      {a.tier === "source" && (
                        <span className="rl2-tier" data-tier="source">
                          исходники
                        </span>
                      )}
                    </span>
                    {unlocked ? (
                      <a className="btn btn-sm btn-outline" href={`/api/download/${a.id}`}>
                        Скачать
                      </a>
                    ) : (
                      <span className="muted" style={{ fontSize: 12.5, display: "inline-flex", alignItems: "center", gap: 5 }}>
                        <IconLock size={12} />
                        {a.tier === "source" ? "уровень «исходники»" : "после покупки"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Что такое исходники */}
            {sourceAssets.length > 0 && (
              <div className="card-flat" style={{ padding: 16, fontSize: 13.5, color: "var(--fg-2)" }}>
                <b>Что такое уровень «PDF + исходники»?</b> Помимо готовых PDF вы получаете
                редактируемые исходники профессиональной вёрстки: презентация в формате{" "}
                <b>Marp</b> (Markdown — правится в любом редакторе), листы в <b>LaTeX</b>.
                Меняйте числа, фамилии, порядок задач — комплект становится вашим.
              </div>
            )}

            {/* Отзывы */}
            <ReviewsSection
              productId={product.id}
              loggedIn={!!userId}
              canReview={access.maxTier != null}
            />

            {/* Уроки курса */}
            {related.length > 0 && (
              <div style={{ marginTop: 28 }}>
                <h3 style={{ marginBottom: 10 }}>Ещё из этого курса</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {related.map((r) => (
                    <Link
                      key={r.id}
                      href={`/catalog/${r.slug}`}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 10,
                        padding: "11px 14px",
                        borderRadius: 12,
                        border: "1px solid var(--border)",
                        background: "white",
                        textDecoration: "none",
                        fontSize: 14,
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>
                        {r.kind === "course_bundle" ? "" : r.lessonNo ? `Урок ${r.lessonNo}. ` : ""}
                        {r.title}
                      </span>
                      <span className="rl2-price" style={{ fontSize: 14 }}>
                        {r.isFree ? <span className="rl2-price-free">0 ₽</span> : formatKopecks(r.priceBasic)}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Правая колонка: покупка */}
          <aside>
            <div className="card" style={{ padding: 20, position: "sticky", top: 84 }}>
              {product.isFree ? (
                <>
                  <div className="rl2-price rl2-price-free" style={{ fontSize: 28 }}>
                    Бесплатно
                  </div>
                  <p className="muted" style={{ fontSize: 13, margin: "6px 0 14px" }}>
                    Демо-урок курса: все PDF и даже исходники — оцените качество.
                  </p>
                  {userId ? (
                    <div className="badge badge-success" style={{ marginBottom: 10 }}>
                      Доступно в вашей библиотеке
                    </div>
                  ) : (
                    <Link href="/register" className="btn btn-primary btn-lg" style={{ width: "100%" }}>
                      Зарегистрироваться и скачать
                    </Link>
                  )}
                </>
              ) : (
                <>
                  {/* Уровень PDF */}
                  <div style={{ paddingBottom: 14, borderBottom: "1px solid var(--border)" }}>
                    <div className="rl-row-between">
                      <span className="rl2-tier" data-tier="basic">
                        PDF
                      </span>
                      <span className="rl2-price" style={{ fontSize: 22 }}>
                        {formatKopecks(product.priceBasic)}
                      </span>
                    </div>
                    <p className="muted" style={{ fontSize: 12.5, margin: "6px 0 10px" }}>
                      Все PDF комплекта · печать без ограничений · навсегда
                    </p>
                    {canBasic ? (
                      <div className="badge badge-success">
                        {access.via === "subscription" ? "Доступно по подписке" : "Куплено ✓"}
                      </div>
                    ) : (
                      <BuyButton
                        productId={product.id}
                        tier="basic"
                        label={`Купить за ${formatKopecks(product.priceBasic)}`}
                        className="btn btn-primary"
                        loggedIn={!!userId}
                      />
                    )}
                  </div>

                  {/* Уровень исходники */}
                  {product.priceSource != null && (
                    <div style={{ paddingTop: 14 }}>
                      <div className="rl-row-between">
                        <span className="rl2-tier" data-tier="source">
                          PDF + исходники
                        </span>
                        <span className="rl2-price" style={{ fontSize: 22 }}>
                          {formatKopecks(product.priceSource)}
                        </span>
                      </div>
                      <p className="muted" style={{ fontSize: 12.5, margin: "6px 0 10px" }}>
                        + Marp/LaTeX исходники — правьте под себя
                      </p>
                      {canSource ? (
                        <div className="badge badge-success">
                          {access.via === "subscription" ? "Доступно по подписке" : "Куплено ✓"}
                        </div>
                      ) : (
                        <BuyButton
                          productId={product.id}
                          tier="source"
                          label={
                            access.purchaseTier === "basic"
                              ? "Доплатить до исходников"
                              : `Купить за ${formatKopecks(product.priceSource)}`
                          }
                          className="btn btn-blue"
                          loggedIn={!!userId}
                        />
                      )}
                    </div>
                  )}

                  <div
                    className="card-flat rl2-gridpaper"
                    style={{ padding: 12, marginTop: 16, fontSize: 12.5, color: "var(--fg-2)" }}
                  >
                    По подписке «{subjectName(product.subject)}» этот и все материалы
                    предмета — уже включены.{" "}
                    <Link href="/pricing" style={{ color: "var(--primary)" }}>
                      От 290 ₽/мес →
                    </Link>
                  </div>
                </>
              )}

              {product.checkable && (
                <div style={{ marginTop: 14, fontSize: 12.5, color: "var(--fg-2)" }}>
                  К комплекту приложен ключ — работы учеников проверяются в{" "}
                  <Link href="/cabinet/checks" style={{ color: "var(--primary)" }}>
                    кабинете
                  </Link>{" "}
                  автоматически.
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
