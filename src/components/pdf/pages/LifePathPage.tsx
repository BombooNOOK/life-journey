import { View } from "@react-pdf/renderer";

import { PdfLongFormBody } from "../PdfLongFormBody";
import { PdfText as Text } from "../PdfText";
import { PdfPageFrame } from "../PdfPageFrame";

import { getLifePathArticle, lifePathSectionOrder, type LifePathSectionKey } from "@/lib/numerology/lifePathData";

import { pdfLongFormProseProps, pdfLongFormProsePropsWithTallContinuation } from "../pdfLongFormSpacing";
import type { BodyRenderOverrides } from "../pdfRenderConfig";
import { pdfStyles } from "../styles";

interface Props extends BodyRenderOverrides {
  lifePath: number | null | undefined;
}
const SECTION_LABELS: Record<LifePathSectionKey, string> = {
  basic: "基本",
  love: "恋愛",
  work: "仕事",
  money: "金運",
  relationship: "人間関係",
  health: "健康",
};

export function LifePathPage({ lifePath, bodyStyle, bodyExpandWidth }: Props) {
  const article = getLifePathArticle(lifePath ?? null);

  const headerTitle = `ライフパス・ナンバー ${lifePath ?? "—"}`;

  if (!article) {
    return (
      <PdfPageFrame title={headerTitle} pageType="body">
        <Text style={pdfStyles.muted}>ライフパス本文データが未登録のため、このページは簡易表示です。</Text>
      </PdfPageFrame>
    );
  }

  const sectionBlocks = lifePathSectionOrder.map((sectionKey) => {
    const isBasic = sectionKey === "basic";
    const titleNode = isBasic ? null : (
      <Text style={pdfStyles.lifePathSectionTitle}>{SECTION_LABELS[sectionKey]}</Text>
    );

    return (
      <PdfPageFrame key={sectionKey} title={headerTitle} pageType="body">
        <View style={pdfStyles.lifePathSectionBlock}>
          {titleNode}
          <PdfLongFormBody
            text={article.sections[sectionKey]}
            preserveManuscriptLineBreaks
            {...(isBasic ? pdfLongFormProsePropsWithTallContinuation : pdfLongFormProseProps)}
            {...(isBasic ? {} : { continuationPageTopGap: 0 })}
            bodyStyle={bodyStyle}
            expandWidth={bodyExpandWidth}
          />
        </View>
      </PdfPageFrame>
    );
  });

  return <>{sectionBlocks}</>;
}
