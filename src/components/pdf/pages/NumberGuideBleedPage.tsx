import { View } from "@react-pdf/renderer";

import { breakTitleAtCommaForPdf } from "@/lib/pdf/breakTitleAtComma";
import {
  getCoreNumberGuideCopy,
  type CoreNumberGuideKey,
} from "@/lib/numerology/pdfCoreNumberGuideCopy";
import { NUMBER_GUIDE_TOC_DESTINATION } from "@/lib/pdf/pdfTocLinkDestinations";

import { PdfLongFormBody } from "../PdfLongFormBody";
import {
  numberGuideBleedBodyMarginTopPt,
  numberGuideBleedContentMarginTopPt,
  numberGuideBleedContentPaddingLeftPt,
} from "../pdfGuideBleedLayout";
import { pdfGuideBleedBodyProseProps } from "../pdfGuideBleedSpacing";
import { PdfPageFrame } from "../PdfPageFrame";
import { PDF_NUMBER_GUIDE_BG_PATH } from "../pdfAssetPaths";
import { PdfText as Text } from "../PdfText";
import { pdfStyles } from "../styles";

type Props = {
  guideKey: CoreNumberGuideKey;
};

/** フクロウ分割ありで2ページ化しやすい「とは」ページは1枚に収める */
const GUIDE_KEYS_KEEP_ON_ONE_PAGE: ReadonlySet<CoreNumberGuideKey> = new Set(["soul", "maturity"]);

function splitGuideBodyForOwlMargin(body: string, splitMarker: string): [string, string] | null {
  const idx = body.indexOf(splitMarker);
  if (idx < 0) return null;
  return [body.slice(0, idx), body.slice(idx + 2)];
}

function guideBodyCommonProps(compact: boolean) {
  const tight = compact
    ? { lineHeight: 1.52, manuscriptBlankLineHeight: 4, paragraphGap: 3, sentenceLineGap: 0 }
    : null;
  return {
    bodyStyle: tight
      ? { ...pdfStyles.numberGuideBleedBodyText, lineHeight: tight.lineHeight }
      : pdfStyles.numberGuideBleedBodyText,
    preserveManuscriptLineBreaks: true as const,
    manuscriptBlankLineHeight: tight?.manuscriptBlankLineHeight ?? 9,
    expandWidth: 0,
    ...pdfGuideBleedBodyProseProps,
    ...(tight ? { paragraphGap: tight.paragraphGap, sentenceLineGap: tight.sentenceLineGap } : null),
  };
}

function GuideBleedBody({
  compact,
  copyBody,
  bodyOwlMarginSplit,
}: {
  compact: boolean;
  copyBody: string;
  bodyOwlMarginSplit?: string;
}) {
  const bodyMarginTop = numberGuideBleedBodyMarginTopPt();
  const prose = guideBodyCommonProps(compact);
  const parts = bodyOwlMarginSplit ? splitGuideBodyForOwlMargin(copyBody, bodyOwlMarginSplit) : null;

  if (!parts) {
    return (
      <View style={[pdfStyles.numberGuideBleedBody, { marginTop: bodyMarginTop, paddingRight: 52 }]}>
        <PdfLongFormBody text={copyBody} {...prose} />
      </View>
    );
  }

  const [upperBody, lowerBody] = parts;
  const lowerGap = compact ? 2 : pdfGuideBleedBodyProseProps.paragraphGap;
  const owlMarginRight = compact ? -44 : -38;
  const upperExpandWidth = compact ? 20 : 18;

  return (
    <>
      <View
        style={[
          pdfStyles.numberGuideBleedBody,
          { marginTop: bodyMarginTop, paddingRight: 0, marginRight: owlMarginRight },
        ]}
      >
        <PdfLongFormBody text={upperBody} disableWrap {...prose} expandWidth={upperExpandWidth} />
      </View>
      <View
        style={[
          pdfStyles.numberGuideBleedBody,
          { marginTop: compact ? lowerGap : 0, paddingRight: 52 },
        ]}
      >
        <PdfLongFormBody
          text={lowerBody}
          disableWrap={compact}
          {...prose}
          expandWidth={compact ? 10 : 0}
          firstParagraphMarginTop={lowerGap}
        />
      </View>
    </>
  );
}

/**
 * 「〇〇ナンバーとは」共通レイアウト: `number-guide-bg.png` + 生成テキスト。
 * 全面 `fullBleedImageSrc` は子要素を載せられないため `firstPageBodyBackgroundSrc` を使用。
 */
export function NumberGuideBleedPage({ guideKey }: Props) {
  const copy = getCoreNumberGuideCopy(guideKey);
  const keepGuideOnOnePage = GUIDE_KEYS_KEEP_ON_ONE_PAGE.has(guideKey);
  const linkDestinationId = NUMBER_GUIDE_TOC_DESTINATION[guideKey];

  return (
    <PdfPageFrame
      title={copy.frameTitle}
      pageType="guide"
      showHeader={false}
      showFooter
      firstPageBodyBackgroundSrc={PDF_NUMBER_GUIDE_BG_PATH}
      linkDestinationId={linkDestinationId}
    >
      <View
        wrap={keepGuideOnOnePage ? false : undefined}
        style={[
          pdfStyles.numberGuideBleedContent,
          {
            marginTop: numberGuideBleedContentMarginTopPt(),
            paddingLeft: numberGuideBleedContentPaddingLeftPt(),
          },
        ]}
      >
        <Text style={pdfStyles.numberGuideBleedTitle}>{breakTitleAtCommaForPdf(copy.title)}</Text>
        <GuideBleedBody
          compact={keepGuideOnOnePage}
          copyBody={copy.body}
          bodyOwlMarginSplit={copy.bodyOwlMarginSplit}
        />
      </View>
    </PdfPageFrame>
  );
}
