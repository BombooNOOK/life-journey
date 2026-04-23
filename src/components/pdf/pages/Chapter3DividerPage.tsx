import { PdfPageFrame } from "../PdfPageFrame";
import { PDF_CHAPTER_3_DIVIDER_PATH } from "../pdfAssetPaths";

/** 第3章の扉ページ（ブリッジナンバー導入ページの前） */
export function Chapter3DividerPage() {
  return (
    <PdfPageFrame
      title="第3章"
      pageType="guide"
      showHeader={false}
      fullBleedImageSrc={PDF_CHAPTER_3_DIVIDER_PATH}
    />
  );
}
