import { View } from "@react-pdf/renderer";

import { breakTitleAtCommaForPdf } from "@/lib/pdf/breakTitleAtComma";
import {
  getIntroductionCopy,
  type IntroductionPageKey,
} from "@/lib/numerology/pdfIntroductionCopy";

import { PdfLongFormBody } from "../PdfLongFormBody";
import {
  introductionBleedBodyMarginTopPt,
  introductionBleedBodyWidthPt,
  introductionBleedContentMarginTopPt,
  introductionBleedContentPaddingLeftPt,
} from "../pdfIntroductionBleedLayout";
import { pdfGuideBleedBodyProseProps } from "../pdfGuideBleedSpacing";
import { PdfPageFrame } from "../PdfPageFrame";
import {
  PDF_INTRODUCTION_PAGE_1_BG_PATH,
  PDF_INTRODUCTION_PAGE_2_BG_PATH,
} from "../pdfAssetPaths";
import { PdfText as Text } from "../PdfText";
import { PDF_TOC_LINK_DESTINATION } from "@/lib/pdf/pdfTocLinkDestinations";

import { pdfStyles } from "../styles";

type Props = {
  pageKey: IntroductionPageKey;
};

const INTRODUCTION_BG_PATH: Record<IntroductionPageKey, string> = {
  page1: PDF_INTRODUCTION_PAGE_1_BG_PATH,
  page2: PDF_INTRODUCTION_PAGE_2_BG_PATH,
};

function splitBodyForOwlMargin(body: string, splitMarker: string): [string, string] | null {
  const idx = body.indexOf(splitMarker);
  if (idx < 0) return null;
  return [body.slice(0, idx), body.slice(idx + 2)];
}

const introBodyProseProps = {
  bodyStyle: pdfStyles.numberGuideBleedBodyText,
  preserveManuscriptLineBreaks: true as const,
  manuscriptBlankLineHeight: 9,
  expandWidth: 0,
  ...pdfGuideBleedBodyProseProps,
} as const;

function IntroductionBleedBody({
  pageKey,
  copyBody,
  bodyOwlMarginSplit,
  noOwlMargin,
}: {
  pageKey: IntroductionPageKey;
  copyBody: string;
  bodyOwlMarginSplit?: string;
  /** 1P はフクロウなし → 右余白を広く使う */
  noOwlMargin?: boolean;
}) {
  const bodyMarginTop = introductionBleedBodyMarginTopPt();
  const bodyWidth = introductionBleedBodyWidthPt(pageKey);
  const parts = bodyOwlMarginSplit ? splitBodyForOwlMargin(copyBody, bodyOwlMarginSplit) : null;
  const rightPad = noOwlMargin ? 0 : 52;
  const bodyBoxStyle = { marginTop: bodyMarginTop, width: bodyWidth, maxWidth: bodyWidth };

  if (!parts) {
    return (
      <View style={[pdfStyles.numberGuideBleedBody, bodyBoxStyle, { paddingRight: rightPad }]}>
        <PdfLongFormBody
          text={copyBody}
          disableWrap={noOwlMargin}
          {...introBodyProseProps}
          expandWidth={noOwlMargin ? 8 : 0}
        />
      </View>
    );
  }

  const [upperBody, lowerBody] = parts;

  return (
    <>
      <View
        style={[
          pdfStyles.numberGuideBleedBody,
          bodyBoxStyle,
          { paddingRight: 0, marginRight: -38 },
        ]}
      >
        <PdfLongFormBody text={upperBody} disableWrap {...introBodyProseProps} expandWidth={18} />
      </View>
      <View style={[pdfStyles.numberGuideBleedBody, bodyBoxStyle, { paddingRight: 52 }]}>
        <PdfLongFormBody
          text={lowerBody}
          {...introBodyProseProps}
          firstParagraphMarginTop={pdfGuideBleedBodyProseProps.paragraphGap}
        />
      </View>
    </>
  );
}

/**
 * はじめに（背景 PNG + 生成テキスト）。全面 `fullBleedImageSrc` は子要素を載せられないため
 * `firstPageBodyBackgroundSrc` を使用。
 */
const INTRODUCTION_LINK_DESTINATION: Record<IntroductionPageKey, string> = {
  page1: PDF_TOC_LINK_DESTINATION.introduction,
  page2: PDF_TOC_LINK_DESTINATION.guideHost,
};

export function IntroductionBleedPage({ pageKey }: Props) {
  const copy = getIntroductionCopy(pageKey);

  return (
    <PdfPageFrame
      title={copy.frameTitle}
      pageType="guide"
      showHeader={false}
      showFooter
      firstPageBodyBackgroundSrc={INTRODUCTION_BG_PATH[pageKey]}
      linkDestinationId={INTRODUCTION_LINK_DESTINATION[pageKey]}
    >
      <View
        style={[
          pdfStyles.numberGuideBleedContent,
          {
            marginTop: introductionBleedContentMarginTopPt(),
            paddingLeft: introductionBleedContentPaddingLeftPt(),
          },
        ]}
      >
        <Text style={pdfStyles.numberGuideBleedTitle}>{breakTitleAtCommaForPdf(copy.title)}</Text>
        <IntroductionBleedBody
          pageKey={pageKey}
          copyBody={copy.body}
          bodyOwlMarginSplit={copy.bodyOwlMarginSplit}
          noOwlMargin={pageKey === "page1"}
        />
      </View>
    </PdfPageFrame>
  );
}
