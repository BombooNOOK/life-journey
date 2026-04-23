import { PdfPageFrame } from "../PdfPageFrame";

import { PDF_INTRODUCTION_PAGE_1_PATH, PDF_INTRODUCTION_PAGE_2_PATH } from "../pdfAssetPaths";

/**
 * はじめに 2 ページ。各ページとも全面画像（「〇〇ナンバーとは」と同様・文案は画像内）。
 * フッターのページ番号のみ表示。画像は `introduction-page-1.png` / `introduction-page-2.png` を差し替え。
 */
export function IntroductionPages() {
  return (
    <>
      <PdfPageFrame
        title="はじめに"
        pageType="guide"
        showHeader={false}
        fullBleedImageSrc={PDF_INTRODUCTION_PAGE_1_PATH}
      />
      <PdfPageFrame
        title="このガイドの案内人"
        pageType="guide"
        showHeader={false}
        fullBleedImageSrc={PDF_INTRODUCTION_PAGE_2_PATH}
      />
    </>
  );
}
