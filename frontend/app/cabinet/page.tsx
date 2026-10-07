import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { IconLibrary, IconCard, IconArrowRight, IconBookmark } from "../_components/Icons";

export const dynamic = "force-dynamic";
export default async function CabinetPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  const [user, bookmarks] = await Promise.all([
    prisma.user.findUniqueOrThrow({where:{id:session.id}}),
    prisma.favorite.findMany({where:{userId:session.id,product:{isPublished:true}},include:{product:true},take:6,orderBy:{createdAt:"desc"}}),
  ]);
  const admin = user.role === "admin";
  const name = user.name?.split(" ")[0] || "коллега";
  return <div className="cabinet-overview"><span className="eyebrow">ВАШЕ ПРОСТРАНСТВО</span><h1>Здравствуйте, {name}</h1><p>Материалы для ваших уроков — всё под рукой.</p>
    <section className="cabinet-summary"><div><IconCard size={25}/><h2>{admin ? "Доступ администратора" : "Мой доступ"}</h2>
      {admin ? <p>Все комплекты и черновики. <Link href="/admin/catalog">Управление комплектами →</Link></p> : user.libraryAccessForever ? <div className="subscription-line"><strong>Все материалы · навсегда</strong><span>Математика и информатика</span><small>Включая новые комплекты. Без срока окончания.</small></div> : <p>Откройте «Мои материалы», чтобы посмотреть доступные комплекты. По вопросам доступа напишите администратору.</p>}
      <Link href="/cabinet/library">Мои материалы <IconArrowRight size={16}/></Link></div>
      <div><IconLibrary size={25}/><h2>К уроку всё готово</h2><p>Выберите тему и откройте комплект: презентацию, задания и материалы для печати.</p><Link href="/materials">Выбрать задание ЕГЭ <IconArrowRight size={16}/></Link></div></section>
    <section className="cabinet-bookmarks"><h2><IconBookmark size={22}/> Сохранённые материалы</h2>{bookmarks.length ? bookmarks.map(b=><Link className="saved-material" href={`/catalog/${b.product!.slug}`} key={b.id}>{b.product!.title}<IconArrowRight size={18}/></Link>) : <div className="library-empty"><h3>Соберите свою полку материалов</h3><p>Нажмите «В закладки» на странице комплекта, чтобы вернуться к нему позже.</p><Link href="/catalog" className="btn btn-outline">Открыть каталог</Link></div>}</section>
  </div>;
}
