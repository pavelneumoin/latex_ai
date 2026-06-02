import Link from "next/link";
import { prisma } from "@/lib/db";
import { Header } from "../_components/Header";
import { TemplateGallery } from "./TemplateGallery";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const rows = await prisma.template.findMany({
    where: { isActive: true },
    orderBy: { id: "asc" },
  });

  const templates = rows.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description ?? "",
    subject: t.subject,
    grade: t.grade ?? null,
    layout: t.layout,
    style: t.style,
    taskCount: t.taskCount,
    tags: t.tags.split(",").map((s) => s.trim()).filter(Boolean),
  }));

  return (
    <div className="hi" style={{ minHeight: "100vh", background: "var(--surface)" }}>
      <Header />
      <main className="rl-container" style={{ maxWidth: 1280, paddingTop: 32, paddingBottom: 64 }}>
        <Link
          href="/dashboard"
          style={{ color: "var(--fg-3)", fontSize: 13, textDecoration: "none" }}
        >
          ← В кабинет
        </Link>
        <h1 style={{ marginTop: 12, marginBottom: 6 }}>Шаблоны рабочих листов</h1>
        <p className="muted-2" style={{ marginBottom: 24, fontSize: 14 }}>
          {templates.length} разных оформлений: классические рамки, минимализм, газета, журнал,
          карточки, контрольные, ОГЭ-стиль, тренажёры, олимпиадные, тёмные темы, для младшей школы и
          для информатики. Выберите подходящий — система применит его при генерации.
        </p>
        <TemplateGallery templates={templates} />
      </main>
    </div>
  );
}
