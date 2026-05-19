import { View } from "@react-pdf/renderer";

import {
  getChapterDividerCopy,
  type ChapterDividerKey,
} from "@/lib/numerology/pdfChapterDividerCopy";

import {
  chapterDividerContentMinHeightPt,
  chapterNoBoxStyle,
  chapterTitleBoxStyle,
  PDF_CHAPTER_DIVIDER_TEXT_COLOR,
  PDF_CHAPTER_NO_FONT_SIZE,
  PDF_CHAPTER_TITLE_FONT_SIZE,
} from "../pdfChapterDividerBleedLayout";
import { PdfPageFrame } from "../PdfPageFrame";
import { PDF_CHAPTER_DIVIDER_BG_PATH } from "../pdfAssetPaths";
import { PdfText as Text } from "../PdfText";
import { PDF_TOC_LINK_DESTINATION } from "@/lib/pdf/pdfTocLinkDestinations";

type Props = {
  chapter: ChapterDividerKey;
};

const chapterNoStyle = {
  fontSize: PDF_CHAPTER_NO_FONT_SIZE,
  fontWeight: 700 as const,
  lineHeight: 1.12,
  color: PDF_CHAPTER_DIVIDER_TEXT_COLOR,
  textAlign: "center" as const,
};

const chapterTitleStyle = {
  fontSize: PDF_CHAPTER_TITLE_FONT_SIZE,
  fontWeight: 700 as const,
  lineHeight: 1.35,
  color: PDF_CHAPTER_DIVIDER_TEXT_COLOR,
  textAlign: "center" as const,
};

const CHAPTER_LINK_DESTINATION: Record<ChapterDividerKey, string> = {
  1: PDF_TOC_LINK_DESTINATION.chapter1,
  2: PDF_TOC_LINK_DESTINATION.chapter2,
  3: PDF_TOC_LINK_DESTINATION.chapter3,
  4: PDF_TOC_LINK_DESTINATION.chapter4,
};

const labelTextProps = {
  wrap: false as const,
  orphans: 0,
  widows: 0,
  minPresenceAhead: 0,
};

/**
 * 章扉（`chapter-divider-bg.png` + `chapter_no` / `chapter_title`）。
 * 全面 `fullBleedImageSrc` は子要素を載せられないため `firstPageBodyBackgroundSrc` を使用。
 */
export function ChapterDividerBleedPage({ chapter }: Props) {
  const copy = getChapterDividerCopy(chapter);

  return (
    <PdfPageFrame
      title={copy.frameTitle}
      pageType="guide"
      showHeader={false}
      showFooter
      firstPageBodyBackgroundSrc={PDF_CHAPTER_DIVIDER_BG_PATH}
      linkDestinationId={CHAPTER_LINK_DESTINATION[chapter]}
    >
      <View
        wrap={false}
        style={{
          position: "relative",
          minHeight: chapterDividerContentMinHeightPt(),
          paddingLeft: 0,
          paddingRight: 0,
        }}
      >
        <View style={chapterNoBoxStyle()}>
          <Text {...labelTextProps} style={chapterNoStyle}>
            {copy.chapterNo}
          </Text>
        </View>
        <View style={chapterTitleBoxStyle()}>
          <Text {...labelTextProps} style={chapterTitleStyle}>
            {copy.chapterTitle}
          </Text>
        </View>
      </View>
    </PdfPageFrame>
  );
}
