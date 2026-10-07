import { z } from "zod";

export function validDiskFolder(value: string): boolean {
  try { const u = new URL(value); return u.protocol === "https:" && ["disk.yandex.ru", "disk.yandex.com", "yadi.sk"].includes(u.hostname) && !u.username && !u.password && !u.port && /^\/d\/[A-Za-z0-9_-]+\/?$/.test(u.pathname) && !u.search && !u.hash; } catch { return false; }
}
export const kitSchema = z.object({
  title: z.string().trim().min(3).max(180),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100),
  description: z.string().trim().max(4000),
  subject: z.enum(["math", "informatics"]),
  examTask: z.number().int().min(1).max(27).nullable(),
  topic: z.string().trim().max(160), subtopic: z.string().trim().max(160),
  kind: z.enum(["lesson_kit", "worksheet", "presentation", "test", "course_bundle"]),
  composition: z.array(z.string().trim().min(1).max(100)).max(16),
  diskFolderUrl: z.string().refine(v => !v || validDiskFolder(v), "Нужна ссылка /d/ на весь комплект Яндекс Диска"),
  bundleTier: z.enum(["basic", "source"]),
  isPublished: z.boolean(), isFree: z.boolean(),
}).strict();
export function parseStrings(value?: string | null): string[] {
  try { const items = JSON.parse(value || "[]"); return Array.isArray(items) ? items.filter(i => typeof i === "string") : []; } catch { return []; }
}
export function previewLabels(product: {previewPagesJson:string|null;previewLabelsJson:string|null;assets:{sortKey:number;label:string}[]}):string[] {
  const saved = parseStrings(product.previewLabelsJson);
  return parseStrings(product.previewPagesJson).map((p,i) => {
    if(saved[i])return saved[i];
    const match = p.match(/gal-[a-z]-(\d+)-(\d+)\.(?:png|webp|jpg)$/);
    return match ? `${product.assets.find(a=>a.sortKey===Number(match[1]))?.label || "Материал"} · ${Number(match[2])}` : `Страница · ${i+1}`;
  });
}
export function fanIndices(labels:string[]):number[]{
  const seen=new Set<string>(); const indices:number[]=[];
  labels.forEach((label,i)=>{const group=label.split(" · ")[0];if(!seen.has(group)){seen.add(group);indices.push(i);}});
  return indices.slice(0,3);
}
