import { Image, View } from "@react-pdf/renderer";

import { getJournalDiaryInviteCopy } from "@/lib/numerology/pdfJournalDiaryInviteCopy";
import { PDF_TOC_LINK_DESTINATION } from "@/lib/pdf/pdfTocLinkDestinations";

import { PdfLongFormBody } from "../PdfLongFormBody";
import {
  journalDiaryInviteCm1BoxStyle,
  journalDiaryInviteCm2BoxStyle,
  journalDiaryInviteHonbunBoxStyle,
  journalDiaryInviteQrBoxStyle,
  journalDiaryInviteSignatureBoxStyle,
  PDF_JOURNAL_DIARY_INVITE_BODY_FONT_SIZE,
  PDF_JOURNAL_DIARY_INVITE_BODY_LINE_HEIGHT,
  PDF_JOURNAL_DIARY_INVITE_SIGNATURE_FONT_SIZE,
  PDF_JOURNAL_DIARY_INVITE_TEXT_COLOR,
  PDF_JOURNAL_DIARY_INVITE_URL_FONT_SIZE,
} from "../pdfJournalDiaryInviteBleedLayout";
import { pdfGuideBleedBodyProseProps } from "../pdfGuideBleedSpacing";
import { PdfPageFrame } from "../PdfPageFrame";
import {
  PDF_JOURNAL_DIARY_INVITE_BG_PATH,
  PDF_JOURNAL_DIARY_INVITE_QR_PATH,
  resolvePdfAssetPath,
} from "../pdfAssetPaths";
import { PdfText as Text } from "../PdfText";

const bodyProseProps = {
  ...pdfGuideBleedBodyProseProps,
  bodyStyle: {
    fontSize: PDF_JOURNAL_DIARY_INVITE_BODY_FONT_SIZE,
    lineHeight: PDF_JOURNAL_DIARY_INVITE_BODY_LINE_HEIGHT,
    letterSpacing: 0,
    color: PDF_JOURNAL_DIARY_INVITE_TEXT_COLOR,
    textAlign: "left" as const,
  },
  preserveManuscriptLineBreaks: true as const,
  manuscriptBlankLineHeight: 4,
  paragraphGap: 2,
  expandWidth: 0,
} as const;

/** `shime_cm1` — 開始位置・字級は維持、行間は本文よりやや広め */
const cm1ProseProps = {
  ...bodyProseProps,
  bodyStyle: {
    ...bodyProseProps.bodyStyle,
    lineHeight: 1.5,
  },
  sentenceLineGap: 5,
  manuscriptBlankLineHeight: 4,
  paragraphGap: 4,
} as const;

const labelTextProps = {
  orphans: 0,
  widows: 0,
  minPresenceAhead: 0,
};

/**
 * 第4章末・フクロウ先生メッセージ＋あしあと案内（1P）。
 * `journal-diary-invite-bg.png` + shime_honbun / shime_cm1 / shime_cm2 / shime_qr
 */
export function JournalDiaryInviteBleedPage() {
  const copy = getJournalDiaryInviteCopy();

  return (
    <PdfPageFrame
      title={copy.frameTitle}
      pageType="writing"
      showHeader={false}
      showFooter
      firstPageBodyBackgroundSrc={PDF_JOURNAL_DIARY_INVITE_BG_PATH}
      linkDestinationId={PDF_TOC_LINK_DESTINATION.fukuroChapter4}
    >
      <View wrap={false} style={{ position: "relative", paddingLeft: 0, paddingRight: 0 }}>
        <View wrap={false} style={journalDiaryInviteHonbunBoxStyle()}>
          <PdfLongFormBody text={copy.mainBody} marginTop={0} {...bodyProseProps} />
        </View>
        <View wrap={false} style={journalDiaryInviteSignatureBoxStyle()}>
          <Text
            {...labelTextProps}
            wrap={false}
            style={{
              fontSize: PDF_JOURNAL_DIARY_INVITE_SIGNATURE_FONT_SIZE,
              lineHeight: 1.35,
              color: PDF_JOURNAL_DIARY_INVITE_TEXT_COLOR,
              textAlign: "right",
            }}
          >
            {copy.signature}
          </Text>
        </View>
        <View wrap={false} style={journalDiaryInviteCm1BoxStyle()}>
          <PdfLongFormBody text={copy.diaryIntroBody} marginTop={0} {...cm1ProseProps} />
        </View>
        <View wrap={false} style={journalDiaryInviteCm2BoxStyle()}>
          <Text
            {...labelTextProps}
            wrap={false}
            style={{
              fontSize: PDF_JOURNAL_DIARY_INVITE_URL_FONT_SIZE,
              lineHeight: 1.35,
              color: PDF_JOURNAL_DIARY_INVITE_TEXT_COLOR,
              textAlign: "left",
              textDecoration: "underline",
            }}
          >
            {copy.homeUrl}
          </Text>
        </View>
        <View wrap={false} style={journalDiaryInviteQrBoxStyle()}>
          <Image
            cache={false}
            src={resolvePdfAssetPath(PDF_JOURNAL_DIARY_INVITE_QR_PATH)}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </View>
      </View>
    </PdfPageFrame>
  );
}
