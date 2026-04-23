import { PdfPageFrame } from "../PdfPageFrame";

import {
  PDF_PERSONAL_YEAR_GUIDE_PAGE_PATH,
  PDF_PERSONAL_YEAR_MESSAGE_PAGE_PATH,
} from "../pdfAssetPaths";

export function PersonalYearMessagePage() {
  return (
    <PdfPageFrame
      title="フクロウ先生からのメッセージ"
      pageType="guide"
      showHeader={false}
      fullBleedImageSrc={PDF_PERSONAL_YEAR_MESSAGE_PAGE_PATH}
    />
  );
}

export function PersonalYearGuidePage() {
  return (
    <PdfPageFrame
      title="パーソナルイヤー"
      pageType="guide"
      showHeader={false}
      fullBleedImageSrc={PDF_PERSONAL_YEAR_GUIDE_PAGE_PATH}
    />
  );
}

/**
 * マチュリティの後に入る 2 ページ導入（全面画像・ヘッダーなし・ページ番号のみ）。
 * 1P: フクロウ先生からのメッセージ / 2P: パーソナルイヤー導入
 */
export function PersonalYearIntroPages() {
  return (
    <>
      <PersonalYearMessagePage />
      <PersonalYearGuidePage />
    </>
  );
}
