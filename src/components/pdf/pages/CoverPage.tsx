import { Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import { coverCopyEn } from "@/lib/numerology/pdfCoverCopy";

import {
  coverSubtitleBoxStyle,
  coverTitleBoxStyle,
  PDF_COVER_SUBTITLE_FONT_SIZE,
  PDF_COVER_TEXT_COLOR,
  PDF_COVER_TITLE_FONT_SIZE,
} from "../pdfCoverBleedLayout";
import { PDF_COVER_TEMPLATE_BG_PATH, resolvePdfAssetPath } from "../pdfAssetPaths";

const styles = StyleSheet.create({
  page: {
    padding: 0,
    margin: 0,
    backgroundColor: "#fff",
  },
  coverWrap: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  coverImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  coverTitle: {
    fontFamily: "LibreBaskerville",
    fontSize: PDF_COVER_TITLE_FONT_SIZE,
    fontWeight: 400,
    lineHeight: 1.08,
    letterSpacing: 0.3,
    color: PDF_COVER_TEXT_COLOR,
    textAlign: "center",
  },
  coverSubtitle: {
    fontFamily: "LibreBaskerville",
    fontSize: PDF_COVER_SUBTITLE_FONT_SIZE,
    fontWeight: 400,
    lineHeight: 1.2,
    letterSpacing: 0.2,
    color: PDF_COVER_TEXT_COLOR,
    textAlign: "center",
  },
});

/** 表紙（`cover-template-bg.png` + `cover01` / `cover02`） */
export function CoverPage() {
  return (
    <Page size="A5" style={styles.page}>
      <View style={styles.coverWrap}>
        <Image
          cache={false}
          src={resolvePdfAssetPath(PDF_COVER_TEMPLATE_BG_PATH)}
          style={styles.coverImage}
        />
        <View style={coverTitleBoxStyle()}>
          <Text style={styles.coverTitle}>{coverCopyEn.title}</Text>
        </View>
        <View style={coverSubtitleBoxStyle()}>
          <Text style={styles.coverSubtitle}>{coverCopyEn.subtitle}</Text>
        </View>
      </View>
    </Page>
  );
}
