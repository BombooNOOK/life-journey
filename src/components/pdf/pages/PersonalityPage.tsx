import { View } from "@react-pdf/renderer";

import { PdfLongFormBody } from "../PdfLongFormBody";
import { PdfText as Text } from "../PdfText";
import { PdfPageFrame } from "../PdfPageFrame";

import { getPersonalityArticle } from "@/lib/numerology/personalityData";
import { breakTitleAtCommaForPdf } from "@/lib/pdf/breakTitleAtComma";
import {
  PDF_PERSONALITY_FIRST_PAGE_PATH,
  PDF_CORE_RESULT_CONTINUATION_BACKGROUND_PATH,
} from "../pdfAssetPaths";

import { pdfLongFormProsePropsWithTallContinuation } from "../pdfLongFormSpacing";
import type { BodyRenderOverrides } from "../pdfRenderConfig";
import { pdfStyles } from "../styles";

interface Props extends BodyRenderOverrides {
  personality: number | null | undefined;
}
export function PersonalityPage({ personality, bodyStyle, bodyExpandWidth }: Props) {
  const article = getPersonalityArticle(personality ?? null);
  const headerTitle = `パーソナリティ・ナンバー ${personality ?? "—"}`;

  if (!article) {
    return (
      <PdfPageFrame
      title={headerTitle}
      pageType="body"
      firstPageBodyBackgroundSrc={PDF_PERSONALITY_FIRST_PAGE_PATH}
      continuationBodyBackgroundSrc={PDF_CORE_RESULT_CONTINUATION_BACKGROUND_PATH}
    >
        <Text style={pdfStyles.muted}>パーソナリティ本文データが未登録のため、このページは簡易表示です。</Text>
      </PdfPageFrame>
    );
  }

  return (
    <PdfPageFrame
      title={headerTitle}
      pageType="body"
      firstPageBodyBackgroundSrc={PDF_PERSONALITY_FIRST_PAGE_PATH}
      continuationBodyBackgroundSrc={PDF_CORE_RESULT_CONTINUATION_BACKGROUND_PATH}
    >
      <View style={pdfStyles.lifePathFirstPageContent}>
        <Text style={pdfStyles.resultTitle}>{breakTitleAtCommaForPdf(article.title)}</Text>
      </View>
      <PdfLongFormBody
        text={article.article}
        readableSentenceWrap
        {...pdfLongFormProsePropsWithTallContinuation}
        bodyStyle={bodyStyle}
        expandWidth={bodyExpandWidth}
      />
    </PdfPageFrame>
  );
}
