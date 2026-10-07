import Link from "next/link";
import {notFound} from "next/navigation";
import {prisma} from "@/lib/db";
import {getSessionUser} from "@/lib/session";
import {isCatalogAdmin} from "@/lib/catalog-admin";
import {getProductAccess,tierRank} from "@/lib/entitlements";
import {parseStrings,previewLabels} from "@/lib/catalog-kit";
import {subjectName} from "@/lib/products";
import {Header} from "../../_components/Header";
import {PreviewGallery} from "./PreviewGallery";
import {ProductSocial} from "./ProductSocial";
export const dynamic="force-dynamic";
export default async function ProductPage({params}:{params:{slug:string}}){
 const user=await getSessionUser(),admin=await isCatalogAdmin(user?.id);
 const product=await prisma.product.findUnique({where:{slug:params.slug},include:{assets:{orderBy:{sortKey:"asc"}}}});
 if(!product||(!product.isPublished&&!admin))notFound();
 const access=await getProductAccess(user?.id??null,product);
 const [like,bookmark]=await Promise.all([user?prisma.productLike.findUnique({where:{userId_productId:{userId:user.id,productId:product.id}}}):null,user?prisma.favorite.findFirst({where:{userId:user.id,productId:product.id}}):null]);
 const pages=parseStrings(product.previewPagesJson),composition=parseStrings(product.compositionJson);
 const canDownload=!!user&&!!access.maxTier&&tierRank(access.maxTier)>=tierRank(product.bundleTier);
 return <div className="hi library-site"><Header/><main className="kit-detail"><Link href="/catalog" className="kit-back">← Все материалы</Link>
  <header className="kit-detail-heading"><div><div className="kit-eyebrow"><span>{subjectName(product.subject)}</span><span>{product.course||"ЕГЭ"}{!product.isPublished?" · Черновик":""}</span></div><h1>{product.title}</h1></div><ProductSocial productId={product.id} initialLiked={!!like} initialLikes={product.likes} initialBookmarked={!!bookmark} loggedIn={!!user}/></header>
  <div className="kit-detail-grid"><div><PreviewGallery productId={product.id} pageCount={pages.length} labels={previewLabels(product)} title={product.title}/></div>
   <aside className="kit-info"><h2>Весь урок в одном комплекте</h2><p>{product.description}</p><ul>{(composition.length?composition:product.assets.map(a=>a.label+(a.pages?" · "+a.pages+" стр.":""))).map((text,i)=><li key={i}>{text}</li>)}</ul>
    {admin&&<div className="kit-admin-status">Доступ администратора · без подписки</div>}
    {!product.diskFolderUrl?<><button className="btn btn-primary kit-download" disabled>Скачать комплект</button><p className="kit-link-pending">Ссылка на полный комплект готовится.</p></>:canDownload?<a className="btn btn-primary kit-download" href={"/api/kits/"+product.id+"/download"} target="_blank" rel="noopener noreferrer">Скачать комплект ↗</a>:<Link className="btn btn-primary kit-download" href={user?"/pricing":"/login?callbackUrl="+encodeURIComponent("/catalog/"+product.slug)}>{user?"Открыть доступ":"Войти и скачать"}</Link>}
    <small>Весь комплект на Яндекс Диске. PDF можно распечатать или открыть на планшете.</small>
    {admin&&<Link className="kit-edit-link" href={"/admin/catalog/"+product.id}>Редактировать комплект →</Link>}
    {product.slug==="ege-math-08-circle"&&<p className="kit-print-tip">Печать: A4, масштаб 100%. Рабочий лист — стр. 1–11, ДЗ — стр. 1–4. Ответы в конце файлов.</p>}
   </aside></div></main></div>;
}
