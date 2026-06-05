import React from "react";
import { Image, Page, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 0,
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
});

export function DiaryBookFullBleedPdfPage({ imageSrc }: { imageSrc: string }) {
  return (
    <Page size="A5" orientation="portrait" style={styles.page}>
      <Image cache={false} src={imageSrc} style={styles.image} />
    </Page>
  );
}
