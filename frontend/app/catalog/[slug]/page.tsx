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
import { renderTaskCondition } from "@/lib/format-task";
import { ProductSocial } from "./ProductSocial";
import { ReviewsSection } from "./ReviewsSection";
import { PreviewGallery } from "./PreviewGallery";

export const dynamic = "force-dynamic";

function galleryLabels(paths: string[]): string[] {
  let p = 0;
  let w = 0;
  return paths.map((pth) => {
    const f = pth.split("/").pop() ?? "";
    if (f.startsWith("gal-p")) return `Слайд ${++p}`;
    if (f.startsWith("gal-w")) return `Рабочий лист · ${++w}`;
    return "Страница";
  });
}

function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m100 >= 11 && m100 <= 14) return many;
  if (m10 === 1) return one;
  if (m10 >= 2 && m10 <= 4) return few;
  return many;
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

  const presAsset = basicAssets.find((a) => a.kind === "presentation_pdf");
  const wsAsset = basicAssets.find((a) => a.kind === "worksheet_pdf");
  const hwAsset = basicAssets.find((a) => a.kind === "homework_pdf");

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

            {/* Об уроке — подробное описание под превью */}
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ marginBottom: 10 }}>Об уроке</h3>
              {product.description && (
                <div
                  className="rl-lead"
                  style={{ fontSize: 15, lineHeight: 1.6, marginBottom: 14 }}
                  dangerouslySetInnerHTML={{ __html: renderTaskCondition(product.description) }}
                />
              )}
              <div className="card-flat" style={{ padding: "14px 16px" }}>
                <b style={{ fontSize: 13.5, display: "block", marginBottom: 8 }}>Что входит в комплект</b>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: 18,
                    display: "flex",
                    flexDirection: "column",
                    gap: 7,
                    fontSize: 13.5,
                    color: "var(--fg-2)",
                    lineHeight: 1.5,
                  }}
                >
                  {presAsset && (
                    <li>
                      <b>Презентация для доски</b>
                      {presAsset.pages ? ` — ${presAsset.pages} ${plural(presAsset.pages, "слайд", "слайда", "слайдов")}` : ""}: тема
                      разбирается шаг за шагом, готова к показу на уроке.
                    </li>
                  )}
                  {wsAsset && (
                    <li>
                      <b>Рабочий лист</b>
                      {wsAsset.pages ? ` — ${wsAsset.pages} ${plural(wsAsset.pages, "страница", "страницы", "страниц")}` : ""}: задачи
                      с клеткой до низа страницы и местом для решения в классе.
                    </li>
                  )}
                  {hwAsset && (
                    <li>
                      <b>Домашнее задание</b>
                      {hwAsset.pages ? ` — ${hwAsset.pages} ${plural(hwAsset.pages, "страница", "страницы", "страниц")}` : ""}: задачи
                      с ответами для закрепления дома.
                    </li>
                  )}
                  <li>Профессиональная вёрстка, {product.audience ?? "ЕГЭ"} — печатайте и ведите урок.</li>
                </ul>
              </div>
            </div>

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
                        по подписке
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Что такое исходники */}
            {sourceAssets.length > 0 && (
              <div className="card-flat" style={{ padding: 16, fontSize: 13.5, color: "var(--fg-2)" }}>
                <b>Что такое исходники Marp/LaTeX?</b> Помимо бесплатных PDF по подписке
                открываются редактируемые исходники профессиональной вёрстки: презентация
                в формате <b>Marp</b> (Markdown — правится в любом редакторе), листы в{" "}
                <b>LaTeX</b>. Меняйте числа, фамилии, порядок задач — комплект становится вашим.
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
                        {r.lessonNo ? `Урок ${r.lessonNo}. ` : ""}
                        {r.title}
                      </span>
                      <span className="rl2-price" style={{ fontSize: 14 }}>
                        {r.isFree ? <span className="rl2-price-free">Бесплатно</span> : formatKopecks(r.priceBasic)}
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
              {/* PDF-материалы — бесплатно */}
              <div
                style={{
                  paddingBottom: sourceAssets.length > 0 ? 16 : 0,
                  borderBottom: sourceAssets.length > 0 ? "1px solid var(--border)" : "none",
                }}
              >
                <div className="rl-row-between">
                  <span className="rl2-tier" data-tier="basic">
                    PDF-материалы
                  </span>
                  {product.isFree ? (
                    <span className="rl2-price rl2-price-free" style={{ fontSize: 22 }}>
                      Бесплатно
                    </span>
                  ) : (
                    <span className="rl2-price" style={{ fontSize: 22 }}>
                      {formatKopecks(product.priceBasic)}
                    </span>
                  )}
                </div>
                <p className="muted" style={{ fontSize: 12.5, margin: "6px 0 10px" }}>
                  Презентация, рабочий лист и домашнее задание · печать без ограничений
                </p>
                {canBasic ? (
                  userId ? (
                    <div className="badge badge-success">
                      {product.isFree
                        ? "Доступно бесплатно"
                        : access.via === "subscription"
                          ? "Доступно по подписке"
                          : "Куплено ✓"}
                    </div>
                  ) : (
                    <Link href="/register" className="btn btn-primary btn-lg" style={{ width: "100%" }}>
                      Войти и скачать бесплатно
                    </Link>
                  )
                ) : (
                  <Link href="/pricing" className="btn btn-primary btn-lg" style={{ width: "100%" }}>
                    Доступно по подписке от 290 ₽/мес →
                  </Link>
                )}
              </div>

              {/* Исходники Marp/LaTeX — по подписке */}
              {sourceAssets.length > 0 && (
                <div style={{ paddingTop: 16 }}>
                  <div className="rl-row-between">
                    <span className="rl2-tier" data-tier="source">
                      Marp-исходники
                    </span>
                    <span className="rl2-price" style={{ fontSize: 16 }}>
                      по подписке
                    </span>
                  </div>
                  <p className="muted" style={{ fontSize: 12.5, margin: "6px 0 10px" }}>
                    Редактируемые шаблоны Marp/LaTeX — правьте числа, фамилии и задачи под класс
                  </p>
                  {canSource ? (
                    <div className="badge badge-success">
                      {access.via === "subscription" ? "Доступно по подписке ✓" : "Куплено ✓"}
                    </div>
                  ) : (
                    <Link href="/pricing" className="btn btn-blue" style={{ width: "100%" }}>
                      Подписка «{subjectName(product.subject)}» от 290 ₽/мес →
                    </Link>
                  )}
                </div>
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
