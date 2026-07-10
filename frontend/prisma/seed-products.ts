// Сид каталога реальными материалами фабрики (marp-system/examples).
// Копирует PDF + Marp-исходники + превью в storage/products/<slug>/ и создаёт Product/ProductAsset.
//
// Запуск: npx tsx prisma/seed-products.ts
// Источник переопределяется: PRODUCTS_SOURCE_DIR=<путь к marp-system/examples>

import { PrismaClient } from "@prisma/client";
import { promises as fs } from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

const SOURCE_DIR =
  process.env.PRODUCTS_SOURCE_DIR ||
  "E:/YA/YandexDisk/Latex/.agent/marp-system/examples";

const STORAGE_ROOT = process.env.STORAGE_DIR || path.join(process.cwd(), "storage");

// Стандартный комплект фабрики: файл → (вид, уровень, подпись)
const KIT_FILES: {
  file: string;
  kind: string;
  tier: "basic" | "source";
  label: string;
  sortKey: number;
}[] = [
  { file: "slides.pdf", kind: "presentation_pdf", tier: "basic", label: "Презентация", sortKey: 1 },
  { file: "worksheet.pdf", kind: "worksheet_pdf", tier: "basic", label: "Рабочий лист", sortKey: 2 },
  { file: "cheatsheet.pdf", kind: "cheatsheet_pdf", tier: "basic", label: "Шпаргалка", sortKey: 3 },
  { file: "homework.pdf", kind: "homework_pdf", tier: "basic", label: "Домашняя работа", sortKey: 4 },
  { file: "test1.pdf", kind: "test_pdf", tier: "basic", label: "Зачёт — вариант 1", sortKey: 5 },
  { file: "test2.pdf", kind: "test_pdf", tier: "basic", label: "Зачёт — вариант 2", sortKey: 6 },
  { file: "slides.md", kind: "marp_src", tier: "source", label: "Исходник презентации (Marp)", sortKey: 11 },
  { file: "worksheet.md", kind: "marp_src", tier: "source", label: "Исходник листа (Marp)", sortKey: 12 },
  { file: "cheatsheet.md", kind: "marp_src", tier: "source", label: "Исходник шпаргалки (Marp)", sortKey: 13 },
  { file: "homework.md", kind: "marp_src", tier: "source", label: "Исходник ДЗ (Marp)", sortKey: 14 },
  { file: "test1.md", kind: "marp_src", tier: "source", label: "Исходник зачёта 1 (Marp)", sortKey: 15 },
  { file: "test2.md", kind: "marp_src", tier: "source", label: "Исходник зачёта 2 (Marp)", sortKey: 16 },
];

interface LessonSeed {
  slug: string; // = имя папки фабрики
  title: string;
  description: string;
  subject: "math" | "informatics";
  course: string;
  courseSlug: string;
  lessonNo: number;
  audience: string;
  isFree?: boolean;
  kind?: string; // default lesson_kit
  priceBasic?: number; // копейки
  priceSource?: number | null;
}

const LESSON_KIT_PRICE = 4900; // 49 ₽
const LESSON_SRC_PRICE = 12900; // 129 ₽

const LESSONS: LessonSeed[] = [
  // ── Курс «Вероятность. Задания 4–5 ЕГЭ» (8 уроков, готов целиком) ──
  {
    slug: "prob45-l1-classic",
    title: "Классическое определение вероятности",
    description:
      "Первый урок курса: благоприятные и все исходы, P = m/n, разбор типовых задач ЕГЭ. Полный комплект: презентация, рабочий лист с клеткой, шпаргалка, ДЗ и два варианта зачёта с ключами.",
    subject: "math",
    course: "Вероятность. Задания 4–5 ЕГЭ",
    courseSlug: "prob45",
    lessonNo: 1,
    audience: "10–11 класс · ЕГЭ",
    isFree: true,
  },
  {
    slug: "prob45-l2-coins",
    title: "Перебор исходов: монеты",
    description:
      "Орёл и решка без паники: дерево исходов, таблицы, симметрия. Задачи из банка ЕГЭ, проверенные на sympy.",
    subject: "math",
    course: "Вероятность. Задания 4–5 ЕГЭ",
    courseSlug: "prob45",
    lessonNo: 2,
    audience: "10–11 класс · ЕГЭ",
  },
  {
    slug: "prob45-l3-dice",
    title: "Перебор исходов: игральные кости",
    description:
      "Таблица 6×6 как главный инструмент: суммы, произведения, «хотя бы один». Полный комплект урока.",
    subject: "math",
    course: "Вероятность. Задания 4–5 ЕГЭ",
    courseSlug: "prob45",
    lessonNo: 3,
    audience: "10–11 класс · ЕГЭ",
  },
  {
    slug: "prob45-l4-complement",
    title: "Противоположное событие",
    description:
      "P(A) = 1 − P(не A): когда «хотя бы один» проще считать с обратной стороны. Полный комплект урока.",
    subject: "math",
    course: "Вероятность. Задания 4–5 ЕГЭ",
    courseSlug: "prob45",
    lessonNo: 4,
    audience: "10–11 класс · ЕГЭ",
  },
  {
    slug: "prob45-l5-addition",
    title: "Сложение вероятностей",
    description:
      "Несовместные и совместные события, формула сложения, диаграммы. Полный комплект урока.",
    subject: "math",
    course: "Вероятность. Задания 4–5 ЕГЭ",
    courseSlug: "prob45",
    lessonNo: 5,
    audience: "10–11 класс · ЕГЭ",
  },
  {
    slug: "prob45-l6-multiplication",
    title: "Умножение вероятностей. Независимые события",
    description:
      "Цепочки событий, независимость, условная вероятность на деревьях. Полный комплект урока.",
    subject: "math",
    course: "Вероятность. Задания 4–5 ЕГЭ",
    courseSlug: "prob45",
    lessonNo: 6,
    audience: "10–11 класс · ЕГЭ",
  },
  {
    slug: "prob45-l7-total",
    title: "Формула полной вероятности",
    description:
      "Полная вероятность и Байес на деревьях: лампочки с двух заводов, стрелки и билеты. Полный комплект урока.",
    subject: "math",
    course: "Вероятность. Задания 4–5 ЕГЭ",
    courseSlug: "prob45",
    lessonNo: 7,
    audience: "10–11 класс · ЕГЭ",
  },
  {
    slug: "prob45-l8-final",
    title: "Смешанные задачи. Итоговый зачёт по курсу",
    description:
      "Все типы заданий 4–5 вперемешку + итоговый зачёт по курсу в двух вариантах.",
    subject: "math",
    course: "Вероятность. Задания 4–5 ЕГЭ",
    courseSlug: "prob45",
    lessonNo: 8,
    audience: "10–11 класс · ЕГЭ",
  },

  // ── Курс «Задание 7 ЕГЭ. Значения выражений» ──
  {
    slug: "kurs7-l1-stepeni",
    title: "Свойства степеней",
    description:
      "Первый урок курса «Задание 7 ЕГЭ»: все свойства степеней в работе — 59 задач, проверенных sympy. Презентация на 54 слайда, лист, шпаргалка, ДЗ и два зачёта.",
    subject: "math",
    course: "Задание 7 ЕГЭ. Значения выражений",
    courseSlug: "kurs7",
    lessonNo: 1,
    audience: "10–11 класс · ЕГЭ",
    isFree: true,
  },

  // ── Курс «Задание 2 ЕГЭ. Векторы» ──
  {
    slug: "kurs2-l1-teoriya",
    title: "Векторы: теория одним уроком",
    description:
      "Координаты, длина, действия с векторами, коллинеарность и скалярное произведение — вся теория задания 2 с картинками из GeoGebra.",
    subject: "math",
    course: "Задание 2 ЕГЭ. Векторы",
    courseSlug: "kurs2",
    lessonNo: 1,
    audience: "10–11 класс · ЕГЭ",
    isFree: true,
  },

  // ── Отдельный элемент: презентация по вкладам (16 задание) ──
  {
    slug: "kurs16-l1-vklady",
    title: "Вклады и проценты: раскрутка (презентация)",
    description:
      "Презентация первого урока курса «Задание 16 ЕГЭ. Финансовая математика»: вклады, капитализация, раскрутка процентов по шагам.",
    subject: "math",
    course: "Задание 16 ЕГЭ. Финансовая математика",
    courseSlug: "kurs16",
    lessonNo: 1,
    audience: "10–11 класс · ЕГЭ",
    kind: "presentation",
    priceBasic: 1900, // 19 ₽ — отдельный элемент
    priceSource: 4900,
  },
];

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function copyIntoStorage(absSrc: string, slug: string, filename: string): Promise<{ rel: string; size: number }> {
  const destDir = path.join(STORAGE_ROOT, "products", slug);
  await fs.mkdir(destDir, { recursive: true });
  const destAbs = path.join(destDir, filename);
  await fs.copyFile(absSrc, destAbs);
  const stat = await fs.stat(destAbs);
  const rel = path.relative(STORAGE_ROOT, destAbs).split(path.sep).join("/");
  return { rel, size: stat.size };
}

async function seedLesson(seed: LessonSeed): Promise<boolean> {
  const srcDir = path.join(SOURCE_DIR, seed.slug);
  if (!(await exists(srcDir))) {
    console.warn(`⚠ пропуск ${seed.slug}: нет папки ${srcDir}`);
    return false;
  }

  // Превью: первая страница слайдов или листа
  let previewRel: string | null = null;
  for (const cand of ["slides.001.png", "worksheet.001.png", "cheatsheet.001.png"]) {
    const abs = path.join(srcDir, cand);
    if (await exists(abs)) {
      previewRel = (await copyIntoStorage(abs, seed.slug, `preview${path.extname(cand)}`)).rel;
      break;
    }
  }

  const product = await prisma.product.upsert({
    where: { slug: seed.slug },
    update: {
      title: seed.title,
      description: seed.description,
      subject: seed.subject,
      course: seed.course,
      courseSlug: seed.courseSlug,
      lessonNo: seed.lessonNo,
      audience: seed.audience,
      kind: seed.kind ?? "lesson_kit",
      priceBasic: seed.priceBasic ?? LESSON_KIT_PRICE,
      priceSource: seed.priceSource === null ? null : (seed.priceSource ?? LESSON_SRC_PRICE),
      isFree: seed.isFree ?? false,
      isPublished: true,
      previewPath: previewRel,
    },
    create: {
      slug: seed.slug,
      title: seed.title,
      description: seed.description,
      subject: seed.subject,
      course: seed.course,
      courseSlug: seed.courseSlug,
      lessonNo: seed.lessonNo,
      audience: seed.audience,
      kind: seed.kind ?? "lesson_kit",
      priceBasic: seed.priceBasic ?? LESSON_KIT_PRICE,
      priceSource: seed.priceSource === null ? null : (seed.priceSource ?? LESSON_SRC_PRICE),
      isFree: seed.isFree ?? false,
      isPublished: true,
      previewPath: previewRel,
    },
  });

  // Ассеты пересобираем заново (идемпотентно)
  await prisma.productAsset.deleteMany({ where: { productId: product.id } });
  let count = 0;
  for (const kf of KIT_FILES) {
    const abs = path.join(srcDir, kf.file);
    if (!(await exists(abs))) continue;
    const { rel, size } = await copyIntoStorage(abs, seed.slug, kf.file);
    await prisma.productAsset.create({
      data: {
        productId: product.id,
        kind: kf.kind,
        tier: kf.tier,
        label: kf.label,
        path: rel,
        size,
        sortKey: kf.sortKey,
      },
    });
    count++;
  }
  console.log(`✓ ${seed.slug}: ${count} файлов${previewRel ? " + превью" : ""}${seed.isFree ? " · FREE" : ""}`);
  return count > 0;
}

async function seedBundle() {
  // Курс «Вероятность» целиком — со скидкой ~50 % от суммы уроков.
  await prisma.product.upsert({
    where: { slug: "prob45-course" },
    update: {},
    create: {
      slug: "prob45-course",
      title: "Курс целиком: Вероятность. Задания 4–5 (8 уроков)",
      description:
        "Все 8 уроков курса одним пакетом: 48 PDF (презентации, листы, шпаргалки, ДЗ, зачёты) со скидкой ~50 % от поштучной цены. Уровень «исходники» добавляет Marp-файлы всех материалов.",
      subject: "math",
      course: "Вероятность. Задания 4–5 ЕГЭ",
      courseSlug: "prob45",
      lessonNo: null,
      audience: "10–11 класс · ЕГЭ",
      kind: "course_bundle",
      priceBasic: 19900, // 199 ₽
      priceSource: 49900, // 499 ₽
      isFree: false,
      isPublished: true,
    },
  });
  console.log("✓ prob45-course (бандл курса)");
}

async function main() {
  console.log(`Источник: ${SOURCE_DIR}`);
  console.log(`Storage:  ${STORAGE_ROOT}`);
  let ok = 0;
  for (const seed of LESSONS) {
    if (await seedLesson(seed)) ok++;
  }
  await seedBundle();
  console.log(`Готово: ${ok}/${LESSONS.length} уроков + 1 бандл.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
