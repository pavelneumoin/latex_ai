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

async function seedTemplates() {
  const registryPath = path.join(process.cwd(), "..", "cli", "templates", "registry.json");
  const raw = await fs.readFile(registryPath, "utf-8");
  const reg = JSON.parse(raw) as { templates: RegistryTemplate[] };

  for (const t of reg.templates) {
    await prisma.template.upsert({
      where: { id: t.id },
      update: {
        name: t.name,
        description: t.description ?? null,
        subject: t.subject,
        grade: t.grade ?? null,
        layout: t.layout,
        style: t.style,
        taskCount: t.task_count,
        tags: t.tags.join(","),
        isActive: true,
      },
      create: {
        id: t.id,
        name: t.name,
        description: t.description ?? null,
        subject: t.subject,
        grade: t.grade ?? null,
        layout: t.layout,
        style: t.style,
        taskCount: t.task_count,
        tags: t.tags.join(","),
      },
    });
  }
  console.log(`✓ seeded ${reg.templates.length} templates`);
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
