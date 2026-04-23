import { PdfPageFrame } from "../PdfPageFrame";
import { PDF_PERSONAL_MONTH_INTRO_EXTRA_PATH } from "../pdfAssetPaths";

/** パーソナルマンス直前に挿入する説明ページ（全面画像） */
export function PersonalMonthIntroExtraPage() {
  return (
    <PdfPageFrame
      title="パーソナルマンスのご案内"
      pageType="writing"
      showHeader={false}
      fullBleedImageSrc={PDF_PERSONAL_MONTH_INTRO_EXTRA_PATH}
    />
  );
}
