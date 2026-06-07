import { View } from "@react-pdf/renderer";

import { getPersonalYearMessageCopy } from "@/lib/numerology/pdfPersonalYearMessageCopy";

import { PdfLongFormBody } from "../PdfLongFormBody";
import {
  personalYearMessageBodyMarginTopPt,
  personalYearMessageBodyPaddingLeftPt,
  personalYearMessageBodyWidthPt,
} from "../pdfPersonalYearMessageBleedLayout";
import { pdfGuideBleedBodyProseProps } from "../pdfGuideBleedSpacing";
import { PdfPageFrame } from "../PdfPageFrame";
import { PDF_PERSONAL_YEAR_MESSAGE_BG_PATH } from "../pdfAssetPaths";
import { PDF_TOC_LINK_DESTINATION } from "@/lib/pdf/pdfTocLinkDestinations";

import { pdfStyles } from "../styles";

function splitBodyForOwlMargin(body: string, splitMarker: string): [string, string] | null {
  const idx = body.indexOf(splitMarker);
  if (idx < 0) return null;
  return [body.slice(0, idx), body.slice(idx + 2)];
}

const messageBodyProseProps = {
  ...pdfGuideBleedBodyProseProps,
  bodyStyle: { ...pdfStyles.numberGuideBleedBodyText, lineHeight: 1.58 },
  preserveManuscriptLineBreaks: true as const,
  manuscriptBlankLineHeight: 6,
  paragraphGap: 4,
  expandWidth: 0,
} as const;

/**
 * パーソナルイヤー章前・フクロウ先生メッセージ（背景 PNG + 生成テキスト・見出し帯なし）。
 */
export function PersonalYearMessageBleedPage() {
  const copy = getPersonalYearMessageCopy();
  const bodyMarginTop = personalYearMessageBodyMarginTopPt();
  const bodyWidth = personalYearMessageBodyWidthPt();
  const bodyBoxStyle = { marginTop: bodyMarginTop, width: bodyWidth, maxWidth: bodyWidth };
  const parts = copy.bodyOwlMarginSplit
    ? splitBodyForOwlMargin(copy.body, copy.bodyOwlMarginSplit)
    : null;

  return (
    <PdfPageFrame
      title={copy.frameTitle}
      pageType="guide"
      showHeader={false}
      showFooter
      firstPageBodyBackgroundSrc={PDF_PERSONAL_YEAR_MESSAGE_BG_PATH}
      linkDestinationId={PDF_TOC_LINK_DESTINATION.fukuroChapter1}
    >
      <View
        style={[
          pdfStyles.numberGuideBleedContent,
          { paddingLeft: personalYearMessageBodyPaddingLeftPt(), paddingRight: 0 },
        ]}
      >
        {!parts ? (
          <View style={[pdfStyles.numberGuideBleedBody, bodyBoxStyle, { paddingRight: 52 }]}>
            <PdfLongFormBody text={copy.body} {...messageBodyProseProps} />
          </View>
        ) : (
          <>
            <View
              style={[
                pdfStyles.numberGuideBleedBody,
                bodyBoxStyle,
                { paddingRight: 0, marginRight: -72 },
              ]}
            >
              <PdfLongFormBody text={parts[0]} disableWrap {...messageBodyProseProps} expandWidth={18} />
            </View>
            <View style={[pdfStyles.numberGuideBleedBody, bodyBoxStyle, { paddingRight: 52 }]}>
              <PdfLongFormBody
                text={parts[1]}
                {...messageBodyProseProps}
                expandWidth={18}
                firstParagraphMarginTop={messageBodyProseProps.paragraphGap}
              />
            </View>
          </>
        )}
      </View>
    </PdfPageFrame>
  );
}
