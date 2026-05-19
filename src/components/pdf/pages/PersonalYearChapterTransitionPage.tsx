import { PdfPageFrame } from "../PdfPageFrame";
import { PDF_PERSONAL_YEAR_CHAPTER_TRANSITION_PATH } from "../pdfAssetPaths";

/**
 * パーソナルイヤー章末〜ブリッジ章前の装飾ページ（鳥の足跡・全面画像）。
 * 旧 `chapter-insert-before-4.pdf`（blank02）相当。フクロウ章後メッセージの直前に置く。
 */
export function PersonalYearChapterTransitionPage() {
  return (
    <PdfPageFrame
      title="パーソナルイヤー"
      pageType="guide"
      showHeader={false}
      fullBleedImageSrc={PDF_PERSONAL_YEAR_CHAPTER_TRANSITION_PATH}
    />
  );
}
