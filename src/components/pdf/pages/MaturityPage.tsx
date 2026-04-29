import { View } from "@react-pdf/renderer";

import { PdfLongFormBody } from "../PdfLongFormBody";
import { PdfText as Text } from "../PdfText";
import { PdfPageFrame } from "../PdfPageFrame";

import { getMaturityArticle } from "@/lib/numerology/maturityData";
import { breakTitleAtCommaForPdf } from "@/lib/pdf/breakTitleAtComma";
import { PDF_MATURITY_FIRST_PAGE_PATH } from "../pdfAssetPaths";

import { pdfLongFormProsePropsWithTallContinuation } from "../pdfLongFormSpacing";
import type { BodyRenderOverrides } from "../pdfRenderConfig";
import { pdfStyles } from "../styles";

interface Props extends BodyRenderOverrides {
  /** `maturityNumberFromNumerology` の結果。D が無いときは null */
  maturity: number | null;
}
export function MaturityPage({ maturity, bodyStyle, bodyExpandWidth }: Props) {
  const headerTitle =
    maturity == null ? `マチュリティ・ナンバー —` : `マチュリティ・ナンバー ${maturity}`;

  if (maturity == null) {
    return (
      <PdfPageFrame
      title={headerTitle}
      pageType="body"
      firstPageBodyBackgroundSrc={PDF_MATURITY_FIRST_PAGE_PATH}
    >
        <Text style={pdfStyles.muted}>
          ディスティニーが算出できないため、マチュリティナンバー（LP＋D）は定義されません。
        </Text>
      </PdfPageFrame>
    );
  }

  const article = getMaturityArticle(maturity);

  if (!article) {
    return (
      <PdfPageFrame
      title={headerTitle}
      pageType="body"
      firstPageBodyBackgroundSrc={PDF_MATURITY_FIRST_PAGE_PATH}
    >
        <Text style={pdfStyles.muted}>マチュリティ本文データが未登録のため、このページは簡易表示です。</Text>
      </PdfPageFrame>
    );
  }

  return (
    <>
      <PdfPageFrame
        title={headerTitle}
        pageType="body"
        firstPageBodyBackgroundSrc={PDF_MATURITY_FIRST_PAGE_PATH}
      >
        <View style={pdfStyles.maturityNumberFirstPageHero}>
          <Text style={pdfStyles.resultTitle}>{breakTitleAtCommaForPdf(article.title)}</Text>
        </View>
      </PdfPageFrame>
      <PdfPageFrame title={headerTitle} pageType="body">
        <View style={pdfStyles.lifePathSectionBlock}>
          <PdfLongFormBody
            text={article.article}
            readableSentenceWrap
            {...pdfLongFormProsePropsWithTallContinuation}
            bodyStyle={bodyStyle}
            expandWidth={bodyExpandWidth}
          />
        </View>
      </PdfPageFrame>
    </>
  );
}
