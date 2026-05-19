import { PdfPageFrame } from "../PdfPageFrame";
import { PDF_BRIDGE_SECTION_COVER_PATH } from "../pdfAssetPaths";

/**
 * ブリッジ章の切り替えページ（全面画像）。
 * @deprecated `bridge-section-cover.png` は旧PY章後フクロウ（文字込み）のため使わない。
 * 第3章扉は `Chapter3DividerPage`（`chapter-3-divider.png`）。
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
