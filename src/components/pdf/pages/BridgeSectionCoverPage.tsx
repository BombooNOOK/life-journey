import { PdfPageFrame } from "../PdfPageFrame";
import { PDF_BRIDGE_SECTION_COVER_PATH } from "../pdfAssetPaths";

/**
 * ブリッジ章の切り替えページ（全面画像）。
 */
export function BridgeSectionCoverPage() {
  return (
    <PdfPageFrame
      title="ブリッジナンバー"
      pageType="guide"
      showHeader={false}
      fullBleedImageSrc={PDF_BRIDGE_SECTION_COVER_PATH}
    />
  );
}
