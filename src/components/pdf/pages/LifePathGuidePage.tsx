import { PdfPageFrame } from "../PdfPageFrame";

import { PDF_LIFE_PATH_GUIDE_PAGE_PATH } from "../pdfAssetPaths";

/** 「ライフパスナンバーとは」— デザインPDFを全面1ページとして表示（表紙と同様） */
export function LifePathGuidePage() {
  return (
    <PdfPageFrame
      title="ライフパスナンバーとは"
      pageType="guide"
      showHeader={false}
      fullBleedImageSrc={PDF_LIFE_PATH_GUIDE_PAGE_PATH}
    />
  );
}
