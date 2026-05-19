import { View } from "@react-pdf/renderer";

import { PdfLongFormBody } from "../PdfLongFormBody";
import { PdfText as Text } from "../PdfText";
import { PdfPageFrame } from "../PdfPageFrame";

import { getPersonalityArticle } from "@/lib/numerology/personalityData";

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
      <PdfPageFrame title={headerTitle} pageType="body">
        <Text style={pdfStyles.muted}>パーソナリティ本文データが未登録のため、このページは簡易表示です。</Text>
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
