import { View } from "@react-pdf/renderer";

import { getJournalPrioritiesCopy } from "@/lib/numerology/pdfJournalPrioritiesCopy";

import { PdfLongFormBody } from "../PdfLongFormBody";
import {
  journalPrioritiesAwarenessLabelBoxStyle,
  journalPrioritiesContentMinHeightPt,
  journalPrioritiesMessageBoxStyle,
  journalPrioritiesSelfWordLabelBoxStyle,
  journalPrioritiesThemeLabelBoxStyle,
  journalPrioritiesTitleBoxStyle,
  PDF_JOURNAL_PRIORITIES_LABEL_FONT_SIZE,
  PDF_JOURNAL_PRIORITIES_LABEL_LINE_HEIGHT,
  PDF_JOURNAL_PRIORITIES_MESSAGE_FONT_SIZE,
  PDF_JOURNAL_PRIORITIES_MESSAGE_LINE_HEIGHT,
  PDF_JOURNAL_PRIORITIES_TEXT_COLOR,
  PDF_JOURNAL_PRIORITIES_TITLE_FONT_SIZE,
} from "../pdfJournalPrioritiesBleedLayout";
import { pdfGuideBleedBodyProseProps } from "../pdfGuideBleedSpacing";
import { PdfPageFrame } from "../PdfPageFrame";
import { PDF_JOURNAL_INVITE_2_BG_PATH } from "../pdfAssetPaths";
import { PdfText as Text } from "../PdfText";
import { PDF_TOC_LINK_DESTINATION } from "@/lib/pdf/pdfTocLinkDestinations";

const titleStyle = {
  fontSize: PDF_JOURNAL_PRIORITIES_TITLE_FONT_SIZE,
  fontWeight: 700 as const,
  lineHeight: 1.35,
  letterSpacing: 0,
  color: PDF_JOURNAL_PRIORITIES_TEXT_COLOR,
  textAlign: "center" as const,
};

const messageProseProps = {
  ...pdfGuideBleedBodyProseProps,
  bodyStyle: {
    fontSize: PDF_JOURNAL_PRIORITIES_MESSAGE_FONT_SIZE,
    lineHeight: PDF_JOURNAL_PRIORITIES_MESSAGE_LINE_HEIGHT,
    letterSpacing: 0,
    color: PDF_JOURNAL_PRIORITIES_TEXT_COLOR,
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
  fontSize: PDF_JOURNAL_PRIORITIES_LABEL_FONT_SIZE,
  fontWeight: 700 as const,
  lineHeight: PDF_JOURNAL_PRIORITIES_LABEL_LINE_HEIGHT,
  letterSpacing: 0,
  color: PDF_JOURNAL_PRIORITIES_TEXT_COLOR,
  textAlign: "left" as const,
};

/**
 * 第4章「この年大切にしたいこと」— `journal-invite-2-bg.png` + 生成テキスト。
 * 記入枠は背景 PNG のみ。Canva: toshi_title / toshi_messe / toshi_thema / toshi_ishiki / toshi_tome。
 */
export function JournalPrioritiesBleedPage() {
  const copy = getJournalPrioritiesCopy();

  return (
    <PdfPageFrame
      title={copy.frameTitle}
      pageType="writing"
      showHeader={false}
      showFooter
      firstPageBodyBackgroundSrc={PDF_JOURNAL_INVITE_2_BG_PATH}
      linkDestinationId={PDF_TOC_LINK_DESTINATION.journalPriorities}
    >
      <View
        wrap={false}
        style={{
          position: "relative",
          minHeight: journalPrioritiesContentMinHeightPt(),
          paddingLeft: 0,
          paddingRight: 0,
        }}
      >
        <View style={journalPrioritiesTitleBoxStyle()}>
          <Text style={titleStyle}>{copy.title}</Text>
        </View>
        <View style={journalPrioritiesMessageBoxStyle()}>
          <PdfLongFormBody text={copy.message} marginTop={0} {...messageProseProps} />
        </View>
        <View style={journalPrioritiesThemeLabelBoxStyle()}>
          <Text {...labelTextProps} style={labelStyle}>
            {copy.themeLabel}
          </Text>
        </View>
        <View style={journalPrioritiesAwarenessLabelBoxStyle()}>
          <Text {...labelTextProps} style={labelStyle}>
            {copy.awarenessLabel}
          </Text>
        </View>
        <View style={journalPrioritiesSelfWordLabelBoxStyle()}>
          <Text {...labelTextProps} style={labelStyle}>
            {copy.selfWordLabel}
          </Text>
        </View>
      </View>
    </PdfPageFrame>
  );
}
