"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

type UpdateProfileInput = {
  name: string;
  school: string;
  subjects: string[];
  grades: string[];
  watermark: string;
  accentColor: string;
};

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function updateProfile(input: UpdateProfileInput): Promise<ActionResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { ok: false, error: "Не авторизованы" };
  }
  const userId = session.user.id;

  const validSubjects = input.subjects.filter((s) => s === "math" || s === "informatics" || s === "mixed");
  const validGrades = input.grades
    .filter((g) => /^([5-9]|1[01])$/.test(g))
    .map((g) => g.trim());

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        name: input.name.trim() || null,
        school: input.school.trim() || null,
        subjects: validSubjects.length ? validSubjects.join(",") : null,
        grades: validGrades.length ? validGrades.join(",") : null,
        watermark: input.watermark.trim() || null,
        accentColor: /^#[0-9a-fA-F]{6}$/.test(input.accentColor) ? input.accentColor : null,
      },
    });
  } catch {
    return { ok: false, error: "Не удалось сохранить профиль" };
  }

  revalidatePath("/settings");
  return { ok: true };
}
