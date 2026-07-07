import { readerPageToPdfIndex } from "@/lib/pdf/kanteiReaderPage";

/** 鑑定書ビューア初回ガイド（URL クエリ `guide` の値） */
export const KANTEI_FIRST_READ_GUIDE_QUERY = "life-path-first" as const;

export type KanteiFirstReadGuideMode = typeof KANTEI_FIRST_READ_GUIDE_QUERY;

/** ライフ・パス・ナンバー章（目次ベース・表紙除く読者向けページ番号） */
export const KANTEI_LIFE_PATH_FIRST_READ = {
  startReaderPage: 8,
  endReaderPage: 15,
  nextChapterReaderPage: 16,
} as const;

export function kanteiLifePathFirstPdfIndex(): number {
  return readerPageToPdfIndex(KANTEI_LIFE_PATH_FIRST_READ.startReaderPage);
}

export function kanteiLifePathLastPdfIndex(): number {
  return readerPageToPdfIndex(KANTEI_LIFE_PATH_FIRST_READ.endReaderPage);
}

export function isKanteiFirstReadGuideMode(
  guide: string | null | undefined,
): guide is KanteiFirstReadGuideMode {
  return guide === KANTEI_FIRST_READ_GUIDE_QUERY;
}

export function buildKanteiFirstReadHref(orderId: string): string {
  return `/orders/${orderId}/read?guide=${KANTEI_FIRST_READ_GUIDE_QUERY}`;
}

export function isPdfIndexInFirstReadRange(pdfIndex: number): boolean {
  return (
    pdfIndex >= kanteiLifePathFirstPdfIndex() && pdfIndex <= kanteiLifePathLastPdfIndex()
  );
}

const KANTEI_FIRST_READ_COMPLETE_PREFIX = "ljd:kanteiFirstReadComplete:";

function canUseSessionStorage(): boolean {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

export function readKanteiFirstReadComplete(orderId: string): boolean {
  if (!canUseSessionStorage()) return false;
  return window.sessionStorage.getItem(`${KANTEI_FIRST_READ_COMPLETE_PREFIX}${orderId}`) === "1";
}

export function markKanteiFirstReadComplete(orderId: string): void {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.setItem(`${KANTEI_FIRST_READ_COMPLETE_PREFIX}${orderId}`, "1");
}
