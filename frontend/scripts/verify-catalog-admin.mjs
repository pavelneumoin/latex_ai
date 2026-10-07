import {PrismaClient} from '@prisma/client';
import fs from 'node:fs/promises';import path from 'node:path';import assert from 'node:assert/strict';import bcrypt from 'bcryptjs';import {randomBytes} from 'node:crypto';
process.loadEnvFile('.env');process.loadEnvFile('.env.local');
const origin=process.env.QA_ORIGIN||'http://localhost:3015';
if(!/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin))throw new Error('Local verification only');
const db=new PrismaClient(),createdUsers=[],kitIds=[],checks=[];
const password=randomBytes(24).toString('hex'),prefix='qa-catalog-'+Date.now();
function client(){const jar=new Map();return async(route,init={})=>{const headers=new Headers(init.headers);if(jar.size)headers.set('cookie',[...jar].map(([k,v])=>k+'='+v).join('; '));const r=await fetch(origin+route,{...init,headers,redirect:'manual'});for(const cookie of r.headers.getSetCookie()){const pair=cookie.split(';')[0],i=pair.indexOf('=');jar.set(pair.slice(0,i),pair.slice(i+1));}return r;};}
function body(data,method='POST',requestOrigin=origin){return {method,headers:{'Content-Type':'application/json',origin:requestOrigin},body:JSON.stringify(data)};}
async function login(role){const email=prefix+'-'+role+'@local.test';const user=await db.user.create({data:{email,passwordHash:await bcrypt.hash(password,10),role,status:'active'}});createdUsers.push(user.id);const call=client(),csrf=await(await call('/api/auth/csrf')).json();await call('/api/auth/callback/credentials',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({email,password,csrfToken:csrf.csrfToken,callbackUrl:origin,json:'true'})});assert.equal((await(await call('/api/auth/session')).json()).user.email,email);return {call,user};}
async function status(name,r,expected){assert.equal(r.status,expected,name);checks.push(name+': '+expected);return r;}
try{
 const anon=client(),admin=await login('admin'),user=await login('user');
 const fixture={title:'QA временный комплект',slug:prefix,description:'Only local verification',subject:'math',examTask:8,topic:'Тригонометрия',subtopic:'QA',kind:'lesson_kit',composition:['Рабочий лист'],diskFolderUrl:'',bundleTier:'basic',isFree:false,isPublished:false};
 await status('anonymous cannot create',await anon('/api/admin/kits',body(fixture)),403);
 await status('ordinary user cannot create',await user.call('/api/admin/kits',body(fixture)),403);
 await status('cross-origin admin write rejected',await admin.call('/api/admin/kits',body(fixture,'POST','https://example.invalid')),403);
 await status('external download host rejected',await admin.call('/api/admin/kits',body({...fixture,diskFolderUrl:'https://example.invalid/archive'})),400);
 await status('individual PDF link rejected',await admin.call('/api/admin/kits',body({...fixture,diskFolderUrl:'https://disk.yandex.ru/i/U5cbPb2EQmeUPg'})),400);
 const created=await(await status('admin creates draft',await admin.call('/api/admin/kits',body(fixture)),201)).json();kitIds.push(created.id);
 const root='/api/kits/'+created.id+'/download';
 const draftHtml=await(await anon('/catalog/'+prefix)).text();assert.ok(!draftHtml.includes(fixture.title));assert.ok(draftHtml.includes('NEXT_NOT_FOUND'));checks.push('draft page returns Next not-found without kit contents');
 await status('draft preview hidden',await anon('/api/preview/'+created.id),404);
 await status('missing bundle link is explicit',await admin.call(root),409);
 const source=await db.product.findUniqueOrThrow({where:{slug:'ege-math-08-circle'}});
 const png=await fs.readFile(path.join(process.env.STORAGE_DIR||'storage',source.previewPath));
 await status('non-admin preview upload denied',await user.call('/api/admin/kits/'+created.id+'/previews?label=QA',{method:'POST',headers:{origin},body:png}),403);
 await status('SVG rejected',await admin.call('/api/admin/kits/'+created.id+'/previews?label=QA',{method:'POST',headers:{origin},body:'<svg/>'}),400);
 await status('real preview uploaded',await admin.call('/api/admin/kits/'+created.id+'/previews?label='+encodeURIComponent('Рабочий лист · 1'),{method:'POST',headers:{origin},body:png}),200);
 const preview=await status('admin draft preview allowed',await admin.call('/api/preview/'+created.id),200);
 assert.equal(preview.headers.get('cache-control'),'private, no-store');assert.equal(preview.headers.get('content-type'),'image/webp');
 await status('ordinary draft preview denied',await user.call('/api/preview/'+created.id),404);
 // Existing user-supplied Disk URL is a transport fixture only; never followed or kept as a kit link.
 const published={...fixture,isPublished:true,diskFolderUrl:'https://disk.yandex.ru/d/Ez3ar5XCnsYGHA'};
 await status('admin publishes kit',await admin.call('/api/admin/kits/'+created.id,body(published,'PUT')),200);
 await status('public preview allowed',await anon('/api/preview/'+created.id),200);
 await status('anonymous download denied',await anon(root),401);
 await status('unpaid download denied',await user.call(root),403);
 const redirect=await status('admin bundle redirect',await admin.call(root),303);assert.equal(redirect.headers.get('location'),published.diskFolderUrl);
 const html=await(await anon('/catalog/'+prefix)).text();assert.ok(!html.includes(published.diskFolderUrl),'private link not serialized to public page');
 await db.subscription.create({data:{userId:user.user.id,planId:'all',subject:'all',currentPeriodEnd:new Date(Date.now()+86400000)}});
 await status('paid reader bundle redirect',await user.call(root),303);
 await db.subscription.updateMany({where:{userId:user.user.id},data:{currentPeriodEnd:new Date(0)}});
 await status('expired access denied',await user.call(root),403);
 await db.user.update({where:{id:admin.user.id},data:{role:'user'}});
 await status('revoked role cannot edit with old session',await admin.call('/api/admin/kits/'+created.id,body(published,'PUT')),403);
 await status('revoked role cannot download with old session',await admin.call(root),403);
 console.log(JSON.stringify({passed:checks.length,checks,realBundleDownloadVerified:false},null,2));
}finally{
 for(const id of kitIds){const p=await db.product.findUnique({where:{id}});for(const relative of JSON.parse(p?.previewPagesJson||'[]')){const absolute=path.resolve(process.env.STORAGE_DIR||'storage',relative);const owned=path.resolve(process.env.STORAGE_DIR||'storage','products',id)+path.sep;if(!absolute.startsWith(owned))throw new Error('Unexpected fixture path');await fs.unlink(absolute);}await db.product.delete({where:{id}});}
 for(const id of createdUsers)await db.user.delete({where:{id}});
 await db.$disconnect();
}
