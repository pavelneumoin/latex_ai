import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Header } from "../_components/Header";
import { WorksheetList } from "./WorksheetList";

export const dynamic = "force-dynamic";

export default async function MyPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/my");
  }
  const userId = session.user.id;

  const worksheets = await prisma.worksheet.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      topic: true,
      subject: true,
      grade: true,
      variant: true,
      status: true,
      isPublic: true,
      pdfPath: true,
      createdAt: true,
    },
  });

  return (
    <div className="hi" style={{ minHeight: "100vh", background: "var(--surface)" }}>
      <Header />
      <main style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 28px 64px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <div>
            <h1 style={{ marginBottom: 4 }}>Мои рабочие листы</h1>
            <p className="muted" style={{ fontSize: 14 }}>
              Всего: {worksheets.length}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Link href="/upload" className="btn btn-outline">
              ⬆️ Из PDF
            </Link>
            <Link href="/create" className="btn btn-primary btn-lg">
              + Создать новый
            </Link>
          </div>
        </div>

        <WorksheetList initialWorksheets={worksheets} />
      </main>
    </div>
  );
}
