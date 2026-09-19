import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import assert from 'node:assert/strict';
process.loadEnvFile('.env');
process.loadEnvFile('.env.local');
assert.equal(process.env.PAYMENTS_PROVIDER,'mock','This check requires the local mock server');
const origin='http://localhost:3010';
const db=new PrismaClient();
const email=`qa-${Date.now()}@local.test`,password=randomBytes(24).toString('hex');
let userId;
function client(){const jar=new Map();return async(path,init={})=>{
 const headers=new Headers(init.headers);if(jar.size)headers.set('cookie',[...jar].map(([k,v])=>`${k}=${v}`).join('; '));
 const res=await fetch(origin+path,{...init,headers,redirect:'manual'});
 for(const cookie of res.headers.getSetCookie()){const pair=cookie.split(';')[0];const i=pair.indexOf('=');jar.set(pair.slice(0,i),pair.slice(i+1));}return res;
}}
const json=(body)=>({method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
async function login(){const call=client();const csrf=await(await call('/api/auth/csrf')).json();await call('/api/auth/callback/credentials',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({email,password,csrfToken:csrf.csrfToken,callbackUrl:origin+'/cabinet',json:'true'})});const session=await(await call('/api/auth/session')).json();assert.equal(session.user.email,email);return call;}
async function run(){
 const asset=await db.productAsset.findFirst({where:{product:{isPublished:true,isFree:false}},include:{product:true}});assert.ok(asset);
 assert.equal((await fetch(origin+`/api/download/${asset.id}`)).status,401);
 let r=await fetch(origin+'/api/auth/register',json({email,password,name:'Проверка локального запуска'}));assert.equal(r.status,200);userId=(await r.json()).user.id;
 const call=await login();assert.equal((await call(`/api/download/${asset.id}`)).status,403);
 for(const path of ['/api/worksheets','/api/checks','/api/bank/stats'])assert.equal((await call(path)).status,403);
 for(const body of [{planId:'all',period:'year'},{planId:'math',period:'month'},{credits:10}])assert.equal((await call('/api/billing/create-payment',json(body))).status,400);
 r=await call('/api/billing/create-payment',json({planId:'all',period:'month'}));assert.equal(r.status,200);const result=await r.json();
 const payment=await db.payment.findUniqueOrThrow({where:{id:result.paymentId}});assert.equal(payment.provider,'mock');assert.equal(payment.amount,49900);
 const event={providerPaymentId:payment.providerPaymentId,status:'succeeded',amount:payment.amount,currency:payment.currency};
 assert.equal((await call('/api/webhooks/yookassa',json({...event,amount:1}))).status,400);
 r=await call('/api/webhooks/yookassa',json(event));assert.equal(r.status,200);
 const sub=await db.subscription.findUniqueOrThrow({where:{userId_subject:{userId,subject:'all'}}});assert.equal(sub.planId,'all');assert.equal(sub.cancelAtPeriodEnd,true);assert.ok(sub.currentPeriodEnd>new Date(Date.now()+27*86400000));
 r=await call('/api/webhooks/yookassa',json(event));assert.equal((await r.json()).duplicate,true);
 assert.equal((await db.subscription.findUniqueOrThrow({where:{id:sub.id}})).currentPeriodEnd.toISOString(),sub.currentPeriodEnd.toISOString());
 const secondSession=await login();r=await secondSession(`/api/download/${asset.id}`);assert.equal(r.status,200);const file=Buffer.from(await r.arrayBuffer());assert.equal(file.subarray(0,4).toString(),'%PDF');
 await db.subscription.update({where:{id:sub.id},data:{currentPeriodEnd:new Date(Date.now()-86400000)}});
 assert.equal((await secondSession(`/api/download/${asset.id}`)).status,403);
 console.log('PASS: registration, login, locked download, feature gates, 499 RUB mock payment, amount verification, monthly access, duplicate webhook, new-session download and expiry.');
}
try{await run()}finally{
 if(userId){await db.$transaction([db.payment.deleteMany({where:{userId}}),db.subscription.deleteMany({where:{userId}}),db.account.deleteMany({where:{userId}}),db.session.deleteMany({where:{userId}}),db.user.delete({where:{id:userId}})]);}
 await db.$disconnect();
}
