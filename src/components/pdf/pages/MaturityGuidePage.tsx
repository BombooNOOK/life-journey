import { PdfPageFrame } from "../PdfPageFrame";

import { PDF_MATURITY_GUIDE_PAGE_PATH } from "../pdfAssetPaths";

/** 「マチュリティナンバーとは」— デザイン由来の全面1ページ */
export function MaturityGuidePage() {
  return (
    <PdfPageFrame
      title="マチュリティナンバーとは"
      pageType="guide"
      showHeader={false}
      fullBleedImageSrc={PDF_MATURITY_GUIDE_PAGE_PATH}
    />
  );
}
