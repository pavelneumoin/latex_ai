import NextAuth from "next-auth";
import { NextRequest } from "next/server";
import { authOptions } from "@/lib/auth";
import { createVKIDProvider } from "@/lib/auth-vkid";
async function handler(req:NextRequest,context:{params:{nextauth:string[]}}){
 const providers=authOptions.providers.map(p=>p.id==="vkid"?createVKIDProvider(req.nextUrl.searchParams.get("device_id")??undefined):p);
 return NextAuth({...authOptions,providers})(req,context);
}
export {handler as GET,handler as POST};
