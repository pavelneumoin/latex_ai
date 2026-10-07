import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getProductAccess } from "@/lib/entitlements";
import { subjectName } from "@/lib/products";

export const dynamic = "force-dynamic";
type Kit = {id:string;slug:string;title:string;subject:string;course:string|null};

export default async function LibraryPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const [products, bookmarks, likes] = await Promise.all([
    prisma.product.findMany({where:{isPublished:true},orderBy:[{subject:"desc"},{examTask:"asc"},{lessonNo:"asc"}]}),
    prisma.favorite.findMany({where:{userId:user.id,product:{isPublished:true}},include:{product:true},orderBy:{createdAt:"desc"}}),
    prisma.productLike.findMany({where:{userId:user.id,product:{isPublished:true}},include:{product:true},orderBy:{createdAt:"desc"}}),
  ]);
  const accessible = (await Promise.all(products.map(async p=>(await getProductAccess(user.id,p)).maxTier ? p : null))).filter((p):p is typeof products[number]=>p!==null);
  return <div style={{display:"flex",flexDirection:"column",gap:24,maxWidth:1060}}>
    <div><h1>Мои материалы</h1><p className="muted" style={{marginTop:8}}>Доступные комплекты и ваши подборки.</p></div>
    <KitSection title="Доступно в библиотеке" products={accessible}/>
    {!accessible.length && <div className="library-empty"><p>Доступные вам комплекты появятся здесь.</p><Link href="/access">Как получить доступ →</Link></div>}
    <KitSection title="Закладки" products={bookmarks.flatMap(b=>b.product?[b.product]:[])}/>
    <KitSection title="Понравившиеся" products={likes.map(l=>l.product)}/>
  </div>;
}

function KitSection({title,products}:{title:string;products:Kit[]}) {
  if (!products.length) return null;
  return <section><h2 style={{fontSize:20,marginBottom:12}}>{title}</h2><div className="rl-grid rl-grid-2">{products.map(p=><Link key={p.id} href={`/catalog/${p.slug}`} className="card card-hover rl2-card-subject" data-subject={p.subject} style={{padding:18,textDecoration:"none",minWidth:0}}><small className="muted">{subjectName(p.subject)}{p.course?` · ${p.course}`:""}</small><h3 style={{fontSize:17,lineHeight:1.4,margin:"8px 0 14px"}}>{p.title}</h3><span style={{fontSize:13,color:"var(--primary)"}}>Посмотреть комплект →</span></Link>)}</div></section>;
}
