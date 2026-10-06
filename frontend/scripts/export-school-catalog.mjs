// Export only the public storefront: metadata and two preview images per kit.
// Paid files, account data and storage paths never enter the school's public folder.
import { PrismaClient } from '@prisma/client';
import fs from 'node:fs/promises';
import path from 'node:path';

process.loadEnvFile('.env');
const destination = path.resolve(process.argv[2] || '../../school-ege');
const storage = await fs.realpath(process.env.STORAGE_DIR || 'storage');
const db = new PrismaClient();
try {
  await fs.access(path.join(destination, 'components', 'SiteHeader.tsx'));
  const plan = await db.plan.findUniqueOrThrow({ where: { id: 'all' } });
  if (!plan.isActive || plan.priceMonthly <= 0) throw new Error('Monthly library plan is unavailable');
  const products = await db.product.findMany({
    where: { isPublished: true },
    orderBy: { subject: 'desc' },
    select: { slug: true, title: true, subject: true, description: true, course: true, previewPagesJson: true,
      assets: { select: { kind: true, label: true, pages: true, sortKey: true }, orderBy: { sortKey: 'asc' } } },
  });
  const items = [];
  const imagesDir = path.join(destination, 'public', 'teachers', 'previews');
  await fs.mkdir(imagesDir, { recursive: true });
  for (const product of products) {
    if (!/^[a-z0-9-]+$/.test(product.slug)) throw new Error('Invalid product slug');
    const previews = JSON.parse(product.previewPagesJson || '[]');
    const images = {};
    for (const [name, kind] of [['cover', 'presentation_pdf'], ['worksheet', 'worksheet_pdf']]) {
      const asset = product.assets.find(a => a.kind === kind);
      const relative = previews.find(p => new RegExp(`gal-[a-z]-${asset?.sortKey}-0*1\\.png$`).test(p));
      if (!relative) throw new Error(`Missing ${name} preview: ${product.slug}`);
      const source = await fs.realpath(path.resolve(storage, relative));
      if (!source.startsWith(storage + path.sep) || !source.endsWith('.png')) throw new Error('Unsafe preview path');
      const filename = `${product.slug}-${name}.png`;
      await fs.copyFile(source, path.join(imagesDir, filename));
      images[name] = `/teachers/previews/${filename}`;
    }
    items.push({ slug: product.slug, title: product.title, subject: product.subject,
      description: product.description, examTask: Number(product.course?.match(/Задание\s*(\d+)/i)?.[1]),
      images, assets: product.assets.map(({ kind, label, pages }) => ({ kind, label, pages })) });
  }
  await fs.writeFile(path.join(destination, 'lib', 'teacher-library-catalog.json'), JSON.stringify({
    monthlyPriceRub: plan.priceMonthly / 100, regularPriceRub: 1000, items,
  }, null, 2) + '\n');
  console.log(`Exported ${items.length} published kits and ${items.length * 2} public previews. No paid PDFs or account data exported.`);
} finally { await db.$disconnect(); }
