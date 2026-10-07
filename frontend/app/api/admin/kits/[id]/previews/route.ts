import {NextResponse} from "next/server";
import {catalogAdmin,sameOrigin} from "@/lib/catalog-admin";
import {parseStrings,previewLabels} from "@/lib/catalog-kit";
import {prisma} from "@/lib/db";
import {limitedBody} from "@/lib/request-body";
import {getStorageRoot} from "@/lib/storage";
import sharp from "sharp";
import {randomUUID} from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
export const runtime="nodejs";
export async function POST(req:Request,{params}:{params:{id:string}}){
 if(!await catalogAdmin()||!sameOrigin(req))return NextResponse.json({error:"admin_required"},{status:403});
 const kit=await prisma.product.findUnique({where:{id:params.id},include:{assets:true}});
 if(!kit)return NextResponse.json({error:"not_found"},{status:404});
 const pages=parseStrings(kit.previewPagesJson),labels=previewLabels(kit);
 if(pages.length>=40)return NextResponse.json({error:"Не более 40 превью на комплект"},{status:400});
 const label=new URL(req.url).searchParams.get("label")?.trim();
 if(!label||label.length>120)return NextResponse.json({error:"Добавьте подпись страницы"},{status:400});
 let absolute:string|undefined;
 try{
  const bytes=await limitedBody(req,2*1024*1024);
  const metadata=await sharp(bytes,{limitInputPixels:16000000}).metadata();
  if(!["png","jpeg","webp"].includes(metadata.format||"")||(metadata.pages||1)>1)throw new Error("invalid_image");
  const output=await sharp(bytes,{limitInputPixels:16000000}).rotate().resize({width:1400,height:1600,fit:"inside",withoutEnlargement:true}).webp({quality:80}).toBuffer();
  const relative=`products/${kit.id}/preview-${randomUUID()}.webp`;
  absolute=path.join(getStorageRoot(),relative);await fs.mkdir(path.dirname(absolute),{recursive:true});await fs.writeFile(absolute,output);
  // Optimistic condition prevents two editors from silently overwriting each other.
  const updated=await prisma.product.updateMany({where:{id:kit.id,updatedAt:kit.updatedAt},data:{previewPagesJson:JSON.stringify([...pages,relative]),previewLabelsJson:JSON.stringify([...labels,label]),previewPath:kit.previewPath||relative}});
  if(!updated.count){await fs.unlink(absolute);return NextResponse.json({error:"Комплект изменён. Обновите страницу."},{status:409});}
  return NextResponse.json({ok:true});
 }catch{if(absolute)await fs.unlink(absolute).catch(()=>{});return NextResponse.json({error:"Нужна небольшая картинка PNG, JPG или WebP: до 2 МБ и 16 мегапикселей."},{status:400});}
}
