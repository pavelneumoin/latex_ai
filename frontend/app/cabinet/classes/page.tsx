// Кабинет · Классы: список + быстрый ввод учеников «из журнала».

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ClassesClient } from "./ClassesClient";

export const dynamic = "force-dynamic";

export default async function ClassesPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user!.id;

  const classes = await prisma.class.findMany({
    where: { userId, archived: false },
    include: { _count: { select: { students: true, checkJobs: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <ClassesClient
      initial={classes.map((c) => ({
        id: c.id,
        name: c.name,
        subject: c.subject,
        gradeLevel: c.gradeLevel,
        students: c._count.students,
        checks: c._count.checkJobs,
      }))}
    />
  );
}
