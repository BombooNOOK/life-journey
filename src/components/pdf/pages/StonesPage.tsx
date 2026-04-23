import { Page, View } from "@react-pdf/renderer";

import { PdfLongFormBody } from "../PdfLongFormBody";
import { PdfText as Text } from "../PdfText";

import type { AppraisalStoneSelection } from "@/lib/stones/types";

import { pdfLongFormProseProps } from "../pdfLongFormSpacing";
import { pdfStyles } from "../styles";

interface Props {
  stones: AppraisalStoneSelection;
}

export function StonesPage({ stones }: Props) {
  return (
    <Page size="A4" style={pdfStyles.page}>
      <Text style={pdfStyles.h1}>守護石（鑑定書用・5コア）</Text>
      {stones.items.map((item) => (
        <View key={item.key} style={[pdfStyles.box, { marginBottom: 10 }]}>
          <Text style={{ fontSize: 12 }}>
            {item.label}: {item.number ?? "—"} / {item.color}
          </Text>
          <Text style={{ fontSize: 11, marginTop: 4 }}>
            採用石: {item.selected?.nameJa ?? "（未選定）"}
          </Text>
          <Text style={{ fontSize: 9, color: "#555", marginTop: 2 }}>
            キーワード: {item.keywords.join("・") || "—"}
          </Text>
          <Text style={{ fontSize: 9, color: "#666", marginTop: 2 }}>
            候補: {item.candidates.map((c) => c.nameJa).join("、") || "（候補なし）"}
          </Text>
          <Text style={{ fontSize: 9, color: "#444", marginTop: 2 }}>理由: {item.reason}</Text>
          {item.stonePdfBody ? (
            <View style={{ marginTop: 8 }}>
              <Text style={{ fontSize: 10, fontFamily: "NotoSansJP" }}>石の特徴（鑑定書用 PDF 本文）</Text>
              <PdfLongFormBody
                text={item.stonePdfBody.featureText}
                marginTop={4}
                {...pdfLongFormProseProps}
                firstParagraphMarginTop={0}
                bodyStyle={{ fontSize: 9 }}
              />
              <Text style={{ fontSize: 10, fontFamily: "NotoSansJP", marginTop: 8 }}>
                石のパワー（鑑定書用 PDF 本文）
              </Text>
              <PdfLongFormBody
                text={item.stonePdfBody.powerText}
                marginTop={4}
                {...pdfLongFormProseProps}
                firstParagraphMarginTop={0}
                bodyStyle={{ fontSize: 9 }}
              />
            </View>
          ) : null}
        </View>
      ))}
    </Page>
  );
}
