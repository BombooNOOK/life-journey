import { getPdfPageCountFromStaticFile } from "@/lib/pdf/staticPdfFilePageCount";

import { PDF_CHAPTER_INSERT_BEFORE_3_PATH, PDF_CHAPTER_INSERT_BEFORE_4_PATH } from "@/components/pdf/pdfAssetPaths";

/**
 * 旧 `chapter-insert-before-4.pdf`（blank02・鳥の足跡装飾）は `PersonalYearChapterTransitionPage` で出力。
 * その直後のフクロウ章後メッセージは `PersonalYearAfterMessagePage`（生成テキスト）。PDF結合では挿入しない。
 */
export const MERGE_CHAPTER_INSERT_BEFORE_4 = false;

/**
 * `journal-invite-1.png`（fukuro04）は旧ブリッジ章後フクロウメッセージの全面画像。
 * `BridgeAfterMessagePage` 移行後は重複するため出さない（第4章導線1Pは差し替え後に再有効化）。
 */
export const SHOW_JOURNAL_INVITE_LEAD_PAGE = false;

export async function chapterInsertBefore3PageCount(): Promise<number> {
  return getPdfPageCountFromStaticFile(PDF_CHAPTER_INSERT_BEFORE_3_PATH);
}

export async function chapterInsertBefore4PageCount(): Promise<number> {
  if (!MERGE_CHAPTER_INSERT_BEFORE_4) return 0;
  return getPdfPageCountFromStaticFile(PDF_CHAPTER_INSERT_BEFORE_4_PATH);
}
