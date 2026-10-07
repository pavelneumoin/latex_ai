import {NextResponse} from "next/server";
import {catalogAdmin,sameOrigin} from "@/lib/catalog-admin";
import {kitSchema} from "@/lib/catalog-kit";
import {prisma} from "@/lib/db";
import {limitedBody} from "@/lib/request-body";
export async function POST(req:Request){
 if(!await catalogAdmin())return NextResponse.json({error:"admin_required"},{status:403});
 if(!sameOrigin(req))return NextResponse.json({error:"invalid_origin"},{status:403});
 try{
  const parsed=kitSchema.safeParse(JSON.parse(new TextDecoder().decode(await limitedBody(req,32000))));
  if(!parsed.success)return NextResponse.json({error:parsed.error.issues[0].message},{status:400});
  const {composition,...input}=parsed.data;
  const kit=await prisma.product.create({data:{...input,compositionJson:JSON.stringify(composition),diskFolderUrl:input.diskFolderUrl||null,course:input.examTask?`ЕГЭ · Задание ${input.examTask}`:"ЕГЭ",audience:"10–11 класс · ЕГЭ"}});
  return NextResponse.json({id:kit.id},{status:201});
 }catch(e){return NextResponse.json({error:e instanceof Error&&e.message==="too_large"?"Слишком большой запрос":"Не удалось сохранить. Проверьте уникальность адреса комплекта."},{status:400});}
}
