import Link from "next/link";
import {redirect} from "next/navigation";
import {catalogAdmin} from "@/lib/catalog-admin";
import {prisma} from "@/lib/db";
import {Header} from "../../_components/Header";
export const dynamic="force-dynamic";
export default async function CatalogAdminPage(){
 if(!await catalogAdmin())redirect("/login?callbackUrl=/admin/catalog");
 const kits=await prisma.product.findMany({orderBy:{updatedAt:"desc"}});
 return <div className="hi"><Header/><main className="catalog-admin-page"><Link href="/catalog">← Каталог</Link><h1>Комплекты уроков</h1><p>Добавляйте превью и одну ссылку на весь комплект Яндекс Диска.</p><Link href="/admin/catalog/new" className="btn btn-primary">+ Новый комплект</Link>{kits.map(p=><div className="admin-kit-row" key={p.id}><Link href={"/admin/catalog/"+p.id}>{p.title}</Link><span>{p.isPublished?"Опубликован":"Черновик"}</span><span>{p.diskFolderUrl?"Ссылка добавлена":"Нет ссылки на комплект"}</span><Link href={"/catalog/"+p.slug}>Посмотреть ↗</Link></div>)}</main></div>;
}
