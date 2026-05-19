import { View } from "@react-pdf/renderer";

import {
  getCoreNumberIntroCopy,
  type CoreNumberIntroKey,
} from "@/lib/numerology/pdfCoreNumberIntroCopy";
import { breakTitleAtCommaForPdf } from "@/lib/pdf/breakTitleAtComma";

import {
  coreNumberIntroContentMinHeightPt,
  coreNumberIntroLabelBoxStyle,
  coreNumberIntroSubtitleBoxStyle,
  coreNumberIntroThemeBoxStyle,
  PDF_CORE_NUMBER_INTRO_LABEL_FONT_SIZE,
  PDF_CORE_NUMBER_INTRO_SUBTITLE_FONT_SIZE,
  PDF_CORE_NUMBER_INTRO_TEXT_COLOR,
  PDF_CORE_NUMBER_INTRO_THEME_FONT_SIZE,
} from "../pdfCoreNumberIntroBleedLayout";
import { PdfPageFrame } from "../PdfPageFrame";
import { PDF_CORE_NUMBER_FIRST_BG_PATH } from "../pdfAssetPaths";
import { PdfText as Text } from "../PdfText";

type Props = {
  coreKey: CoreNumberIntroKey;
  /** 固定ラベル（例: 生まれ持った性質）の直下。ナンバー別。 */
  subtitle?: string | null;
  /** バースデーのみ：サブタイトル（strength）の下のテーマ行 */
  themeLine?: string | null;
  linkDestinationId?: string;
};

const labelTextProps = {
  wrap: false as const,
  orphans: 0,
  widows: 0,
  minPresenceAhead: 0,
};

const labelStyle = {
  fontSize: PDF_CORE_NUMBER_INTRO_LABEL_FONT_SIZE,
  fontWeight: 700 as const,
  lineHeight: 1.2,
  color: PDF_CORE_NUMBER_INTRO_TEXT_COLOR,
  textAlign: "center" as const,
};

const subtitleStyle = {
  fontSize: PDF_CORE_NUMBER_INTRO_SUBTITLE_FONT_SIZE,
  lineHeight: 1.5,
  color: "#2f2f2f",
  textAlign: "center" as const,
};

const themeLineStyle = {
  fontSize: PDF_CORE_NUMBER_INTRO_THEME_FONT_SIZE,
  fontWeight: 700 as const,
  lineHeight: 1.45,
  color: "#666",
  textAlign: "center" as const,
};

/**
 * コアナンバー中間扉（`core-number-first-bg.png` + `core` ラベル + ナンバー別見出し）。
 * 各「とは」ガイドの直後・本文の直前に挿入。
 */
export function CoreNumberIntroBleedPage({ coreKey, subtitle, themeLine, linkDestinationId }: Props) {
  const copy = getCoreNumberIntroCopy(coreKey);
  const subtitleText = subtitle?.trim() ? breakTitleAtCommaForPdf(subtitle.trim()) : null;
  const themeText = themeLine?.trim() ? breakTitleAtCommaForPdf(themeLine.trim()) : null;

  return (
    <PdfPageFrame
      title={copy.frameTitle}
      pageType="body"
      showHeader={false}
      showFooter
      firstPageBodyBackgroundSrc={PDF_CORE_NUMBER_FIRST_BG_PATH}
      linkDestinationId={linkDestinationId}
    >
      <View
        wrap={false}
        style={{
          position: "relative",
          minHeight: coreNumberIntroContentMinHeightPt(Boolean(themeText)),
          paddingLeft: 0,
          paddingRight: 0,
        }}
      >
        <View style={coreNumberIntroLabelBoxStyle()}>
          <Text {...labelTextProps} style={labelStyle}>
            {copy.label}
          </Text>
        </View>
        {subtitleText ? (
          <View style={coreNumberIntroSubtitleBoxStyle()}>
            <Text {...labelTextProps} style={subtitleStyle}>
              {subtitleText}
            </Text>
          </View>
        ) : null}
        {themeText ? (
          <View style={coreNumberIntroThemeBoxStyle()}>
            <Text {...labelTextProps} style={themeLineStyle}>
              {themeText}
            </Text>
          </View>
        ) : null}
      </View>
    </PdfPageFrame>
  );
}
