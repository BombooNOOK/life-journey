import { readFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";

/**
 * リポジトリ同梱の固定 PDF（章挿入など）のページ数。
 * パスごとに初回だけディスク＋pdf-lib を読み、以降の鑑定書リクエストでは再利用する。
 */
const cache = new Map<string, Promise<number>>();

export async function getPdfPageCountFromStaticFile(pdfPath: string): Promise<number> {
  let p = cache.get(pdfPath);
  if (!p) {
    p = (async () => {
      let bytes: Buffer;
      try {
        bytes = await readFile(pdfPath);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes("ENOENT")) return 0;
        throw err;
      }
      const doc = await PDFDocument.load(bytes);
      return doc.getPageCount();
    })();
    cache.set(pdfPath, p);
  }
  return p;
}
