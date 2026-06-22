import type { PdfTocEntry } from "@/lib/pdf/pdfTocEntries";

/** 表紙（PDF 先頭ページ）の 0-based インデックス */
export const KANTEI_PDF_COVER_INDEX = 0;

/** 鑑定書PDFの物理ページ数（表紙含む）。レイアウト変更時のみ更新。 */
export const KANTEI_PDF_PHYSICAL_PAGE_COUNT = 90;

export function buildKanteiPdfViewSrc(
  pdfBaseUrl: string,
  options: { pdfIndex?: number; destinationId?: string } = {},
): string {
  const hash = options.destinationId
    ? `nameddest=${options.destinationId}`
    : `page=${(options.pdfIndex ?? KANTEI_PDF_COVER_INDEX) + 1}`;
  const base = pdfBaseUrl.split("#")[0] ?? pdfBaseUrl;
  return `${base}#${hash}`;
}

/** @deprecated API直リンク用。fetch+blob 表示では buildKanteiPdfViewSrc を使う */
export function buildKanteiPdfIframeSrc(
  pdfPreviewHref: string,
  options: { pdfIndex?: number; destinationId?: string; cacheBust?: boolean } = {},
): string {
  const base =
    typeof window !== "undefined" ? window.location.origin : "http://127.0.0.1";
  const url = new URL(pdfPreviewHref, base);
  if (options.cacheBust) {
    url.searchParams.set("_cb", String(Date.now()));
  }
  if (options.destinationId) {
    url.hash = `nameddest=${options.destinationId}`;
  } else {
    const pdfIndex = options.pdfIndex ?? KANTEI_PDF_COVER_INDEX;
    url.hash = `page=${pdfIndex + 1}`;
  }
  return `${url.pathname}${url.search}${url.hash}`;
}


/**
 * 目次・フッターと同じ「表紙を除いた読者向けページ番号」→ pdf.js の 0-based ページ index。
 * 例: 読者向け 3 ページ → PDF 4 ページ目 → index 3
 */
export function readerPageToPdfIndex(readerPage: number): number {
  if (!Number.isFinite(readerPage) || readerPage < 1) return KANTEI_PDF_COVER_INDEX;
  return Math.floor(readerPage);
}

/** pdf.js index → 読者向けラベル（表紙は null） */
export function pdfIndexToReaderPageLabel(pdfIndex: number): number | null {
  if (!Number.isFinite(pdfIndex) || pdfIndex <= KANTEI_PDF_COVER_INDEX) return null;
  return pdfIndex;
}

/** 総ページ数から読者向けページ数（表紙除く） */
export function totalReaderPagesFromPdfCount(pdfPageCount: number): number {
  return Math.max(0, pdfPageCount - 1);
}

/** 目次各行のジャンプ先（章見出しは直後の項目ページ） */
export function buildTocJumpIndexByDestination(entries: PdfTocEntry[]): Map<string, number> {
  const map = new Map<string, number>();
  let nextReaderPage = 1;
  for (let i = entries.length - 1; i >= 0; i -= 1) {
    const entry = entries[i]!;
    if (entry.kind === "item") {
      nextReaderPage = entry.page;
    }
    map.set(entry.destinationId, readerPageToPdfIndex(nextReaderPage));
  }
  return map;
}

export function formatKanteiReaderPageIndicator(pdfIndex: number, pdfPageCount: number): string {
  if (pdfPageCount <= 0) return "—";
  if (pdfIndex <= KANTEI_PDF_COVER_INDEX) return "表紙";
  const readerPage = pdfIndexToReaderPageLabel(pdfIndex);
  const totalReader = totalReaderPagesFromPdfCount(pdfPageCount);
  if (readerPage == null) return "—";
  return `${readerPage} / ${totalReader}`;
}

export function clampPdfIndex(index: number, pdfPageCount: number): number {
  if (pdfPageCount <= 0) return 0;
  return Math.min(Math.max(0, Math.floor(index)), pdfPageCount - 1);
}

export function parsePdfPageSearchParam(raw: string | null, pdfPageCount: number): number | null {
  if (raw == null || raw.trim() === "") return null;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) return null;
  if (pdfPageCount <= 0) return n;
  return clampPdfIndex(n, pdfPageCount);
}
