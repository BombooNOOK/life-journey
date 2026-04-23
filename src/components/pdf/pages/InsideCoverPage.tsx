import { PdfPageFrame } from "../PdfPageFrame";

import { PDF_INSIDE_COVER_PAGE_PATH } from "../pdfAssetPaths";

/**
 * 表紙の次の中表紙（扉絵）。全面画像・ページ番号のみ（はじめにと同じ `fullBleedImageSrc`）。
 */
export function InsideCoverPage() {
  return (
    <PdfPageFrame
      title="扉絵"
      pageType="door"
      showHeader={false}
      fullBleedImageSrc={PDF_INSIDE_COVER_PAGE_PATH}
    />
  );
}
