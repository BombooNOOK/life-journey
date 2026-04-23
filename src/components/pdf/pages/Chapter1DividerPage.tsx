import { PdfPageFrame } from "../PdfPageFrame";
import { PDF_CHAPTER_1_DIVIDER_PATH } from "../pdfAssetPaths";

/** 第1章の扉ページ（ライフパスナンバー章の前） */
export function Chapter1DividerPage() {
  return (
    <PdfPageFrame
      title="第1章"
      pageType="guide"
      showHeader={false}
      fullBleedImageSrc={PDF_CHAPTER_1_DIVIDER_PATH}
    />
  );
}
