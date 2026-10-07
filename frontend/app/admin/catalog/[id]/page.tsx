import {notFound,redirect} from "next/navigation";
import Link from "next/link";
import {catalogAdmin} from "@/lib/catalog-admin";
import {prisma} from "@/lib/db";
import {parseStrings,previewLabels} from "@/lib/catalog-kit";
import {Header} from "../../../_components/Header";
import {KitEditor} from "../KitEditor";
export const dynamic="force-dynamic";
export default async function EditKitPage({params}:{params:{id:string}}){
 if(!await catalogAdmin())redirect("/login?callbackUrl=/admin/catalog");
 const kit=params.id==="new"?null:await prisma.product.findUnique({where:{id:params.id},include:{assets:{orderBy:{sortKey:"asc"}}}});
 if(params.id!=="new"&&!kit)notFound();
 return <div className="hi"><Header/><main className="catalog-admin-page"><Link href="/admin/catalog">← Все комплекты</Link><h1>{kit?"Редактирование комплекта":"Новый комплект"}</h1><KitEditor id={kit?.id} initial={kit?{title:kit.title,slug:kit.slug,description:kit.description||"",subject:kit.subject,examTask:kit.examTask??(Number(kit.course?.match(/Задание\s*(\d+)/i)?.[1])||null),topic:kit.topic||"",subtopic:kit.subtopic||"",kind:kit.kind,composition:kit.compositionJson?parseStrings(kit.compositionJson):kit.assets.map(a=>a.label),diskFolderUrl:kit.diskFolderUrl||"",bundleTier:kit.bundleTier,isFree:kit.isFree,isPublished:kit.isPublished}:undefined} labels={kit?previewLabels(kit):[]}/></main></div>;
}
