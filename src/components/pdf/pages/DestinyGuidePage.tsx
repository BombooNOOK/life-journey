import { PdfPageFrame } from "../PdfPageFrame";

import { PDF_DESTINY_GUIDE_PAGE_PATH } from "../pdfAssetPaths";

/** 「ディスティニーナンバーとは」— デザイン由来の全面1ページ */
export function DestinyGuidePage() {
  return (
    <PdfPageFrame
      title="ディスティニーナンバーとは"
      pageType="guide"
      showHeader={false}
      fullBleedImageSrc={PDF_DESTINY_GUIDE_PAGE_PATH}
    />
  );
}
