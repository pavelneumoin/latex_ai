import { getServerSession } from "next-auth/next";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ClassDetailClient } from "./ClassDetailClient";

export const dynamic = "force-dynamic";

export default async function ClassDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  const userId = session!.user!.id;

  const cls = await prisma.class.findUnique({
    where: { id: params.id },
    include: {
      students: { orderBy: [{ sortKey: "asc" }, { name: "asc" }] },
      checkJobs: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { _count: { select: { results: true } } },
      },
    },
  });
  if (!cls || cls.userId !== userId) notFound();

  // Средние по последним завершённым проверкам класса — для мини-сводки.
  const doneJobs = await prisma.checkJob.findMany({
    where: { classId: cls.id, status: "done" },
    include: { results: true },
    orderBy: { createdAt: "desc" },
    take: 8,
  });
  const trend = doneJobs
    .map((j) => {
      const present = j.results.filter((r) => !r.absent);
      const avg =
        present.length > 0
          ? present.reduce((s, r) => s + r.pct, 0) / present.length
          : 0;
      return { title: j.title, avgPct: Math.round(avg * 10) / 10, date: j.createdAt };
    })
    .reverse();

  return (
    <ClassDetailClient
      cls={{
        id: cls.id,
        name: cls.name,
        subject: cls.subject,
        gradeLevel: cls.gradeLevel,
        scale5: cls.scale5,
        scale4: cls.scale4,
        scale3: cls.scale3,
      }}
      students={cls.students.map((s) => ({ id: s.id, name: s.name }))}
      checks={cls.checkJobs.map((j) => ({
        id: j.id,
        title: j.title,
        status: j.status,
        results: j._count.results,
        createdAt: j.createdAt.toISOString(),
      }))}
      trend={trend}
    />
  );
}
