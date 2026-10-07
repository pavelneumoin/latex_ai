import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getActiveSubscriptions } from "@/lib/entitlements";
import {isCatalogAdmin} from "@/lib/catalog-admin";
import { IconLibrary,IconCard,IconArrowRight,IconBookmark } from "../_components/Icons";
export const dynamic="force-dynamic";
export default async function CabinetPage(){
 const session=await getServerSession(authOptions);const userId=session!.user.id;
 const admin=await isCatalogAdmin(userId);
 const [subs,bookmarks]=await Promise.all([getActiveSubscriptions(userId),prisma.favorite.findMany({where:{userId,productId:{not:null}},include:{product:true},take:6,orderBy:{createdAt:"desc"}})]);
 const paid=subs.filter(s=>s.planId!=="free");const name=session?.user.name?.split(" ")[0]||"коллега";
 return <div className="cabinet-overview"><span className="eyebrow">ВАШЕ ПРОСТРАНСТВО</span><h1>Здравствуйте, {name}</h1><p>Материалы для ваших уроков и подписка — всё под рукой.</p><section className="cabinet-summary"><div><IconCard size={25}/><h2>{admin?"Доступ администратора":"Моя подписка"}</h2>{admin?<p>Все комплекты открыты без подписки. <Link href="/admin/catalog">Управление комплектами →</Link></p>:paid.length?paid.map(s=><div key={s.id} className="subscription-line"><strong>{s.plan.name}</strong><span>Доступ до {s.currentPeriodEnd.toLocaleDateString("ru-RU",{timeZone:"Europe/Moscow"})}</span><small>Сохранён в вашем аккаунте</small></div>):<p>Пока без подписки. Оформите доступ ко всем материалам за 499 ₽ в месяц.</p>}<Link href="/cabinet/billing">Управление подпиской <IconArrowRight size={16}/></Link></div><div><IconLibrary size={25}/><h2>К уроку всё готово</h2><p>Выберите тему и откройте комплект: презентацию, задания и материалы для печати.</p><Link href="/materials">Выбрать задание ЕГЭ <IconArrowRight size={16}/></Link></div></section><section className="cabinet-bookmarks"><h2><IconBookmark size={22}/> Сохранённые материалы</h2>{bookmarks.filter(b=>b.product?.isPublished).length?bookmarks.filter(b=>b.product?.isPublished).map(b=><Link className="saved-material" href={`/catalog/${b.product!.slug}`} key={b.id}>{b.product!.title}<IconArrowRight size={18}/></Link>):<div className="library-empty"><h3>Соберите свою полку материалов</h3><p>Нажмите «В закладки» на странице комплекта, чтобы вернуться к нему позже.</p><Link href="/catalog" className="btn btn-outline">Открыть каталог</Link></div>}</section></div>;
}
