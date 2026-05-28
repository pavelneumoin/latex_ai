// Minimal type stub for pdf-parse — package ships without types.
declare module "pdf-parse" {
  interface PDFInfo {
    text: string;
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata: unknown;
    version: string;
  }
  function pdf(dataBuffer: Buffer | Uint8Array): Promise<PDFInfo>;
  export default pdf;
}
