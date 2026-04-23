import { PdfPageFrame } from "../PdfPageFrame";

import { PDF_PERSONALITY_GUIDE_PAGE_PATH } from "../pdfAssetPaths";

/** 「パーソナリティナンバーとは」— デザイン由来の全面1ページ */
export function PersonalityGuidePage() {
  return (
    <PdfPageFrame
      title="パーソナリティナンバーとは"
      pageType="guide"
      showHeader={false}
      fullBleedImageSrc={PDF_PERSONALITY_GUIDE_PAGE_PATH}
    />
  );
}
