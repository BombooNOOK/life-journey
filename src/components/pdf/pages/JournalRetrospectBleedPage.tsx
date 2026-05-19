import { View } from "@react-pdf/renderer";

import { getJournalRetrospectCopy } from "@/lib/numerology/pdfJournalRetrospectCopy";

import { PdfLongFormBody } from "../PdfLongFormBody";
import {
  journalRetrospectAwarenessLabelBoxStyle,
  journalRetrospectCarryForwardLabelBoxStyle,
  journalRetrospectContentMinHeightPt,
  journalRetrospectImpressionLabelBoxStyle,
  journalRetrospectMessageBoxStyle,
  journalRetrospectThemeLabelBoxStyle,
  journalRetrospectTitleBoxStyle,
  PDF_JOURNAL_RETROSPECT_LABEL_FONT_SIZE,
  PDF_JOURNAL_RETROSPECT_LABEL_LINE_HEIGHT,
  PDF_JOURNAL_RETROSPECT_MESSAGE_FONT_SIZE,
  PDF_JOURNAL_RETROSPECT_MESSAGE_LINE_HEIGHT,
  PDF_JOURNAL_RETROSPECT_TEXT_COLOR,
  PDF_JOURNAL_RETROSPECT_TITLE_FONT_SIZE,
} from "../pdfJournalRetrospectBleedLayout";
import { pdfGuideBleedBodyProseProps } from "../pdfGuideBleedSpacing";
import { PdfPageFrame } from "../PdfPageFrame";
import { PDF_JOURNAL_INVITE_3_BG_PATH } from "../pdfAssetPaths";
import { PdfText as Text } from "../PdfText";
import { PDF_TOC_LINK_DESTINATION } from "@/lib/pdf/pdfTocLinkDestinations";

const titleStyle = {
  fontSize: PDF_JOURNAL_RETROSPECT_TITLE_FONT_SIZE,
  fontWeight: 700 as const,
  lineHeight: 1.35,
  letterSpacing: 0,
  color: PDF_JOURNAL_RETROSPECT_TEXT_COLOR,
  textAlign: "center" as const,
};

const messageProseProps = {
  ...pdfGuideBleedBodyProseProps,
  bodyStyle: {
    fontSize: PDF_JOURNAL_RETROSPECT_MESSAGE_FONT_SIZE,
    lineHeight: PDF_JOURNAL_RETROSPECT_MESSAGE_LINE_HEIGHT,
    letterSpacing: 0,
    color: PDF_JOURNAL_RETROSPECT_TEXT_COLOR,
    textAlign: "left" as const,
  },
  preserveManuscriptLineBreaks: true as const,
  manuscriptBlankLineHeight: 0,
  paragraphGap: 0,
  expandWidth: 0,
} as const;

const labelTextProps = {
  wrap: false as const,
  orphans: 0,
  widows: 0,
  minPresenceAhead: 0,
};

const labelStyle = {
  fontSize: PDF_JOURNAL_RETROSPECT_LABEL_FONT_SIZE,
  fontWeight: 700 as const,
  lineHeight: PDF_JOURNAL_RETROSPECT_LABEL_LINE_HEIGHT,
  letterSpacing: 0,
  color: PDF_JOURNAL_RETROSPECT_TEXT_COLOR,
  textAlign: "left" as const,
};

/**
 * 第4章「この年を振り返って」— `journal-invite-3-bg.png` + 生成テキスト。
 * Canva: huri_title / huri_messe / huri01〜huri04。
 */
export function JournalRetrospectBleedPage() {
  const copy = getJournalRetrospectCopy();

  return (
    <PdfPageFrame
      title={copy.frameTitle}
      pageType="writing"
      showHeader={false}
      showFooter
      firstPageBodyBackgroundSrc={PDF_JOURNAL_INVITE_3_BG_PATH}
      linkDestinationId={PDF_TOC_LINK_DESTINATION.journalRetrospect}
    >
      <View
        wrap={false}
        style={{
          position: "relative",
          minHeight: journalRetrospectContentMinHeightPt(),
          paddingLeft: 0,
          paddingRight: 0,
        }}
      >
        <View style={journalRetrospectTitleBoxStyle()}>
          <Text style={titleStyle}>{copy.title}</Text>
        </View>
        <View style={journalRetrospectMessageBoxStyle()}>
          <PdfLongFormBody text={copy.message} marginTop={0} {...messageProseProps} />
        </View>
        <View style={journalRetrospectThemeLabelBoxStyle()}>
          <Text {...labelTextProps} style={labelStyle}>
            {copy.themeLabel}
          </Text>
        </View>
        <View style={journalRetrospectAwarenessLabelBoxStyle()}>
          <Text {...labelTextProps} style={labelStyle}>
            {copy.awarenessLabel}
          </Text>
        </View>
        <View style={journalRetrospectImpressionLabelBoxStyle()}>
          <Text {...labelTextProps} style={labelStyle}>
            {copy.impressionLabel}
          </Text>
        </View>
        <View style={journalRetrospectCarryForwardLabelBoxStyle()}>
          <Text {...labelTextProps} style={labelStyle}>
            {copy.carryForwardLabel}
          </Text>
        </View>
      </View>
    </PdfPageFrame>
  );
}
