import { Image, Page, StyleSheet, View } from "@react-pdf/renderer";

import { PDF_COVER_IMAGE_PATH, resolvePdfAssetPath } from "../pdfAssetPaths";

const styles = StyleSheet.create({
  page: {
    padding: 0,
    margin: 0,
    backgroundColor: "#fff",
  },
  coverWrap: {
    width: "100%",
    height: "100%",
  },
  coverImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
});

export function CoverPage() {
  return (
    <Page size="A5" style={styles.page}>
      <View style={styles.coverWrap}>
        <Image cache={false} src={resolvePdfAssetPath(PDF_COVER_IMAGE_PATH)} style={styles.coverImage} />
      </View>
    </Page>
  );
}
