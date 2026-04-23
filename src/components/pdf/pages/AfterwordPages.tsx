import { PdfPageFrame } from "../PdfPageFrame";
import { PDF_AFTERWORD_PAGE_1_PATH, PDF_AFTERWORD_PAGE_2_PATH } from "../pdfAssetPaths";

/** あとがき 2ページ（全面画像・順序固定: owari01 -> owari02） */
export function AfterwordPages() {
  return (
    <>
      <PdfPageFrame
        title="あとがき"
        pageType="writing"
        showHeader={false}
        fullBleedImageSrc={PDF_AFTERWORD_PAGE_1_PATH}
      />
      <PdfPageFrame
        title="あとがき"
        pageType="writing"
        showHeader={false}
        fullBleedImageSrc={PDF_AFTERWORD_PAGE_2_PATH}
      />
    </>
  );
}
