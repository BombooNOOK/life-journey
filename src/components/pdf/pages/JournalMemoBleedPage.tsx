import { View } from "@react-pdf/renderer";

import { getJournalMemoCopy, type JournalMemoPageKey } from "@/lib/numerology/pdfJournalMemoCopy";

import { PdfLongFormBody } from "../PdfLongFormBody";
import {
  journalMemoContentMinHeightPt,
  journalMemoFukuroCommentBoxStyle,
  journalMemoTitleBoxStyle,
  PDF_JOURNAL_MEMO_FUKURO_FONT_SIZE,
  PDF_JOURNAL_MEMO_FUKURO_LINE_HEIGHT,
  PDF_JOURNAL_MEMO_TEXT_COLOR,
  PDF_JOURNAL_MEMO_TITLE_FONT_SIZE,
} from "../pdfJournalMemoBleedLayout";
import { pdfGuideBleedBodyProseProps } from "../pdfGuideBleedSpacing";
import { PdfPageFrame } from "../PdfPageFrame";
import {
  PDF_JOURNAL_INVITE_4_BG_PATH,
  PDF_JOURNAL_INVITE_5_BG_PATH,
} from "../pdfAssetPaths";
import { PdfText as Text } from "../PdfText";
import { PDF_TOC_LINK_DESTINATION } from "@/lib/pdf/pdfTocLinkDestinations";

const titleTextProps = {
  wrap: false as const,
  orphans: 0,
  widows: 0,
  minPresenceAhead: 0,
};

const titleStyle = {
  fontSize: PDF_JOURNAL_MEMO_TITLE_FONT_SIZE,
  fontWeight: 700 as const,
  lineHeight: 1.2,
  letterSpacing: 0,
  color: PDF_JOURNAL_MEMO_TEXT_COLOR,
  textAlign: "center" as const,
  flexShrink: 0,
};

const fukuroProseProps = {
  ...pdfGuideBleedBodyProseProps,
  bodyStyle: {
    fontSize: PDF_JOURNAL_MEMO_FUKURO_FONT_SIZE,
    lineHeight: PDF_JOURNAL_MEMO_FUKURO_LINE_HEIGHT,
    letterSpacing: 0,
    color: PDF_JOURNAL_MEMO_TEXT_COLOR,
    textAlign: "left" as const,
  },
  preserveManuscriptLineBreaks: true as const,
  manuscriptBlankLineHeight: 0,
  paragraphGap: 0,
  expandWidth: 0,
} as const;

const BACKGROUND_BY_PAGE: Record<JournalMemoPageKey, string> = {
  left: PDF_JOURNAL_INVITE_4_BG_PATH,
  right: PDF_JOURNAL_INVITE_5_BG_PATH,
};

/**
 * 余白ページ — 左 `journal-invite-4-bg` / 右 `journal-invite-5-bg`。
 * 生成: `yohaku`（タイトル）/ 右Pのみ `yohaku_fukuro`（フクロウ吹き出し・本体は背景）。
 */
export function JournalMemoBleedPage({ page }: { page: JournalMemoPageKey }) {
  const copy = getJournalMemoCopy();
  const isRight = page === "right";

  return (
    <PdfPageFrame
      title={copy.frameTitle}
      pageType="writing"
      showHeader={false}
      showFooter
      firstPageBodyBackgroundSrc={BACKGROUND_BY_PAGE[page]}
      linkDestinationId={page === "left" ? PDF_TOC_LINK_DESTINATION.journalMemo : undefined}
    >
      <View
        wrap={false}
        style={{
          position: "relative",
          minHeight: journalMemoContentMinHeightPt(isRight),
          paddingLeft: 0,
          paddingRight: 0,
        }}
      >
        <View
          style={[
            journalMemoTitleBoxStyle(),
            { flexDirection: "row", justifyContent: "center", alignItems: "flex-start" },
          ]}
        >
          <Text {...titleTextProps} style={titleStyle}>
            {copy.title.replace(/\s+/g, "")}
          </Text>
        </View>
        {isRight ? (
          <View style={journalMemoFukuroCommentBoxStyle()}>
            <PdfLongFormBody text={copy.fukuroComment} marginTop={0} {...fukuroProseProps} />
          </View>
        ) : null}
      </View>
    </PdfPageFrame>
  );
}
