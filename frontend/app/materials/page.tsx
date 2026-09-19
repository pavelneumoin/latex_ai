import { Header } from "../_components/Header";
import { prisma } from "@/lib/db";
import { ExamNavigator } from "./ExamNavigator";
export const dynamic = "force-dynamic";
export const metadata = { title: "Навигатор ЕГЭ — Неумошка" };
export default async function MaterialsPage(){const products=await prisma.product.findMany({where:{isPublished:true},select:{id:true,slug:true,title:true,subject:true,course:true,courseSlug:true,audience:true,previewPath:true,assets:{select:{kind:true}}}});return <div className="hi library-site"><Header/><ExamNavigator products={products}/></div>}
