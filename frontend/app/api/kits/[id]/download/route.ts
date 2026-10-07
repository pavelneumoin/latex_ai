import {NextResponse} from "next/server";
import {prisma} from "@/lib/db";
import {getSessionUser} from "@/lib/session";
import {isCatalogAdmin} from "@/lib/catalog-admin";
import {getProductAccess,tierRank} from "@/lib/entitlements";
import {validDiskFolder} from "@/lib/catalog-kit";
export const dynamic="force-dynamic";
export async function GET(_req:Request,{params}:{params:{id:string}}){
 const user=await getSessionUser();
 if(!user)return NextResponse.json({error:"login_required"},{status:401});
 const product=await prisma.product.findUnique({where:{id:params.id}});
 if(!product||(!product.isPublished&&!await isCatalogAdmin(user.id)))return NextResponse.json({error:"not_found"},{status:404});
 const access=await getProductAccess(user.id,product);
 if(!access.maxTier||tierRank(access.maxTier)<tierRank(product.bundleTier))return NextResponse.json({error:"access_required"},{status:403});
 if(!product.diskFolderUrl||!validDiskFolder(product.diskFolderUrl))return NextResponse.json({error:"bundle_link_pending"},{status:409});
 // No PDF, archive, or Disk API token passes through this server.
 return new NextResponse(null,{status:303,headers:{Location:product.diskFolderUrl,"Cache-Control":"private, no-store","Referrer-Policy":"no-referrer"}});
}
