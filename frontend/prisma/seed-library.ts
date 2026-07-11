// Сид каталога из РЕАЛЬНОЙ библиотеки курсов Павла:
//   E:\YA\YandexDisk\Lessons\library\Мой курс\<курс>\<урок>\...
//
// Понимает обе раскладки уроков:
//   A) плоские PDF «Тема — Презентация.pdf» прямо в папке урока (kurs7/45/6);
//   B) подпапки «Презентация» / «Рабочий лист» / … с PDF и исходниками
//      presentation.md (Marp) / worksheet.tex (LaTeX) внутри (kurs2/12/13/15/16/18).
//
// Превью: pdftoppm (первая страница листа/презентации + галерея до 4 страниц).
// ПОЛНОСТЬЮ заменяет прежний сид (deleteMany products).
//
// Запуск: npm run db:seed-library   (медленно: копирование + превью ≈ 2–4 мин)

import { PrismaClient } from "@prisma/client";
import { spawnSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

const LIB_DIR =
  process.env.LIBRARY_SOURCE_DIR ||
  "E:/YA/YandexDisk/Lessons/library/Мой курс";
const STORAGE_ROOT = process.env.STORAGE_DIR || path.join(process.cwd(), "storage");
const PDFTOPPM = process.env.PDFTOPPM_CMD || "pdftoppm";

const LESSON_PRICE = 4900;      // 49 ₽ PDF
const LESSON_SRC_PRICE = 12900; // 129 ₽ PDF+исходники

interface CourseCfg {
  dir: string;         // имя папки в библиотеке
  slug: string;
  title: string;
  subject: "math" | "informatics";
  order: number;
}

const COURSES: CourseCfg[] = [
  { dir: "2 задание ЕГЭ", slug: "ege02", title: "Задание 2. Векторы", subject: "math", order: 2 },
  { dir: "4-5 задание ЕГЭ", slug: "ege0405", title: "Задания 4–5. Вероятность", subject: "math", order: 4 },
  { dir: "6 задание ЕГЭ", slug: "ege06", title: "Задание 6. Уравнения", subject: "math", order: 6 },
  { dir: "7 задание ЕГЭ", slug: "ege07", title: "Задание 7. Значения выражений", subject: "math", order: 7 },
  { dir: "12 задание ЕГЭ", slug: "ege12", title: "Задание 12. Производная", subject: "math", order: 12 },
  { dir: "13 задание ЕГЭ", slug: "ege13", title: "Задание 13. Уравнения (часть 2)", subject: "math", order: 13 },
  { dir: "15 задание ЕГЭ", slug: "ege15", title: "Задание 15. Неравенства", subject: "math", order: 15 },
  { dir: "16 задание ЕГЭ", slug: "ege16", title: "Задание 16. Финансовая математика", subject: "math", order: 16 },
  { dir: "18 задание ЕГЭ", slug: "ege18", title: "Задание 18. Задачи с параметром", subject: "math", order: 18 },
];

// Папки, которые не являются уроками/артефактами
const SKIP_DIR = /^(_|figures$|VK_posts|.*Исходники|.*Банк|.*Доп_задачи|\.)/i;

// PDF-суффикс → (kind, label, sort)
const PDF_KINDS: { re: RegExp; kind: string; label: string; sort: number }[] = [
  { re: /—\s*Презентация\.pdf$/i, kind: "presentation_pdf", label: "Презентация", sort: 1 },
  { re: /—\s*Рабочий лист\.pdf$/i, kind: "worksheet_pdf", label: "Рабочий лист", sort: 2 },
  { re: /—\s*Шпаргалка\.pdf$/i, kind: "cheatsheet_pdf", label: "Шпаргалка", sort: 3 },
  { re: /—\s*Домашн\w* задание\.pdf$/i, kind: "homework_pdf", label: "Домашняя работа", sort: 4 },
  { re: /—\s*Зач[её]тная работа\s*1\.pdf$/i, kind: "test_pdf", label: "Зачёт — вариант 1", sort: 5 },
  { re: /—\s*Зач[её]тная работа\s*2\.pdf$/i, kind: "test_pdf", label: "Зачёт — вариант 2", sort: 6 },
  { re: /—\s*Зач[её]т\w*\.pdf$/i, kind: "test_pdf", label: "Зачёт", sort: 5 },
  { re: /—\s*Самостоятельная[^.]*\.pdf$/i, kind: "test_pdf", label: "Самостоятельная", sort: 5 },
];

interface FoundAsset {
  abs: string;
  kind: string;
  tier: "basic" | "source";
  label: string;
  sort: number;
}

interface FoundLesson {
  dirAbs: string;
  numberHint: number | null;
  title: string;
  blockTitle: string | null;
  assets: FoundAsset[];
  readme: string | null;
}

function natNum(s: string): number | null {
  const m = s.match(/^(\d+)/);
  return m ? Number(m[1]) : null;
}

/** «5 урок. Тема» / «5. Тема» / «Тема» → { n, title } */
function parseLessonName(base: string): { n: number | null; title: string } {
  let m = base.match(/^(\d+)\s*урок[.\s]*(.*)$/i);
  if (m) return { n: Number(m[1]), title: m[2].trim() || base };
  m = base.match(/^(\d+)[.\s]+(.*)$/);
  if (m) return { n: Number(m[1]), title: m[2].trim() || base };
  return { n: null, title: base };
}

async function isDir(p: string): Promise<boolean> {
  try {
    return (await fs.stat(p)).isDirectory();
  } catch {
    return false;
  }
}

/** Собрать ассеты урока: PDF по маскам + исходники .md/.tex из подпапок. */
async function collectAssets(dirAbs: string): Promise<FoundAsset[]> {
  const out: FoundAsset[] = [];
  const entries = await fs.readdir(dirAbs, { withFileTypes: true });

  for (const e of entries) {
    const abs = path.join(dirAbs, e.name);
    if (e.isFile()) {
      const pdfKind = PDF_KINDS.find((k) => k.re.test(e.name));
      if (pdfKind) {
        out.push({ abs, kind: pdfKind.kind, tier: "basic", label: pdfKind.label, sort: pdfKind.sort });
      }
    } else if (e.isDirectory() && !SKIP_DIR.test(e.name)) {
      // Артефактная подпапка: PDF внутри + исходники
      const subFiles = await fs.readdir(abs, { withFileTypes: true }).catch(() => []);
      for (const f of subFiles) {
        if (!f.isFile()) continue;
        const fAbs = path.join(abs, f.name);
        const pdfKind = PDF_KINDS.find((k) => k.re.test(f.name));
        if (pdfKind) {
          out.push({ abs: fAbs, kind: pdfKind.kind, tier: "basic", label: pdfKind.label, sort: pdfKind.sort });
          continue;
        }
        if (/\.md$/i.test(f.name) && !/^readme/i.test(f.name) && !/^bank/i.test(f.name)) {
          out.push({
            abs: fAbs,
            kind: "marp_src",
            tier: "source",
            label: `Исходник: ${e.name} (Marp)`,
            sort: 10 + out.length,
          });
        } else if (/\.tex$/i.test(f.name) && !/preamble/i.test(f.name)) {
          out.push({
            abs: fAbs,
            kind: "tex_src",
            tier: "source",
            label: `Исходник: ${e.name} (LaTeX)`,
            sort: 10 + out.length,
          });
        }
      }
    }
  }
  return out;
}

/** Рекурсивный поиск уроков внутри курса (глубина ≤ 3, блоки учитываются). */
async function findLessons(
  courseDir: string,
  blockTitle: string | null,
  depth: number
): Promise<FoundLesson[]> {
  const lessons: FoundLesson[] = [];
  const entries = (await fs.readdir(courseDir, { withFileTypes: true }))
    .filter((e) => e.isDirectory() && !SKIP_DIR.test(e.name))
    .sort((a, b) => {
      const na = natNum(a.name);
      const nb = natNum(b.name);
      if (na != null && nb != null && na !== nb) return na - nb;
      return a.name.localeCompare(b.name, "ru");
    });

  for (const e of entries) {
    const abs = path.join(courseDir, e.name);
    const assets = await collectAssets(abs);
    const hasPdf = assets.some((a) => a.tier === "basic");

    if (hasPdf) {
      const { n, title } = parseLessonName(e.name);
      let readme: string | null = null;
      try {
        const raw = await fs.readFile(path.join(abs, "README.md"), "utf-8");
        const para = raw
          .split(/\r?\n/)
          .filter((l) => l.trim() && !l.startsWith("#") && !l.startsWith("|") && !l.startsWith("-"))
          .slice(0, 2)
          .join(" ")
          .replace(/\*\*?|`|\[|\]\([^)]*\)/g, "")
          .trim();
        if (para.length > 30) readme = para.slice(0, 280);
      } catch {
        // нет README — не страшно
      }
      lessons.push({ dirAbs: abs, numberHint: n, title, blockTitle, assets, readme });
    } else if (depth < 3) {
      // Возможно это блок (kurs16) или обёртка (kurs2/Векторы, kurs13/N. Тема)
      const { title } = parseLessonName(e.name);
      const inner = await findLessons(abs, depth === 0 && entries.length > 1 ? title : blockTitle ?? title, depth + 1);
      lessons.push(...inner);
    }
  }
  return lessons;
}

function safeName(s: string): string {
  return s.replace(/[^\wа-яА-ЯёЁ.\- ]/g, "").replace(/\s+/g, "_").slice(0, 90);
}

async function copyToStorage(abs: string, slug: string, name: string): Promise<{ rel: string; size: number }> {
  const dir = path.join(STORAGE_ROOT, "products", slug);
  await fs.mkdir(dir, { recursive: true });
  const dest = path.join(dir, name);
  await fs.copyFile(abs, dest);
  const st = await fs.stat(dest);
  return { rel: path.relative(STORAGE_ROOT, dest).split(path.sep).join("/"), size: st.size };
}

/** Рендер страниц PDF в PNG. Возвращает storage-relative пути. */
async function renderPages(
  pdfAbs: string,
  slug: string,
  prefix: string,
  first: number,
  last: number,
  dpi = 110
): Promise<string[]> {
  const dir = path.join(STORAGE_ROOT, "products", slug);
  await fs.mkdir(dir, { recursive: true });
  const outPrefix = path.join(dir, prefix);
  const res = spawnSync(
    PDFTOPPM,
    ["-png", "-f", String(first), "-l", String(last), "-r", String(dpi), pdfAbs, outPrefix],
    { timeout: 30000 }
  );
  if (res.error) return [];
  const produced: string[] = [];
  for (const f of await fs.readdir(dir)) {
    if (f.startsWith(prefix + "-") && f.endsWith(".png")) {
      produced.push(path.relative(STORAGE_ROOT, path.join(dir, f)).split(path.sep).join("/"));
    }
  }
  return produced.sort();
}

async function main() {
  console.log(`Библиотека: ${LIB_DIR}`);
  console.log(`Storage:    ${STORAGE_ROOT}`);

  // Полная замена каталога
  await prisma.product.deleteMany({});
  console.log("× старые товары удалены");

  let totalLessons = 0;

  for (const course of COURSES) {
    const courseAbs = path.join(LIB_DIR, course.dir);
    if (!(await isDir(courseAbs))) {
      console.warn(`⚠ нет папки курса: ${course.dir}`);
      continue;
    }

    const found = await findLessons(courseAbs, null, 0);
    if (found.length === 0) {
      console.warn(`⚠ ${course.dir}: уроков не найдено`);
      continue;
    }

    // Сквозная нумерация в порядке обхода (блоки идут по порядку)
    let counter = 0;
    for (const lesson of found) {
      counter++;
      const lessonNo = counter;
      const slug = `${course.slug}-l${String(lessonNo).padStart(2, "0")}`;
      const isFree = lessonNo === 1;

      const fullTitle = lesson.blockTitle && !lesson.title.includes(lesson.blockTitle)
        ? `${lesson.blockTitle}: ${lesson.title}`
        : lesson.title;

      const hasSource = lesson.assets.some((a) => a.tier === "source");

      const product = await prisma.product.create({
        data: {
          slug,
          title: fullTitle,
          description:
            lesson.readme ??
            `Комплект урока «${fullTitle}» курса «${course.title}»: ${summarize(lesson.assets)}. Профессиональная вёрстка, готово к печати.`,
          subject: course.subject,
          course: course.title,
          courseSlug: course.slug,
          lessonNo,
          audience: "10–11 класс · ЕГЭ",
          kind: "lesson_kit",
          priceBasic: LESSON_PRICE,
          priceSource: hasSource ? LESSON_SRC_PRICE : null,
          isFree,
          isPublished: true,
        },
      });

      // Копируем ассеты
      let sortFix = 0;
      for (const a of lesson.assets) {
        sortFix++;
        const ext = path.extname(a.abs);
        const name = safeName(`${a.kind}_${sortFix}${ext}`);
        const { rel, size } = await copyToStorage(a.abs, slug, name);
        await prisma.productAsset.create({
          data: {
            productId: product.id,
            kind: a.kind,
            tier: a.tier,
            label: a.label,
            path: rel,
            size,
            sortKey: a.sort,
          },
        });
      }

      // Превью: обложка = 1-я страница листа (или презентации)
      const ws = lesson.assets.find((a) => a.kind === "worksheet_pdf");
      const pres = lesson.assets.find((a) => a.kind === "presentation_pdf");
      const cheat = lesson.assets.find((a) => a.kind === "cheatsheet_pdf");

      const coverSrc = ws ?? pres;
      let previewPath: string | null = null;
      const gallery: string[] = [];

      if (coverSrc) {
        const cover = await renderPages(coverSrc.abs, slug, "cover", 1, 1, 120);
        previewPath = cover[0] ?? null;
      }
      if (pres) gallery.push(...(await renderPages(pres.abs, slug, "gal-p", 1, 2)));
      if (ws) gallery.push(...(await renderPages(ws.abs, slug, "gal-w", 1, 1)));
      if (cheat) gallery.push(...(await renderPages(cheat.abs, slug, "gal-c", 1, 1)));

      await prisma.product.update({
        where: { id: product.id },
        data: {
          previewPath,
          previewPagesJson: gallery.length ? JSON.stringify(gallery) : null,
        },
      });

      totalLessons++;
      console.log(
        `✓ ${slug} «${fullTitle}» — ${lesson.assets.length} файлов, галерея ${gallery.length}${isFree ? " · FREE" : ""}${hasSource ? " · +src" : ""}`
      );
    }

    // Бандл курса: мягкая цена ≈ 50 % от поштучной, минимум 199 ₽
    const bundleBasic = Math.max(19900, Math.round((counter * LESSON_PRICE * 0.5) / 10000) * 10000 - 100);
    const bundleSource = bundleBasic * 2 + 10000;
    await prisma.product.create({
      data: {
        slug: `${course.slug}-course`,
        title: `Курс целиком: ${course.title} (${counter} ${lessonWord(counter)})`,
        description: `Все ${counter} ${lessonWord(counter)} курса «${course.title}» одним пакетом со скидкой ~50 % от поштучной цены. Покупка навсегда, новые версии уроков — бесплатно.`,
        subject: course.subject,
        course: course.title,
        courseSlug: course.slug,
        audience: "10–11 класс · ЕГЭ",
        kind: "course_bundle",
        priceBasic: bundleBasic,
        priceSource: bundleSource,
        isFree: false,
        isPublished: true,
      },
    });
    console.log(`✓ ${course.slug}-course (${counter} уроков, ${Math.round(bundleBasic / 100)} ₽)`);
  }

  console.log(`\nГотово: ${totalLessons} уроков + ${COURSES.length} бандлов.`);
}

function summarize(assets: FoundAsset[]): string {
  const labels = new Set(assets.filter((a) => a.tier === "basic").map((a) => a.label.replace(/ — вариант \d/, "")));
  return Array.from(labels).join(", ").toLowerCase() || "материалы";
}

function lessonWord(n: number): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m100 >= 11 && m100 <= 14) return "уроков";
  if (m10 === 1) return "урок";
  if (m10 >= 2 && m10 <= 4) return "урока";
  return "уроков";
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
