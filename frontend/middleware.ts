import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { isUnderDevelopment } from "./lib/development-access";
export async function middleware(req:NextRequest){
 const path=req.nextUrl.pathname;
 if(isUnderDevelopment(path)) return path.startsWith("/api/") ? NextResponse.json({error:"under_development",message:"Этот инструмент пока недоступен"},{status:403}) : NextResponse.redirect(new URL("/development",req.url));
 const privatePaths=["/dashboard","/cabinet","/settings","/billing","/api/billing"];
 if(privatePaths.some(p=>path===p||path.startsWith(p+"/")) && !(await getToken({req,secret:process.env.NEXTAUTH_SECRET}))){
  if(path.startsWith("/api/")) return NextResponse.json({error:"unauthorized"},{status:401});
  const login=new URL("/login",req.url);login.searchParams.set("callbackUrl",path+req.nextUrl.search);return NextResponse.redirect(login);
 }
 return NextResponse.next();
}
export const config={matcher:["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"]};
