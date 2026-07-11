// Seed: тарифы + шаблоны (из cli/templates/registry.json).
// Запускать: npx tsx prisma/seed.ts  (или npm run db:seed после настройки)

import { PrismaClient } from "@prisma/client";
import { promises as fs } from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

interface RegistryTemplate {
  id: string;
  name: string;
  description?: string;
  subject: string;
  grade?: number;
  layout: string;
  style: string;
  task_count: number;
  tags: string[];
}

async function seedPlans() {
  // v2: подписки по предметам. Мягкая ценовая политика на старте.
  const plans = [
    {
      id: "free",
      name: "Бесплатный",
      description: "Бесплатные материалы, кабинет, классы и 10 автопроверок в месяц.",
      subject: "all",
      tier: "basic",
      priceMonthly: 0,
      priceYearly: 0,
      worksheetsLimit: 5,
      variantsLimit: 2,
      checksLimit: 10,
      marketplaceCommissionPct: 30,
    },
    {
      id: "math",
      name: "Математика",
      description: "Все PDF-материалы по математике, 300 автопроверок в месяц, отчёты.",
      subject: "math",
      tier: "basic",
      priceMonthly: 29000, // ₽290
      priceYearly: 261000, // ₽2 610 (−25 %)
      worksheetsLimit: 30,
      variantsLimit: 30,
      checksLimit: 300,
      marketplaceCommissionPct: 20,
    },
    {
      id: "informatics",
      name: "Информатика",
      description: "Все PDF-материалы по информатике, 300 автопроверок в месяц, отчёты.",
      subject: "informatics",
      tier: "basic",
      priceMonthly: 29000, // ₽290
      priceYearly: 261000,
      worksheetsLimit: 30,
      variantsLimit: 30,
      checksLimit: 300,
      marketplaceCommissionPct: 20,
    },
    {
      id: "all",
      name: "Всё включено",
      description:
        "Оба предмета + исходники Marp/LaTeX всех материалов + безлимит проверок.",
      subject: "all",
      tier: "source",
      priceMonthly: 49000, // ₽490
      priceYearly: 441000, // ₽4 410 (−25 %)
      worksheetsLimit: -1,
      variantsLimit: -1,
      checksLimit: -1,
      marketplaceCommissionPct: 15,
    },
  ];

  for (const p of plans) {
    await prisma.plan.upsert({
      where: { id: p.id },
      update: p,
      create: p,
    });
  }
  // Старые планы прячем, если остались в dev-базе.
  await prisma.plan.updateMany({
    where: { id: { in: ["pro", "school"] } },
    data: { isActive: false },
  });
  console.log(`✓ seeded ${plans.length} plans (v2, по предметам)`);
}

// Курация v3: вместо 45 однотипных шаблонов-«тем» — 9 понятных СТИЛЕЙ вёрстки.
// Остальные скрыты (isActive=false), данные не удаляются.
const CURATED_TEMPLATES: Record<string, { name: string; description: string }> = {
  T1: {
    name: "Классический лист",
    description: "Одна колонка, фиолетовый акцент, поля для ответов. Универсальный выбор.",
  },
  T10: {
    name: "Контрольная — 2 варианта",
    description: "Автоматическая разбивка на варианты I и II, строгий графит.",
  },
  T37: {
    name: "Тетрадь в клетку",
    description: "Клетчатая подложка как в тетради, место для решения под каждой задачей.",
  },
  T36: {
    name: "Бланк экзамена",
    description: "Строгий бланк в духе ЕГЭ/ОГЭ: рамки, поля для кода и ответов.",
  },
  T21: {
    name: "Самостоятельная на 15 минут",
    description: "Компактный лист на пол-урока, два варианта на одной странице.",
  },
  T14: {
    name: "ОГЭ, ч/б печать",
    description: "Экономичный чёрно-белый формат для школьного принтера.",
  },
  T39: {
    name: "Карточки для разрезания",
    description: "Сетка карточек 2×4 — раздаточный материал и работа в парах.",
  },
  T16: {
    name: "Минимализм",
    description: "Много воздуха, тонкая типографика — для эстетов.",
  },
  T23: {
    name: "Программирование",
    description: "Моноширинный код-стиль для информатики: Python, алгоритмы, СС.",
  },
};

async function seedTemplates() {
  const registryPath = path.join(process.cwd(), "..", "cli", "templates", "registry.json");
  const raw = await fs.readFile(registryPath, "utf-8");
  const reg = JSON.parse(raw) as { templates: RegistryTemplate[] };

  for (const t of reg.templates) {
    const curated = CURATED_TEMPLATES[t.id];
    await prisma.template.upsert({
      where: { id: t.id },
      update: {
        name: curated?.name ?? t.name,
        description: curated?.description ?? t.description ?? null,
        subject: curated ? "mixed" : t.subject,
        grade: t.grade ?? null,
        layout: t.layout,
        style: t.style,
        taskCount: t.task_count,
        tags: t.tags.join(","),
        isActive: !!curated,
      },
      create: {
        id: t.id,
        name: curated?.name ?? t.name,
        description: curated?.description ?? t.description ?? null,
        subject: curated ? "mixed" : t.subject,
        grade: t.grade ?? null,
        layout: t.layout,
        style: t.style,
        taskCount: t.task_count,
        tags: t.tags.join(","),
        isActive: !!curated,
      },
    });
  }
  console.log(
    `✓ seeded ${reg.templates.length} templates (активных: ${Object.keys(CURATED_TEMPLATES).length} кураторских)`
  );
}

async function main() {
  await seedPlans();
  await seedTemplates();
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
