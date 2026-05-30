// DOCX-экспортёр. Две стратегии:
//
//  A) Pandoc (если установлен): рендерим .tex стэндалон → pandoc -f latex -t docx → .docx.
//     Это даёт самое качественное преобразование, поддерживает формулы как OMML.
//
//  B) Fallback — собираем .docx руками как минимальный валидный OOXML zip
//     (документ + базовые стили) из чистого JSON contentJson. Формулы вставляются как plain text
//     (`$x^2 + 1$`), без преобразования в OMML. Это позволяет хоть как-то отдать docx, когда
//     pandoc на сервере не установлен.
//
// Утром: при необходимости заменить fallback на pandoc+mathml→omml через `--mathml` или подключить
// docxtemplater для шаблонной генерации.

import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { renderLatexStandalone } from "./render-latex";
import type { Exporter, ExportInput, ExportResult, WorksheetContent } from "./types";

const PANDOC_CMD = process.env.PANDOC_CMD || "pandoc";

async function commandExists(cmd: string): Promise<boolean> {
  return new Promise((resolve) => {
    const which = process.platform === "win32" ? "where" : "which";
    const p = spawn(which, [cmd], { shell: true });
    let ok = false;
    p.stdout.on("data", () => (ok = true));
    p.on("close", (code) => resolve(ok && code === 0));
    p.on("error", () => resolve(false));
  });
}

export class DocxExporter implements Exporter {
  readonly format = "docx" as const;
  readonly name = "docx";

  private pandocReady: boolean | null = null;

  async isReady() {
    // Всегда true — fallback гарантированно отрабатывает.
    return true;
  }

  async export(input: ExportInput): Promise<ExportResult> {
    if (this.pandocReady === null) {
      this.pandocReady = await commandExists(PANDOC_CMD);
    }
    const data = this.pandocReady
      ? await exportViaPandoc(input)
      : await exportFallback(input.content);

    const safeTitle = slugifyAscii(input.content.title);
    return {
      format: "docx",
      filename: `${safeTitle || "worksheet"}-${input.worksheetId}.docx`,
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      data,
    };
  }
}

async function exportViaPandoc(input: ExportInput): Promise<Buffer> {
  const styleSlug = await pickStyle(input.templateId);
  const rendered = await renderLatexStandalone(input.content, styleSlug, input.brand, { includeAnswers: input.includeAnswers });

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "rl-docx-"));
  const texPath = path.join(tmpDir, "ws.tex");
  const docxPath = path.join(tmpDir, "ws.docx");
  await fs.writeFile(texPath, rendered.texSource, "utf-8");

  await new Promise<void>((resolve, reject) => {
    const p = spawn(
      PANDOC_CMD,
      ["-f", "latex", "-t", "docx", "-o", docxPath, texPath],
      { shell: true }
    );
    let stderr = "";
    p.stderr.on("data", (d) => (stderr += d.toString()));
    p.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`pandoc exit ${code}: ${stderr.slice(0, 500)}`))
    );
    p.on("error", reject);
  });

  const data = await fs.readFile(docxPath);
  fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  return data;
}

async function pickStyle(templateId: string): Promise<string> {
  try {
    const { prisma } = await import("../db");
    const tpl = await prisma.template.findUnique({ where: { id: templateId } });
    return tpl?.style || "classic_wildcat_purple";
  } catch {
    return "classic_wildcat_purple";
  }
}

// ───── Fallback: минимальный OOXML zip без внешних библиотек ─────
// Это самосборка простейшего .docx как zip-архива с document.xml + content_types + rels.
// Используем deflate через node:zlib + ручную сборку zip-структуры.
// Достаточно для того, чтобы Word/LibreOffice открыли и показали текст.

async function exportFallback(content: WorksheetContent): Promise<Buffer> {
  const documentXml = buildDocumentXml(content);
  const stylesXml = buildStylesXml();
  const contentTypesXml = buildContentTypesXml();
  const relsXml = buildRelsXml();
  const docRelsXml = buildDocRelsXml();

  const files: { name: string; data: Buffer }[] = [
    { name: "[Content_Types].xml", data: Buffer.from(contentTypesXml, "utf-8") },
    { name: "_rels/.rels", data: Buffer.from(relsXml, "utf-8") },
    { name: "word/document.xml", data: Buffer.from(documentXml, "utf-8") },
    { name: "word/styles.xml", data: Buffer.from(stylesXml, "utf-8") },
    { name: "word/_rels/document.xml.rels", data: Buffer.from(docRelsXml, "utf-8") },
  ];

  return makeZip(files);
}

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildDocumentXml(c: WorksheetContent): string {
  const titleP = `<w:p><w:pPr><w:pStyle w:val="Title"/></w:pPr><w:r><w:t xml:space="preserve">${xmlEscape(c.title)}</w:t></w:r></w:p>`;
  const subP = c.subtitle
    ? `<w:p><w:pPr><w:pStyle w:val="Subtitle"/></w:pPr><w:r><w:t xml:space="preserve">${xmlEscape(c.subtitle)}</w:t></w:r></w:p>`
    : "";

  const tasksXml = c.tasks
    .map((t) => {
      const head = `<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:t xml:space="preserve">Задача №${t.n}</w:t></w:r></w:p>`;
      const body = `<w:p><w:r><w:t xml:space="preserve">${xmlEscape(t.condition)}</w:t></w:r></w:p>`;
      const answer = `<w:p><w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">Ответ: ___________________</w:t></w:r></w:p>`;
      const sep = `<w:p/>`;
      return head + body + answer + sep;
    })
    .join("");

  const footer = `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:i/><w:sz w:val="16"/></w:rPr><w:t xml:space="preserve">Сгенерировано на РабочийЛист.ai</w:t></w:r></w:p>`;

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${titleP}
    ${subP}
    ${tasksXml}
    ${footer}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;
}

function buildStylesXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:styleId="Title">
    <w:name w:val="Title"/>
    <w:pPr><w:jc w:val="center"/><w:spacing w:after="120"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="40"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Subtitle">
    <w:name w:val="Subtitle"/>
    <w:pPr><w:jc w:val="center"/><w:spacing w:after="240"/></w:pPr>
    <w:rPr><w:i/><w:sz w:val="22"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="Heading 2"/>
    <w:pPr><w:spacing w:before="160" w:after="60"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="26"/></w:rPr>
  </w:style>
</w:styles>`;
}

function buildContentTypesXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;
}

function buildRelsXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
}

function buildDocRelsXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
}

// ───── Минимальный zip-writer без внешних зависимостей ─────
// Поддерживает только store + deflate; этого хватает для .docx.

import zlib from "node:zlib";

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = c ^ buf[i];
    for (let k = 0; k < 8; k++) {
      c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
    }
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
    const uncompressedSize = f.data.length;
    const compressedSize = compressed.length;

    // Local file header
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4); // version needed
    localHeader.writeUInt16LE(0x0800, 6); // flags: UTF-8 names
    localHeader.writeUInt16LE(8, 8); // method = deflate
    localHeader.writeUInt16LE(0, 10); // time
    localHeader.writeUInt16LE(0, 12); // date
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(compressedSize, 18);
    localHeader.writeUInt32LE(uncompressedSize, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localParts.push(localHeader, nameBuf, compressed);

    // Central directory header
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(compressedSize, 20);
    central.writeUInt32LE(uncompressedSize, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);

    centralParts.push(central, nameBuf);
    offset += 30 + nameBuf.length + compressedSize;
  }

  const centralSize = centralParts.reduce((s, p) => s + p.length, 0);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(centralSize, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, ...centralParts, eocd]);
}

function slugifyAscii(s: string): string {
  return s
    .toLowerCase()
    .replace(/[а-яё]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
