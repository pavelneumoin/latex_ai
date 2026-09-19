import { PrismaClient } from '@prisma/client';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

process.loadEnvFile('.env');
const db = new PrismaClient();
const kits = [
  { root: process.env.MATH_KIT_DIR, slug: 'ege-math-08-circle', title: 'Числовая окружность', subject: 'math', course: 'ЕГЭ · Задание 8', courseSlug: 'math-ege-08', description: 'Числовая окружность: знакомство с углами, точками и отсчётом на окружности. Презентация, рабочий лист, домашнее задание, два варианта зачётной работы и шпаргалка.' },
  { root: process.env.INF_KIT_DIR, slug: 'ege-informatics-07-images', title: 'Кодирование изображений', subject: 'informatics', course: 'ЕГЭ · Задание 7', courseSlug: 'informatics-ege-07', description: 'Кодирование растровых изображений: подготовка к заданию 7 ЕГЭ. Презентация, рабочий лист, домашнее задание с ответами и без ответов, два варианта зачётной работы.' },
];
const types = [
  ['Презентация', 'presentation_pdf', 'Презентация', 'p', 5],
  ['Рабочий лист', 'worksheet_pdf', 'Рабочий лист', 'w', 3],
  ['Домашнее задание', 'homework_pdf', 'Домашнее задание', 'h', 2],
  ['Зачётная работа', 'test_pdf', 'Проверочная работа', 't', 1],
  ['Шпаргалка', 'cheatsheet_pdf', 'Шпаргалка', 's', 1],
];
async function main() {
  for (const kit of kits) {
    if (!kit.root || !(await fs.stat(kit.root)).isDirectory()) throw new Error('Both MATH_KIT_DIR and INF_KIT_DIR must point to the supplied kits');
  }
  for (const kit of kits) {
    let files = [];
    for (const entry of await fs.readdir(kit.root, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.toLowerCase().endsWith('.pdf')) files.push(path.join(kit.root, entry.name));
      if (entry.isDirectory() && /^(Презентация|Рабочий лист|Домашнее задание|Зачётная работа)/i.test(entry.name)) {
        for (const file of await fs.readdir(path.join(kit.root, entry.name))) if (file.toLowerCase().endsWith('.pdf')) files.push(path.join(kit.root, entry.name, file));
      }
    }
    files = files.sort((a,b)=>a.localeCompare(b,'ru'));
    const folder = path.join('storage', 'products', kit.slug);
    await fs.mkdir(folder, { recursive: true });
    const assets = [], previews = [];
    for (const [match, kind, label, prefix, maxPages] of types) {
      for (const file of files.filter(f => f.toLocaleLowerCase('ru').includes(match.toLocaleLowerCase('ru')))) {
        const filename = path.basename(file);
        const info = spawnSync('pdfinfo', [file], { encoding: 'utf8', timeout: 30000 });
        if (info.status !== 0) throw new Error(`Cannot read PDF: ${filename}`);
        const pages = Number(info.stdout.match(/^Pages:\s*(\d+)/m)?.[1] ?? 0);
        const target = path.join(folder, filename);
        await fs.copyFile(file, target);
        const index = assets.length;
        let display = label;
        if (/без ответов/i.test(filename)) display += ' · без ответов';
        else if (kind === 'homework_pdf' && kit.subject === 'informatics') display += ' · с ответами';
        if (kind === 'test_pdf') display += ` · вариант ${filename.match(/работа\s*(\d)/i)?.[1] ?? ''}`;
        assets.push({kind, tier:'basic', label:display, path:`products/${kit.slug}/${filename}`, size:(await fs.stat(target)).size, pages, sortKey:index});
        const previewPrefix = `gal-${prefix}-${index}`;
        const render = spawnSync('pdftoppm', ['-png','-scale-to','1500','-f','1','-l',String(Math.min(pages,maxPages)),file,path.join(folder,previewPrefix)], {timeout:120000});
        if (render.status !== 0) throw new Error(`Cannot render preview: ${filename}`);
        const images = (await fs.readdir(folder)).filter(f=>f.startsWith(previewPrefix+'-') && f.endsWith('.png')).sort();
        previews.push(...images.map(f=>`products/${kit.slug}/${f}`));
        console.log(`${kit.slug}: ${display} (${pages} pages, ${images.length} previews)`);
      }
    }
    if (!assets.length) throw new Error(`No current PDF files found: ${kit.slug}`);
    await db.$transaction(async tx => {
      const { root, ...data } = kit;
      const product = await tx.product.upsert({where:{slug:kit.slug},create:{...data,audience:'10–11 класс · ЕГЭ',isFree:false,priceBasic:49900,previewPath:previews[0],previewPagesJson:JSON.stringify(previews)},update:{...data,isFree:false,priceBasic:49900,previewPath:previews[0],previewPagesJson:JSON.stringify(previews)}});
      await tx.productAsset.deleteMany({where:{productId:product.id}});
      await tx.productAsset.createMany({data:assets.map(a=>({...a,productId:product.id}))});
    });
  }
  console.log('Imported review kits:', await db.product.count());
}
main().catch(e=>{console.error(e.message);process.exitCode=1}).finally(()=>db.$disconnect());
