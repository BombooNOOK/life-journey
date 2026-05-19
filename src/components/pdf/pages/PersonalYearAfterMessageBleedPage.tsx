import { View } from "@react-pdf/renderer";

import { getPersonalYearAfterMessageCopy } from "@/lib/numerology/pdfPersonalYearAfterMessageCopy";

import { PdfLongFormBody } from "../PdfLongFormBody";
import {
  PDF_AFTER_MESSAGE_LOWER_FONT_SIZE,
  PDF_AFTER_MESSAGE_LOWER_SENTENCE_LINE_GAP,
  PDF_AFTER_MESSAGE_TEXT_COLOR,
  PDF_AFTER_MESSAGE_UPPER_FONT_SIZE,
  personalYearAfterMessageLowerGapMarginTopPt,
  personalYearAfterMessageLowerPaddingLeftPt,
  personalYearAfterMessageLowerWidthPt,
  personalYearAfterMessageUpperMarginTopPt,
  personalYearAfterMessageUpperPaddingLeftPt,
  personalYearAfterMessageUpperWidthPt,
} from "../pdfPersonalYearAfterMessageBleedLayout";
import { pdfGuideBleedBodyProseProps } from "../pdfGuideBleedSpacing";
import { PdfPageFrame } from "../PdfPageFrame";
import { PDF_PERSONAL_YEAR_AFTER_MESSAGE_BG_PATH } from "../pdfAssetPaths";
import { PDF_TOC_LINK_DESTINATION } from "@/lib/pdf/pdfTocLinkDestinations";

import { pdfStyles } from "../styles";

const upperBodyStyle = {
  fontSize: PDF_AFTER_MESSAGE_UPPER_FONT_SIZE,
  lineHeight: 1.58,
  letterSpacing: 0,
  color: PDF_AFTER_MESSAGE_TEXT_COLOR,
  textAlign: "left" as const,
};

const lowerBodyStyle = {
  fontSize: PDF_AFTER_MESSAGE_LOWER_FONT_SIZE,
  lineHeight: 1.68,
  letterSpacing: 0,
  color: PDF_AFTER_MESSAGE_TEXT_COLOR,
  textAlign: "left" as const,
  fontWeight: 700 as const,
};

const upperProseProps = {
  ...pdfGuideBleedBodyProseProps,
  bodyStyle: upperBodyStyle,
  preserveManuscriptLineBreaks: true as const,
  manuscriptBlankLineHeight: 6,
  paragraphGap: 4,
  expandWidth: 0,
} as const;

const lowerProseProps = {
  ...pdfGuideBleedBodyProseProps,
  bodyStyle: lowerBodyStyle,
  preserveManuscriptLineBreaks: true as const,
  manuscriptBlankLineHeight: 0,
  paragraphGap: 0,
  sentenceLineGap: PDF_AFTER_MESSAGE_LOWER_SENTENCE_LINE_GAP,
  expandWidth: 0,
} as const;

/**
 * パーソナルイヤー章後・フクロウ先生メッセージ（`46_ue` + `46_shita` / 背景 PNG + 生成テキスト）。
 * 上段・下段を1ページに収める（`wrap={false}`）。下段箇条書きは `PDF_AFTER_MESSAGE_LOWER_SENTENCE_LINE_GAP` で行間を確保。
 */
export function PersonalYearAfterMessageBleedPage() {
  const copy = getPersonalYearAfterMessageCopy();
  const upperMarginTop = personalYearAfterMessageUpperMarginTopPt();
  const upperWidth = personalYearAfterMessageUpperWidthPt();
  const upperBoxStyle = { marginTop: upperMarginTop, width: upperWidth, maxWidth: upperWidth };
  const lowerWidth = personalYearAfterMessageLowerWidthPt();
  const lowerGap = personalYearAfterMessageLowerGapMarginTopPt();
  const lowerBoxStyle = {
    marginTop: lowerGap,
    width: lowerWidth,
    maxWidth: lowerWidth,
  };

  return (
    <PdfPageFrame
      title={copy.frameTitle}
      pageType="guide"
      showHeader={false}
      showFooter
      firstPageBodyBackgroundSrc={PDF_PERSONAL_YEAR_AFTER_MESSAGE_BG_PATH}
      linkDestinationId={PDF_TOC_LINK_DESTINATION.fukuroChapter2}
    >
      <View
        wrap={false}
        style={[pdfStyles.numberGuideBleedContent, { paddingLeft: 0, paddingRight: 0 }]}
      >
        <View
          style={[
            pdfStyles.numberGuideBleedBody,
            upperBoxStyle,
            {
              paddingLeft: personalYearAfterMessageUpperPaddingLeftPt(),
              paddingRight: 0,
              marginRight: -72,
            },
          ]}
        >
          <PdfLongFormBody text={copy.upperBody} {...upperProseProps} expandWidth={18} />
        </View>
        <View
          style={[
            pdfStyles.numberGuideBleedBody,
            lowerBoxStyle,
            { paddingLeft: personalYearAfterMessageLowerPaddingLeftPt(), paddingRight: 0 },
          ]}
        >
          <PdfLongFormBody text={copy.lowerBody} {...lowerProseProps} expandWidth={8} />
        </View>
      </View>
    </PdfPageFrame>
  );
}
