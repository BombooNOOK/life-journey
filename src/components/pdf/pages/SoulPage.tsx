import { View } from "@react-pdf/renderer";

import { PdfLongFormBody } from "../PdfLongFormBody";
import { PdfText as Text } from "../PdfText";
import { PdfPageFrame } from "../PdfPageFrame";

import { getSoulArticle } from "@/lib/numerology/soulData";
import { breakTitleAtCommaForPdf } from "@/lib/pdf/breakTitleAtComma";
import { PDF_SOUL_FIRST_PAGE_PATH } from "../pdfAssetPaths";

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
    >
        <Text style={pdfStyles.muted}>ソウル本文データが未登録のため、このページは簡易表示です。</Text>
      </PdfPageFrame>
    );
  }

  return (
    <>
      <PdfPageFrame
        title={headerTitle}
        pageType="body"
        firstPageBodyBackgroundSrc={PDF_SOUL_FIRST_PAGE_PATH}
      >
        <View style={pdfStyles.soulNumberFirstPageHero}>
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
