import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Header } from "../_components/Header";
import { SettingsForm } from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/settings");
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    redirect("/login");
  }

  const initial = {
    name: user.name ?? "",
    school: user.school ?? "",
    subjects: user.subjects ? user.subjects.split(",").filter(Boolean) : [],
    grades: user.grades ? user.grades.split(",").filter(Boolean) : [],
    watermark: user.watermark ?? "",
    accentColor: user.accentColor ?? "#1E40AF",
    logoPath: user.logoPath ?? null,
  };

  return (
    <div className="hi" style={{ minHeight: "100vh", background: "var(--surface)" }}>
      <Header />
      <main className="rl-container" style={{ maxWidth: 820, paddingTop: 32, paddingBottom: 64 }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ marginBottom: 4 }}>Настройки</h1>
          <p className="muted" style={{ fontSize: 14 }}>
            Email: <span style={{ color: "var(--fg-2)" }}>{user.email}</span>
          </p>
        </div>

        <SettingsForm initial={initial} />
      </main>
    </div>
  );
}
