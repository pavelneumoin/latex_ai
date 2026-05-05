import { NextResponse } from "next/server";
import path from "node:path";
import { promises as fs } from "node:fs";

const VALID = new Set(["T1", "T2", "T3", "T4", "T5"]);
const CLI_OUTPUT = path.join(process.cwd(), "..", "cli", "output");

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ template: string }> }
) {
  const { template } = await params;
  if (!VALID.has(template)) {
    return NextResponse.json({ error: "invalid_template" }, { status: 400 });
  }
  const pdfPath = path.join(CLI_OUTPUT, template, `${template}.pdf`);
  try {
    const buf = await fs.readFile(pdfPath);
    // Convert Node Buffer to a fresh ArrayBuffer to satisfy BodyInit typing
    const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    return new NextResponse(ab as ArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${template}.pdf"`,
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: "pdf_not_found", detail: (e as Error).message },
      { status: 404 }
    );
  }
}
