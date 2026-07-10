import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Header } from "../_components/Header";
import { CabinetSidebar, CabinetBottomNav } from "./_components/CabinetNav";

export const dynamic = "force-dynamic";

export default async function CabinetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/cabinet");
  }

  return (
    <div className="hi" style={{ minHeight: "100vh", background: "var(--surface)" }}>
      <Header />
      <div className="rl2-cab">
        <CabinetSidebar />
        <main className="rl2-cab-main">{children}</main>
      </div>
      <CabinetBottomNav />
    </div>
  );
}
