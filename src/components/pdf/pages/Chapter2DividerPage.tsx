import { PdfPageFrame } from "../PdfPageFrame";
import { PDF_CHAPTER_2_DIVIDER_PATH } from "../pdfAssetPaths";

/** 第2章の扉ページ（パーソナルイヤー導入ページの前） */
export function Chapter2DividerPage() {
  return (
    <PdfPageFrame
      title="第2章"
      pageType="guide"
      showHeader={false}
      fullBleedImageSrc={PDF_CHAPTER_2_DIVIDER_PATH}
    />
  );
}
