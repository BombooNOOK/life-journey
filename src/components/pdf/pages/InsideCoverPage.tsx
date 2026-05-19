import { Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import { coverCopyEn } from "@/lib/numerology/pdfCoverCopy";
import {
  formatInsideCoverBornLine,
  formatInsideCoverForName,
} from "@/lib/pdf/pdfInsideCoverRecipientCopy";

import type { CustomerFormValues } from "@/lib/order/types";

import { getPdfPageNumberOffset } from "../pdfPageNumberOffset";
import {
  insideCoverRecipientBoxStyle,
  insideCoverTextBoxStyle,
  PDF_INSIDE_COVER_RECIPIENT_FONT_SIZE,
  PDF_INSIDE_COVER_TEXT_COLOR,
  PDF_INSIDE_COVER_TEXT_FONT_SIZE,
} from "../pdfInsideCoverBleedLayout";
import { PDF_INSIDE_COVER_PAGE_BG_PATH, resolvePdfAssetPath } from "../pdfAssetPaths";
import { pdfStyles } from "../styles";

const styles = StyleSheet.create({
  page: {
    padding: 0,
    margin: 0,
    backgroundColor: "#fff",
  },
  bleedWrap: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  bleedImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  bookTitle: {
    fontFamily: "LibreBaskerville",
    fontSize: PDF_INSIDE_COVER_TEXT_FONT_SIZE,
    fontWeight: 400,
    lineHeight: 1.15,
    letterSpacing: 0.2,
    color: PDF_INSIDE_COVER_TEXT_COLOR,
    textAlign: "center",
  },
  recipientLine: {
    fontFamily: "LibreBaskerville",
    fontSize: PDF_INSIDE_COVER_RECIPIENT_FONT_SIZE,
    fontWeight: 400,
    lineHeight: 1.45,
    letterSpacing: 0.15,
    color: PDF_INSIDE_COVER_TEXT_COLOR,
    textAlign: "center",
  },
});

const labelTextProps = {
  wrap: false as const,
  orphans: 0,
  widows: 0,
  minPresenceAhead: 0,
};

function readerPageLabel(pageNumber: number): string {
  const offset = getPdfPageNumberOffset();
  const pn = typeof pageNumber === "number" && pageNumber > 0 ? pageNumber + offset : 1 + offset;
  return String(Math.max(1, pn - 1));
}

type Props = {
  customer: Pick<
    CustomerFormValues,
    | "lastNameKana"
    | "firstNameKana"
    | "firstNameRoman"
    | "lastNameRoman"
    | "fullNameRomanDisplay"
    | "fullNameDisplay"
    | "fullNameKanaDisplay"
    | "birthYear"
    | "birthMonth"
    | "birthDay"
    | "birthDate"
  >;
};

/**
 * 表紙の次の中表紙（`inside-cover-page-bg.png` + 生成テキスト・ページ番号あり）。
 */
export function InsideCoverPage({ customer }: Props) {
  const forNameLine = formatInsideCoverForName(customer);
  const bornLine = formatInsideCoverBornLine(customer);

  return (
    <Page size="A5" style={styles.page}>
      <View style={styles.bleedWrap}>
        <Image
          cache={false}
          src={resolvePdfAssetPath(PDF_INSIDE_COVER_PAGE_BG_PATH)}
          style={styles.bleedImage}
        />
        <View style={insideCoverTextBoxStyle()}>
          <Text {...labelTextProps} style={styles.bookTitle}>
            {coverCopyEn.subtitle}
          </Text>
        </View>
        {forNameLine || bornLine ? (
          <View style={insideCoverRecipientBoxStyle()}>
            {forNameLine ? (
              <Text {...labelTextProps} style={[styles.recipientLine, { marginTop: 6 }]}>
                {forNameLine}
              </Text>
            ) : null}
            {bornLine ? (
              <Text
                {...labelTextProps}
                style={[styles.recipientLine, { marginTop: forNameLine ? 4 : 6 }]}
              >
                {bornLine}
              </Text>
            ) : null}
          </View>
        ) : null}
        <Text
          fixed
          style={pdfStyles.pageNumberOverlayFullBleed}
          render={({ pageNumber }) => readerPageLabel(pageNumber)}
        />
      </View>
    </Page>
  );
}
