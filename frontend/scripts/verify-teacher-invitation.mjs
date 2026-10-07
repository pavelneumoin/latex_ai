// Only local HTTP checks; never touches the school database or follows Disk URLs.
import {PrismaClient} from '@prisma/client';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import {randomBytes} from 'node:crypto';
import nextEnv from '@next/env';
nextEnv.loadEnvConfig(process.cwd());
const origin=process.env.QA_ORIGIN||'http://localhost:3015';
if(!/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin))throw new Error('Local verification only');
const credentials=JSON.parse(await fs.readFile(process.argv[2],'utf8'));
const db=new PrismaClient(),users=[],kits=[],checks=[];
const prefix='qa-invitation-'+Date.now(),password=randomBytes(18).toString('base64url');
function client(){const jar=new Map();return async(route,init={})=>{const headers=new Headers(init.headers);if(jar.size)headers.set('cookie',[...jar].map(([k,v])=>k+'='+v).join('; '));const r=await fetch(origin+route,{...init,headers,redirect:'manual'});for(const cookie of r.headers.getSetCookie()){const pair=cookie.split(';')[0],i=pair.indexOf('=');jar.set(pair.slice(0,i),pair.slice(i+1));}return r;};}
async function login(data){const call=client(),csrf=await(await call('/api/auth/csrf')).json();await call('/api/auth/callback/credentials',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({...data,csrfToken:csrf.csrfToken,callbackUrl:origin+'/cabinet',json:'true'})});return call;}
async function status(name,response,expected){assert.equal(response.status,expected,name);checks.push(name);return response;}
try{
 const teacher=await db.user.findUniqueOrThrow({where:{username:credentials.username}});
 assert.equal(teacher.email,null);assert.equal(teacher.role,'user');assert.equal(teacher.libraryAccessForever,true);
 const call=await login({username:credentials.username.toUpperCase(),password:credentials.password}),anon=client();
 assert.equal((await(await call('/api/auth/session')).json()).user.id,teacher.id);checks.push('Issued username login, no email');
 const me=await(await call('/api/me')).json();assert.equal(me.user.libraryAccessForever,true);assert.equal(me.user.role,'user');
 await status('Teacher cannot edit the catalog',await call('/api/admin/kits',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:'{}'}),403);
 const products=await db.product.findMany({where:{isPublished:true},include:{assets:true}});
 const library=await(await call('/cabinet/library')).text();
 for(const product of products){
  assert.ok(library.includes(product.title));checks.push('Visible kit: '+product.slug);
  await status('Full-kit link state: '+product.slug,await call('/api/kits/'+product.id+'/download'),product.diskFolderUrl?303:409);
  for(const asset of product.assets){
   const r=await status('Actual PDF: '+asset.id,await call('/api/download/'+asset.id),200);
   assert.equal(r.headers.get('content-type'),'application/pdf');
   const pdf=Buffer.from(await r.arrayBuffer());assert.equal(pdf.subarray(0,5).toString(),'%PDF-');assert.ok(pdf.length>1000);
   await status('Anonymous PDF is protected',await anon('/api/download/'+asset.id),401);
  }
 }
 const ordinary=await db.user.create({data:{username:prefix,role:'user',passwordHash:await bcrypt.hash(password,4)}});users.push(ordinary.id);
 const ordinaryCall=await login({username:prefix,password});
 // This known user-supplied Disk address is only a redirect fixture and is never followed.
 const kit=await db.product.create({data:{slug:prefix,title:'QA future kit',subject:'informatics',isFree:false,isPublished:true,diskFolderUrl:'https://disk.yandex.ru/d/Ez3ar5XCnsYGHA',bundleTier:'source'}});kits.push(kit.id);
 const route='/api/kits/'+kit.id+'/download';
 const redirection=await status('Lifetime invitation covers future source-tier kit',await call(route),303);assert.equal(redirection.headers.get('location'),kit.diskFolderUrl);
 await status('Uninvited user is denied',await ordinaryCall(route),403);
 await db.product.update({where:{id:kit.id},data:{isPublished:false}});
 await status('Invited teacher cannot read draft kits',await call(route),404);
 await db.product.update({where:{id:kit.id},data:{isPublished:true}});
 await db.user.update({where:{id:ordinary.id},data:{libraryAccessForever:true}});
 await status('Server reads new grant without re-login',await ordinaryCall(route),303);
 await db.user.update({where:{id:ordinary.id},data:{status:'banned'}});
 await status('Existing session loses access when disabled',await ordinaryCall(route),401);
 const legacy=await db.user.create({data:{email:prefix+'@local.test',passwordHash:await bcrypt.hash(password,4),role:'admin'}});users.push(legacy.id);
 const ownerCall=await login({email:legacy.email,password});assert.equal((await(await ownerCall('/api/auth/session')).json()).user.id,legacy.id);checks.push('Legacy email owner login preserved');
 await status('Public registration closed',await anon('/api/auth/register',{method:'POST',body:'{}'}),403);
 await status('Payments closed',await call('/api/billing/create-payment',{method:'POST',body:'{}'}),403);
 await status('Payment callback closed',await anon('/api/webhooks/yookassa',{method:'POST',body:'{}'}),503);
 for(const route of ['/pricing','/offer','/register','/billing','/billing/success','/billing/checkout/fixture','/cabinet/billing']){
  const response=await call(route);
  if(response.status===307)assert.equal(response.headers.get('location'),'/access');
  else{assert.equal(response.status,200);assert.ok((await response.text()).includes('http-equiv="refresh" content="1;url=/access"'));}
  checks.push('Legacy page redirects: '+route);
 }
 for(const route of ['/','/catalog','/login','/access','/cabinet','/cabinet/library','/privacy','/terms']){
  const html=await(await call(route)).text();
  // Check visible HTML only; old provider code may still exist in unused bundles.
  const visible=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<[^>]*>/g,' ');
  assert.ok(!/₽|Доступ на месяц|По подписке|оплат[аиуы]|499/.test(visible),route);checks.push('No payment promotion: '+route);
 }
 console.log(JSON.stringify({passed:checks.length,pdfCount:products.reduce((n,p)=>n+p.assets.length,0),realDiskBundlesVerified:false,checks},null,2));
}finally{
 for(const id of kits)await db.product.delete({where:{id}});
 for(const id of users)await db.user.delete({where:{id}});
 await db.$disconnect();
}
