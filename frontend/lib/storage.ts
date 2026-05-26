// Утилиты для работы с файловым хранилищем.
// В dev — локальная папка ./storage. В проде — переключаемся на S3 / Yandex Object Storage,
// тогда здесь будет адаптер.

import path from "node:path";
import { promises as fs } from "node:fs";
import { randomUUID } from "node:crypto";
import mime from "mime-types";

export function getStorageRoot(): string {
  return process.env.STORAGE_DIR || path.join(process.cwd(), "storage");
}

/**
 * Сохранить загруженный файл в storage/uploads/<userId>/<uuid>.<ext>.
 * Возвращает относительный путь (от storage root) и реальный размер.
 */
export async function saveUploadedFile(
  buf: Buffer,
  filename: string,
  userId: string,
  purpose: string
): Promise<{ path: string; size: number; absPath: string }> {
  const root = getStorageRoot();

  // Каталог по purpose: uploads | worksheets | logos
  const subdir = purpose === "logo" ? "logos" : "uploads";

  const ext = sanitizeExt(filename);
  const safeUser = sanitizeSegment(userId || "anon");
  const dir = path.join(root, subdir, safeUser);
  await fs.mkdir(dir, { recursive: true });

  const id = randomUUID();
  const fileName = `${id}${ext}`;
  const absPath = path.join(dir, fileName);

  await fs.writeFile(absPath, buf);
  const stat = await fs.stat(absPath);

  // Относительный путь (POSIX-стиль) — кладём в БД
  const relPath = path
    .relative(root, absPath)
    .split(path.sep)
    .join("/");

  return { path: relPath, size: stat.size, absPath };
}

/**
 * Прочитать файл по относительному пути из БД.
 */
export async function readUploadedFile(relPath: string): Promise<Buffer> {
  const abs = resolveStoragePath(relPath);
  return fs.readFile(abs);
}

/**
 * Преобразовать относительный путь в абсолютный, защититься от path traversal.
 */
export function resolveStoragePath(relPath: string): string {
  const root = getStorageRoot();
  const safe = relPath.replace(/^[\/\\]+/, "").split(/[\/\\]/).join(path.sep);
  const abs = path.resolve(root, safe);
  const rootAbs = path.resolve(root);
  if (!abs.startsWith(rootAbs)) {
    throw new Error("storage_path_escape");
  }
  return abs;
}

/**
 * Узнать mime по имени файла (fallback к octet-stream).
 */
export function guessMime(filename: string): string {
  return mime.lookup(filename) || "application/octet-stream";
}

function sanitizeExt(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  if (!ext) return "";
  // только буквы/цифры
  if (!/^\.[a-z0-9]{1,8}$/.test(ext)) return "";
  return ext;
}

function sanitizeSegment(s: string): string {
  return s.replace(/[^a-zA-Z0-9_\-]/g, "_").slice(0, 80);
}
