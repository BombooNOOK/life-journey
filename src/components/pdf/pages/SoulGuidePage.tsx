import { PdfPageFrame } from "../PdfPageFrame";

import { PDF_SOUL_GUIDE_PAGE_PATH } from "../pdfAssetPaths";

/** 「ソウルナンバーとは」— デザイン由来の全面1ページ */
export function SoulGuidePage() {
  return (
    <PdfPageFrame
      title="ソウルナンバーとは"
      pageType="guide"
      showHeader={false}
      fullBleedImageSrc={PDF_SOUL_GUIDE_PAGE_PATH}
    />
  );
}
