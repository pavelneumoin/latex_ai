// Public catalog export. Only approved preview images and descriptive metadata.
// No Disk download URLs, PDF assets, answer keys, or account records are exported.
import {PrismaClient} from '@prisma/client';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
process.loadEnvFile('.env');
const destination=path.resolve(process.argv[2]||'../../school-ege');
const storage=await fs.realpath(process.env.STORAGE_DIR||'storage');
const db=new PrismaClient();
try{
 await fs.access(path.join(destination,'components','SiteHeader.tsx'));
 const plan=await db.plan.findUniqueOrThrow({where:{id:'all'}});
 if(!plan.isActive||plan.priceMonthly<=0)throw new Error('Monthly plan unavailable');
 const products=await db.product.findMany({where:{isPublished:true},orderBy:{subject:'desc'},select:{slug:true,title:true,subject:true,description:true,course:true,examTask:true,topic:true,subtopic:true,kind:true,compositionJson:true,previewPagesJson:true,previewLabelsJson:true,assets:{select:{kind:true,label:true,pages:true,sortKey:true},orderBy:{sortKey:'asc'}}}});
 const dir=path.join(destination,'public','teachers','previews');await fs.mkdir(dir,{recursive:true});const items=[];let total=0;
 for(const product of products){
  if(!/^[a-z0-9-]+$/.test(product.slug))throw new Error('Invalid slug');
  const paths=JSON.parse(product.previewPagesJson||'[]'),savedLabels=JSON.parse(product.previewLabelsJson||'[]'),previews=[];
  for(const [i,relative] of paths.entries()){
   const source=await fs.realpath(path.resolve(storage,relative));
   if(!source.startsWith(storage+path.sep)||!/[.](png|webp|jpe?g)$/i.test(source))throw new Error('Unsafe preview');
   const filename=product.slug+'-page-'+i+'.webp';
   const output=await sharp(source,{limitInputPixels:16000000}).resize({width:1400,height:1600,fit:'inside',withoutEnlargement:true}).webp({quality:78}).toBuffer();
   await fs.writeFile(path.join(dir,filename),output);total+=output.length;
   const match=relative.match(/gal-[a-z]-(\d+)-(\d+)\.(?:png|webp|jpg)$/);
   const label=savedLabels[i]||(match?(product.assets.find(a=>a.sortKey===Number(match[1]))?.label||'Материал')+' · '+Number(match[2]):'Страница · '+(i+1));
   previews.push({src:'/teachers/previews/'+filename,label});
  }
  const cover=previews.find(p=>p.label.startsWith('Презентация'))?.src||previews[0]?.src||null;
  const worksheet=previews.find(p=>p.label.startsWith('Рабочий лист'))?.src||cover;
  items.push({slug:product.slug,title:product.title,subject:product.subject,description:product.description,examTask:product.examTask??(Number(product.course?.match(/Задание\s*(\d+)/i)?.[1])||null),topic:product.topic||'',subtopic:product.subtopic||'',kind:product.kind,composition:JSON.parse(product.compositionJson||'[]'),images:{cover,worksheet},previews,assets:product.assets.map(({kind,label,pages})=>({kind,label,pages}))});
 }
 await fs.writeFile(path.join(destination,'lib','teacher-library-catalog.json'),JSON.stringify({monthlyPriceRub:plan.priceMonthly/100,regularPriceRub:1000,items},null,2)+'\n');
 console.log(JSON.stringify({kits:items.length,previewBytes:total,previews:items.reduce((n,p)=>n+p.previews.length,0),privateDataExported:false}));
}finally{await db.$disconnect();}
