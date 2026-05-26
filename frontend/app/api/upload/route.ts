import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { saveUploadedFile } from "@/lib/storage";

export const runtime = "nodejs";

const MAX_SIZE = 20 * 1024 * 1024; // 20 MB

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const purposeSchema = z.enum(["material", "photo", "logo", "check_photo"]);

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
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

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file_required" }, { status: 400 });
  }

  const purposeRaw = form.get("purpose");
  const purposeParsed = purposeSchema.safeParse(
    typeof purposeRaw === "string" ? purposeRaw : "material"
  );
  if (!purposeParsed.success) {
    return NextResponse.json(
      { error: "validation_error", issues: purposeParsed.error.issues },
      { status: 400 }
    );
  }
  const purpose = purposeParsed.data;

  const worksheetIdRaw = form.get("worksheetId");
  const worksheetId =
    typeof worksheetIdRaw === "string" && worksheetIdRaw.length > 0
      ? worksheetIdRaw
      : null;

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "file_too_large", maxSize: MAX_SIZE },
      { status: 413 }
    );
  }

  if (file.type && !ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { error: "unsupported_type", mimeType: file.type },
      { status: 415 }
    );
  }

  // Если привязка к worksheet — проверим владельца
  if (worksheetId) {
    const ws = await prisma.worksheet.findUnique({
      where: { id: worksheetId },
      select: { userId: true },
    });
    if (!ws || ws.userId !== user.id) {
      return NextResponse.json(
        { error: "worksheet_not_found_or_forbidden" },
        { status: 404 }
      );
    }
  }

  const arrayBuffer = await file.arrayBuffer();
  const buf = Buffer.from(arrayBuffer);

  let saved;
  try {
    saved = await saveUploadedFile(buf, file.name || "upload.bin", user.id, purpose);
  } catch (e) {
    console.error("[upload] save error", e);
    return NextResponse.json(
      { error: "save_failed", detail: (e as Error).message },
      { status: 500 }
    );
  }

  const record = await prisma.upload.create({
    data: {
      userId: user.id,
      worksheetId,
      filename: file.name || "upload.bin",
      mimeType: file.type || "application/octet-stream",
      size: saved.size,
      path: saved.path,
      purpose,
    },
  });

  // Если это logo — обновим профиль пользователя.
  if (purpose === "logo") {
    await prisma.user.update({
      where: { id: user.id },
      data: { logoPath: saved.path },
    });
  }

  return NextResponse.json({
    upload: {
      id: record.id,
      filename: record.filename,
      mimeType: record.mimeType,
      size: record.size,
      path: record.path,
      purpose: record.purpose,
      worksheetId: record.worksheetId,
      createdAt: record.createdAt,
    },
  });
}
