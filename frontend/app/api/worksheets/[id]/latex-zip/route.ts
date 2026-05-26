// Возвращает zip-архив с .tex и README — для скачивания на локальный TeX-дистрибутив.
//
// Содержимое архива:
//   - <slug>.tex   — самодостаточный исходник (тот же, что для Overleaf).
//   - README.txt   — короткая инструкция «как скомпилировать».

import { NextRequest, NextResponse } from "next/server";
import zlib from "node:zlib";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { renderLatexStandalone } from "@/lib/exporters/render-latex";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const ws = await prisma.worksheet.findUnique({
    where: { id: params.id },
    include: { template: true, user: true },
  });
  if (!ws) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (!ws.isPublic) {
    const session = await getServerSession(authOptions);
    const uid = (session?.user as { id?: string } | undefined)?.id;
    if (!uid || uid !== ws.userId) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  }

  let parsed: { title?: string; subtitle?: string; tasks?: unknown[] } = {};
  try { parsed = ws.contentJson ? JSON.parse(ws.contentJson) : {}; } catch { /* */ }
  if (!parsed?.tasks?.length) {
    return NextResponse.json({ error: "no_content" }, { status: 422 });
  }

  const rendered = await renderLatexStandalone(
    {
      title: parsed.title || ws.title || "Рабочий лист",
      subtitle: parsed.subtitle as string | undefined,
      subject: ws.subject ?? undefined,
      grade: ws.grade ?? undefined,
      topic: ws.topic ?? undefined,
      templateId: ws.templateId,
      tasks: parsed.tasks as Array<{ n: number; condition: string }>,
    },
    ws.template?.style || "classic_wildcat_purple",
    ws.user ? { teacherName: ws.user.name ?? undefined, school: ws.user.school ?? undefined } : undefined
  );

  const slug = (ws.title || "worksheet")
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/[а-яё]/g, "")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50) || "worksheet";

  const readme = `Рабочий лист "${ws.title || "worksheet"}"
Шаблон: ${ws.templateId} (${ws.template?.style || ""})
Сгенерировано: РабочийЛист.ai (https://rabochiilist.ai)

Как скомпилировать:
  xelatex ${slug}.tex
  xelatex ${slug}.tex   # повторно, для zref-savepos

Или откройте файл на overleaf.com → New Project → Upload Project → выберите этот zip.

Самодостаточный исходник — не требует Wildcat/Lessons-преамбулы.
Используются только пакеты из CTAN: babel, fontenc, inputenc, geometry, xcolor,
tikz, tcolorbox, amsmath, amssymb, enumitem, fancyhdr.
`;

  const zip = makeZip([
    { name: `${slug}.tex`, data: Buffer.from(rendered.texSource, "utf-8") },
    { name: "README.txt", data: Buffer.from(readme, "utf-8") },
  ]);

  return new NextResponse(new Uint8Array(zip), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${slug}-latex.zip"`,
      "Cache-Control": "private, no-store",
    },
  });
}

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = c ^ buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeZip(files: { name: string; data: Buffer }[]): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;
  for (const f of files) {
    const nameBuf = Buffer.from(f.name, "utf-8");
    const compressed = zlib.deflateRawSync(f.data);
    const crc = crc32(f.data);
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0x0800, 6);
    lh.writeUInt16LE(8, 8); lh.writeUInt16LE(0, 10); lh.writeUInt16LE(0, 12);
    lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(compressed.length, 18);
    lh.writeUInt32LE(f.data.length, 22); lh.writeUInt16LE(nameBuf.length, 26); lh.writeUInt16LE(0, 28);
    localParts.push(lh, nameBuf, compressed);

    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6);
    ch.writeUInt16LE(0x0800, 8); ch.writeUInt16LE(8, 10); ch.writeUInt16LE(0, 12); ch.writeUInt16LE(0, 14);
    ch.writeUInt32LE(crc, 16); ch.writeUInt32LE(compressed.length, 20); ch.writeUInt32LE(f.data.length, 24);
    ch.writeUInt16LE(nameBuf.length, 28); ch.writeUInt16LE(0, 30); ch.writeUInt16LE(0, 32);
    ch.writeUInt16LE(0, 34); ch.writeUInt16LE(0, 36); ch.writeUInt32LE(0, 38); ch.writeUInt32LE(offset, 42);
    centralParts.push(ch, nameBuf);
    offset += 30 + nameBuf.length + compressed.length;
  }
  const centralSize = centralParts.reduce((s, p) => s + p.length, 0);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); eocd.writeUInt16LE(0, 4); eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(files.length, 8); eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(centralSize, 12); eocd.writeUInt32LE(offset, 16); eocd.writeUInt16LE(0, 20);
  return Buffer.concat([...localParts, ...centralParts, eocd]);
}
