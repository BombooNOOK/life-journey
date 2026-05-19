import { View } from "@react-pdf/renderer";

import { PdfLongFormBody } from "../PdfLongFormBody";
import { PdfText as Text } from "../PdfText";
import { PdfPageFrame } from "../PdfPageFrame";

import { getDestinyArticle } from "@/lib/numerology/destinyData";

import { pdfLongFormProsePropsWithTallContinuation } from "../pdfLongFormSpacing";
import type { BodyRenderOverrides } from "../pdfRenderConfig";
import { pdfStyles } from "../styles";

interface Props extends BodyRenderOverrides {
  destiny: number | null | undefined;
}
export function DestinyPage({ destiny, bodyStyle, bodyExpandWidth }: Props) {
  const article = getDestinyArticle(destiny ?? null);
  const headerTitle = `ディスティニー・ナンバー ${destiny ?? "—"}`;

  if (!article) {
    return (
      <PdfPageFrame title={headerTitle} pageType="body">
        <Text style={pdfStyles.muted}>ディスティニー本文データが未登録のため、このページは簡易表示です。</Text>
      </PdfPageFrame>
    );
  }

  return (
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
  );
}
