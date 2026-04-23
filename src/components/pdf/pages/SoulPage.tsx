import { View } from "@react-pdf/renderer";

import { PdfLongFormBody } from "../PdfLongFormBody";
import { PdfText as Text } from "../PdfText";
import { PdfPageFrame } from "../PdfPageFrame";

import { getSoulArticle } from "@/lib/numerology/soulData";
import { breakTitleAtCommaForPdf } from "@/lib/pdf/breakTitleAtComma";
import {
  PDF_SOUL_FIRST_PAGE_PATH,
  PDF_CORE_RESULT_CONTINUATION_BACKGROUND_PATH,
} from "../pdfAssetPaths";

import { pdfLongFormProsePropsWithTallContinuation } from "../pdfLongFormSpacing";
import type { BodyRenderOverrides } from "../pdfRenderConfig";
import { pdfStyles } from "../styles";

interface Props extends BodyRenderOverrides {
  soul: number | null | undefined;
}
export function SoulPage({ soul, bodyStyle, bodyExpandWidth }: Props) {
  const article = getSoulArticle(soul ?? null);
  const headerTitle = `ソウル・ナンバー ${soul ?? "—"}`;

  if (!article) {
    return (
      <PdfPageFrame
      title={headerTitle}
      pageType="body"
      firstPageBodyBackgroundSrc={PDF_SOUL_FIRST_PAGE_PATH}
      continuationBodyBackgroundSrc={PDF_CORE_RESULT_CONTINUATION_BACKGROUND_PATH}
    >
        <Text style={pdfStyles.muted}>ソウル本文データが未登録のため、このページは簡易表示です。</Text>
      </PdfPageFrame>
    );
  }

  return (
    <PdfPageFrame
      title={headerTitle}
      pageType="body"
      firstPageBodyBackgroundSrc={PDF_SOUL_FIRST_PAGE_PATH}
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
