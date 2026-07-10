// Загрузка работ учеников (PDF/фото, можно несколько файлов за раз) в проверку.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { saveUploadedFile } from "@/lib/storage";

export const runtime = "nodejs";

const MAX_SIZE = 25 * 1024 * 1024; // 25 MB на файл
const MAX_FILES = 40;

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const job = await prisma.checkJob.findUnique({ where: { id: params.id } });
  if (!job || job.userId !== user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch (e) {
    return NextResponse.json(
      { error: "invalid_multipart", detail: (e as Error).message },
      { status: 400 }
    );
  }

  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  const single = form.get("file");
  if (single instanceof File) files.push(single);

  if (files.length === 0) {
    return NextResponse.json({ error: "files_required" }, { status: 400 });
  }
  if (files.length > MAX_FILES) {
    return NextResponse.json({ error: "too_many_files", max: MAX_FILES }, { status: 400 });
  }

  const saved: { id: string; filename: string; size: number }[] = [];
  for (const file of files) {
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "file_too_large", filename: file.name, maxSize: MAX_SIZE },
        { status: 413 }
      );
    }
    if (file.type && !ALLOWED_MIME.has(file.type)) {
      return NextResponse.json(
        { error: "unsupported_type", filename: file.name, mimeType: file.type },
        { status: 415 }
      );
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const s = await saveUploadedFile(buf, file.name || "work.bin", user.id, "check_photo");
    const record = await prisma.upload.create({
      data: {
        userId: user.id,
        checkJobId: job.id,
        filename: file.name || "work.bin",
        mimeType: file.type || "application/octet-stream",
        size: s.size,
        path: s.path,
        purpose: "check_photo",
      },
    });
    saved.push({ id: record.id, filename: record.filename, size: record.size });
  }

  // Работа загружена — двигаем статус
  if (job.status === "draft") {
    await prisma.checkJob.update({
      where: { id: job.id },
      data: { status: "uploaded" },
    });
  }

  return NextResponse.json({ ok: true, uploads: saved });
}
