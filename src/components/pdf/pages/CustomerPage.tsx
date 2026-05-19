import { View } from "@react-pdf/renderer";

import { PdfText as Text } from "../PdfText";
import { PdfPageFrame } from "../PdfPageFrame";
import { TocEntryText } from "../TocEntryText";

import { PDF_TOC_ENTRIES } from "@/lib/pdf/pdfTocEntries";

import { PDF_CORE_RESULT_CONTINUATION_BACKGROUND_PATH } from "../pdfAssetPaths";
import { pdfStyles } from "../styles";

/**
 * 目次右列の数字は、ページ番号オーバーレイと同じ基準（物理ページ番号から表紙を除いた読者向け番号）。
 * PDF のページ順を変えたら `pdfTocEntries` も更新すること。
 * 受取人名・生年月日は中表紙（`InsideCoverPage`）のみ。帯ヘッダーは出さない。
 */
export function CustomerPage() {
  const tocItemSmall = {
    fontSize: 8.8,
    lineHeight: 1.35,
    ...pdfStyles.tocLineAlign,
  } as const;
  /** 章見出し（第1章〜）。項目行の `mt2` は当てない（`marginTop: 8` を維持） */
  const tocSectionTitle = {
    marginTop: 8,
    marginBottom: 4,
    fontSize: 10,
    fontWeight: 700 as const,
    lineHeight: 1.35,
    color: "#222",
    ...pdfStyles.tocLineAlign,
  } as const;
  const mt2 = { marginTop: 2 } as const;

  return (
    <PdfPageFrame
      showHeader={false}
      firstPageBodyBackgroundSrc={PDF_CORE_RESULT_CONTINUATION_BACKGROUND_PATH}
    >
      <Text style={[pdfStyles.h1, { fontSize: 18, marginBottom: 8 }]}>目次</Text>
      <View style={pdfStyles.tocBodyWrap}>
        <View style={pdfStyles.tocBodyColumn}>
          {PDF_TOC_ENTRIES.map((entry, index) => {
            if (entry.kind === "section") {
              return (
                <TocEntryText
                  key={entry.destinationId}
                  destinationId={entry.destinationId}
                  style={[pdfStyles.sectionTitle, tocSectionTitle]}
                >
                  {entry.label}
                </TocEntryText>
              );
            }
            return (
              <TocEntryText
                key={entry.destinationId}
                destinationId={entry.destinationId}
                style={[pdfStyles.softLead, tocItemSmall, ...(index === 0 ? [] : [mt2])]}
              >
                {`・${entry.label}  …… ${entry.page}`}
              </TocEntryText>
            );
          })}
        </View>
      </View>
    </PdfPageFrame>
  );
}
