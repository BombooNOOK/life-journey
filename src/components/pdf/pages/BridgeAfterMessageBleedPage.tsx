import { View } from "@react-pdf/renderer";

import { getBridgeAfterMessageCopy } from "@/lib/numerology/pdfBridgeAfterMessageCopy";

import { PdfLongFormBody } from "../PdfLongFormBody";
import {
  bridgeAfterMessageBodyMarginTopPt,
  bridgeAfterMessageBodyPaddingLeftPt,
  bridgeAfterMessageBodyWidthPt,
} from "../pdfBridgeAfterMessageBleedLayout";
import { pdfGuideBleedBodyProseProps } from "../pdfGuideBleedSpacing";
import { PdfPageFrame } from "../PdfPageFrame";
import { PDF_BRIDGE_AFTER_MESSAGE_BG_PATH } from "../pdfAssetPaths";
import { PDF_TOC_LINK_DESTINATION } from "@/lib/pdf/pdfTocLinkDestinations";

import { pdfStyles } from "../styles";

function splitBodyForOwlMargin(body: string, splitMarker: string): [string, string] | null {
  const idx = body.indexOf(splitMarker);
  if (idx < 0) return null;
  return [body.slice(0, idx), body.slice(idx + 2)];
}

const messageBodyProseProps = {
  bodyStyle: { ...pdfStyles.numberGuideBleedBodyText, lineHeight: 1.58 },
  preserveManuscriptLineBreaks: true as const,
  manuscriptBlankLineHeight: 5,
  expandWidth: 0,
  ...pdfGuideBleedBodyProseProps,
  paragraphGap: 4,
} as const;

/**
 * ブリッジ章後・フクロウ先生メッセージ（`bridge-after-message-bg.png` + 生成テキスト）。
 * 上段・下段を1ページに収める（`wrap={false}`）。2ページ目に割れると背景なしの白紙になるため。
 */
export function BridgeAfterMessageBleedPage() {
  const copy = getBridgeAfterMessageCopy();
  const bodyMarginTop = bridgeAfterMessageBodyMarginTopPt();
  const bodyWidth = bridgeAfterMessageBodyWidthPt();
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
      firstPageBodyBackgroundSrc={PDF_BRIDGE_AFTER_MESSAGE_BG_PATH}
      linkDestinationId={PDF_TOC_LINK_DESTINATION.fukuroChapter3}
    >
      <View
        wrap={false}
        style={[
          pdfStyles.numberGuideBleedContent,
          { paddingLeft: bridgeAfterMessageBodyPaddingLeftPt(), paddingRight: 0 },
        ]}
      >
        {!parts ? (
          <View
            wrap={false}
            style={[pdfStyles.numberGuideBleedBody, bodyBoxStyle, { paddingRight: 52 }]}
          >
            <PdfLongFormBody text={copy.body} {...messageBodyProseProps} />
          </View>
        ) : (
          <>
            <View
              wrap={false}
              style={[
                pdfStyles.numberGuideBleedBody,
                bodyBoxStyle,
                { paddingRight: 0, marginRight: -72 },
              ]}
            >
              <PdfLongFormBody text={parts[0]} disableWrap {...messageBodyProseProps} expandWidth={18} />
            </View>
            <View
              wrap={false}
              style={[pdfStyles.numberGuideBleedBody, bodyBoxStyle, { paddingRight: 52 }]}
            >
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
