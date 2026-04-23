import { PdfPageFrame } from "../PdfPageFrame";

import { PDF_BIRTHDAY_GUIDE_PAGE_PATH } from "../pdfAssetPaths";

/** 「バースデーナンバーとは」— デザイン由来の全面1ページ */
export function BirthdayGuidePage() {
  return (
    <PdfPageFrame
      title="バースデーナンバーとは"
      pageType="guide"
      showHeader={false}
      fullBleedImageSrc={PDF_BIRTHDAY_GUIDE_PAGE_PATH}
    />
  );
}
