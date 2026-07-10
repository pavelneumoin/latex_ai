import { getServerSession } from "next-auth/next";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CheckDetailClient } from "./CheckDetailClient";

export const dynamic = "force-dynamic";

export default async function CheckDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  const userId = session!.user!.id;

  const job = await prisma.checkJob.findUnique({
    where: { id: params.id },
    include: {
      class: true,
      product: { select: { id: true, title: true, checkable: true } },
      results: { orderBy: { createdAt: "asc" } },
      uploads: {
        orderBy: { createdAt: "asc" },
        select: { id: true, filename: true, size: true },
      },
      reports: { orderBy: { createdAt: "desc" }, take: 3 },
    },
  });
  if (!job || job.userId !== userId) notFound();

  return (
    <CheckDetailClient
      job={{
        id: job.id,
        title: job.title,
        status: job.status,
        totalTasks: job.totalTasks,
        maxScore: job.maxScore,
        className: job.class?.name ?? null,
        productTitle: job.product?.title ?? null,
        productCheckable: job.product?.checkable ?? false,
      }}
      scale={
        job.class
          ? { s5: job.class.scale5, s4: job.class.scale4, s3: job.class.scale3 }
          : { s5: 85, s4: 65, s3: 40 }
      }
      initialResults={job.results.map((r) => ({
        id: r.id,
        studentName: r.studentName,
        score: r.score,
        maxScore: r.maxScore || job.maxScore || 0,
        pct: r.pct,
        mark: r.mark,
        absent: r.absent,
        needsReview: r.needsReview,
      }))}
      uploads={job.uploads}
      reports={job.reports.map((r) => ({
        id: r.id,
        title: r.title,
        hasPdf: !!r.pdfPath,
        createdAt: r.createdAt.toISOString(),
      }))}
    />
  );
}
