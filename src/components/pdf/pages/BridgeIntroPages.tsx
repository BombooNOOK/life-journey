import { PdfPageFrame } from "../PdfPageFrame";
import { PDF_BRIDGE_INTRO_PAGE_1_PATH, PDF_BRIDGE_INTRO_PAGE_2_PATH } from "../pdfAssetPaths";

/**
 * ブリッジナンバー導入 2 ページ（全面画像・ヘッダーなし・ページ番号あり）。
 */
export function BridgeIntroPages() {
  return (
    <>
      <PdfPageFrame
        title="ブリッジナンバーとは"
        pageType="guide"
        showHeader={false}
        fullBleedImageSrc={PDF_BRIDGE_INTRO_PAGE_1_PATH}
      />
      <PdfPageFrame
        title="ブリッジナンバーとは"
        pageType="guide"
        showHeader={false}
        fullBleedImageSrc={PDF_BRIDGE_INTRO_PAGE_2_PATH}
      />
    </>
  );
}
