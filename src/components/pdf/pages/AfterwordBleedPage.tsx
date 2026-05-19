import { View } from "@react-pdf/renderer";

import { getAfterwordCopy, type AfterwordPageKey } from "@/lib/numerology/pdfAfterwordCopy";
import { PDF_TOC_LINK_DESTINATION } from "@/lib/pdf/pdfTocLinkDestinations";

import { PdfLongFormBody } from "../PdfLongFormBody";
import {
  afterwordBleedBodyMarginTopPt,
  afterwordBleedBodyWidthPt,
  afterwordBleedContentMarginTopPt,
  afterwordBleedContentPaddingLeftPt,
} from "../pdfAfterwordBleedLayout";
import { pdfGuideBleedBodyProseProps } from "../pdfGuideBleedSpacing";
import { PdfPageFrame } from "../PdfPageFrame";
import { PDF_AFTERWORD_1_BG_PATH, PDF_AFTERWORD_2_BG_PATH } from "../pdfAssetPaths";
import { PdfText as Text } from "../PdfText";
import { pdfStyles } from "../styles";

type Props = {
  pageKey: AfterwordPageKey;
};

const AFTERWORD_BG_PATH: Record<AfterwordPageKey, string> = {
  left: PDF_AFTERWORD_1_BG_PATH,
  right: PDF_AFTERWORD_2_BG_PATH,
};

const afterwordBodyProseProps = {
  bodyStyle: pdfStyles.numberGuideBleedBodyText,
  preserveManuscriptLineBreaks: true as const,
  manuscriptBlankLineHeight: 9,
  expandWidth: 0,
  ...pdfGuideBleedBodyProseProps,
} as const;

/**
 * おわりに（背景 PNG + 生成テキスト）。左P: `last_title` + `last_hon1`、右P: `last_hon2`。
 */
export function AfterwordBleedPage({ pageKey }: Props) {
  const copy = getAfterwordCopy(pageKey);
  const bodyMarginTop = pageKey === "left" ? afterwordBleedBodyMarginTopPt() : 0;
  const bodyWidth = afterwordBleedBodyWidthPt(pageKey);
  const owlMargin = pageKey === "right";

  return (
    <PdfPageFrame
      title={copy.frameTitle}
      pageType="guide"
      showHeader={false}
      showFooter
      firstPageBodyBackgroundSrc={AFTERWORD_BG_PATH[pageKey]}
      linkDestinationId={pageKey === "left" ? PDF_TOC_LINK_DESTINATION.afterword : undefined}
    >
      <View
        style={[
          pdfStyles.numberGuideBleedContent,
          {
            marginTop: afterwordBleedContentMarginTopPt(pageKey),
            paddingLeft: afterwordBleedContentPaddingLeftPt(pageKey),
          },
        ]}
      >
        {pageKey === "left" ? (
          <Text style={pdfStyles.numberGuideBleedTitle}>{copy.title}</Text>
        ) : null}
        <View
          style={[
            pdfStyles.numberGuideBleedBody,
            {
              marginTop: bodyMarginTop,
              width: bodyWidth,
              maxWidth: bodyWidth,
              paddingRight: owlMargin ? 52 : 0,
              ...(owlMargin ? { marginRight: -38 } : {}),
            },
          ]}
        >
          <PdfLongFormBody
            text={copy.body}
            disableWrap
            {...afterwordBodyProseProps}
            expandWidth={owlMargin ? 18 : 8}
          />
        </View>
      </View>
    </PdfPageFrame>
  );
}
