import { View } from "@react-pdf/renderer";

import { breakTitleAtCommaForPdf } from "@/lib/pdf/breakTitleAtComma";
import { getBridgeGuideCopy, type BridgeGuidePageKey } from "@/lib/numerology/pdfBridgeGuideCopy";
import { PDF_TOC_LINK_DESTINATION } from "@/lib/pdf/pdfTocLinkDestinations";

import { PdfLongFormBody } from "../PdfLongFormBody";
import {
  numberGuideBleedBodyMarginTopPt,
  numberGuideBleedContentMarginTopPt,
  numberGuideBleedContentPaddingLeftPt,
} from "../pdfGuideBleedLayout";
import { pdfGuideBleedBodyProseProps } from "../pdfGuideBleedSpacing";
import { PdfPageFrame } from "../PdfPageFrame";
import {
  PDF_BRIDGE_GUIDE_PAGE_1_BG_PATH,
  PDF_BRIDGE_GUIDE_PAGE_2_BG_PATH,
} from "../pdfAssetPaths";
import { PdfText as Text } from "../PdfText";
import { pdfStyles } from "../styles";

const BRIDGE_GUIDE_BG: Record<BridgeGuidePageKey, string> = {
  page1: PDF_BRIDGE_GUIDE_PAGE_1_BG_PATH,
  page2: PDF_BRIDGE_GUIDE_PAGE_2_BG_PATH,
};

/** LP 等 7つの「とは」と同じ行間・空行（`pdfGuideBleedBodyProseProps` + `numberGuideBleedBodyText`） */
const bridgeGuideProseProps = {
  bodyStyle: pdfStyles.numberGuideBleedBodyText,
  preserveManuscriptLineBreaks: true as const,
  manuscriptBlankLineHeight: 9,
  expandWidth: 0,
  ...pdfGuideBleedBodyProseProps,
} as const;

function splitBodyForOwlMargin(body: string, splitMarker: string): [string, string] | null {
  const idx = body.indexOf(splitMarker);
  if (idx < 0) return null;
  return [body.slice(0, idx), body.slice(idx + 2)];
}

function BridgeGuideBleedBody({
  copyBody,
  bodyOwlMarginSplit,
}: {
  copyBody: string;
  bodyOwlMarginSplit?: string;
}) {
  const bodyMarginTop = numberGuideBleedBodyMarginTopPt();
  const parts = bodyOwlMarginSplit ? splitBodyForOwlMargin(copyBody, bodyOwlMarginSplit) : null;

  if (!parts) {
    return (
      <View style={[pdfStyles.numberGuideBleedBody, { marginTop: bodyMarginTop, paddingRight: 52 }]}>
        <PdfLongFormBody text={copyBody} {...bridgeGuideProseProps} />
      </View>
    );
  }

  const [upperBody, lowerBody] = parts;

  return (
    <>
      <View
        style={[
          pdfStyles.numberGuideBleedBody,
          { marginTop: bodyMarginTop, paddingRight: 0, marginRight: -72 },
        ]}
      >
        <PdfLongFormBody text={upperBody} disableWrap {...bridgeGuideProseProps} expandWidth={18} />
      </View>
      <View style={[pdfStyles.numberGuideBleedBody, { paddingRight: 52 }]}>
        <PdfLongFormBody
          text={lowerBody}
          disableWrap
          {...bridgeGuideProseProps}
          expandWidth={12}
          firstParagraphMarginTop={bridgeGuideProseProps.paragraphGap}
        />
      </View>
    </>
  );
}

type Props = {
  page: BridgeGuidePageKey;
};

/**
 * ブリッジナンバー「とは」— `bridge-guide-page-*-bg.png` + 生成テキスト（2ページ）。
 * 座標は `title_bri` / `hon_bri01` / `hon_bri02`（`pdfGuideBleedLayout.ts` と同一）。
 */
export function BridgeGuideBleedPage({ page }: Props) {
  const copy = getBridgeGuideCopy(page);

  return (
    <PdfPageFrame
      title={copy.frameTitle}
      pageType="guide"
      showHeader={false}
      showFooter
      firstPageBodyBackgroundSrc={BRIDGE_GUIDE_BG[page]}
      linkDestinationId={page === "page1" ? PDF_TOC_LINK_DESTINATION.bridge : undefined}
    >
      <View
        style={[
          pdfStyles.numberGuideBleedContent,
          {
            marginTop: numberGuideBleedContentMarginTopPt(),
            paddingLeft: numberGuideBleedContentPaddingLeftPt(),
          },
        ]}
      >
        {copy.title ? (
          <Text style={pdfStyles.numberGuideBleedTitle}>{breakTitleAtCommaForPdf(copy.title)}</Text>
        ) : null}
        <BridgeGuideBleedBody copyBody={copy.body} bodyOwlMarginSplit={copy.bodyOwlMarginSplit} />
      </View>
    </PdfPageFrame>
  );
}
