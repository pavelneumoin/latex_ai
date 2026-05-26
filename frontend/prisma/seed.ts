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
  const plans = [
    {
      id: "free",
      name: "Free",
      description: "Бесплатно. 5 листов и 5 проверок в месяц.",
      priceMonthly: 0,
      worksheetsLimit: 5,
      variantsLimit: 2,
      checksLimit: 5,
      marketplaceCommissionPct: 30,
    },
    {
      id: "pro",
      name: "Учитель PRO",
      description: "Безлимит на листы, варианты и проверки. Приоритетная поддержка.",
      priceMonthly: 49000, // ₽490
      worksheetsLimit: -1,
      variantsLimit: -1,
      checksLimit: -1,
      marketplaceCommissionPct: 20,
    },
    {
      id: "school",
      name: "Школа",
      description: "До 30 учителей в одной школе, общая база материалов, отчётность.",
      priceMonthly: 990000, // ₽9 900
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
  console.log(`✓ seeded ${plans.length} plans`);
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
