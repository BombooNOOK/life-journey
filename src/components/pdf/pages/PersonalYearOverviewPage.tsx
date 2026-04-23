import type { Style } from "@react-pdf/types";
import { View } from "@react-pdf/renderer";

import { PdfLongFormBody } from "../PdfLongFormBody";
import { PdfText as Text } from "../PdfText";
import { PdfPageFrame } from "../PdfPageFrame";

import { buildPersonalYearNineYearRows } from "@/lib/numerology/personalYearMonth";

import type { BodyRenderOverrides } from "../pdfRenderConfig";
import { pdfStyles } from "../styles";

interface Props extends BodyRenderOverrides {
  birthMonth: number;
  birthDay: number;
  /** 省略時は PDF 生成時点の日付（サーバー上の「今」） */
  referenceDate?: Date;
}

const tableHeader = {
  flexDirection: "row" as const,
  alignItems: "center" as const,
  borderBottomWidth: 1,
  borderBottomColor: "#333",
  paddingBottom: 6,
  marginTop: 4,
};
const tableRow = {
  flexDirection: "row" as const,
  alignItems: "center" as const,
  paddingVertical: 5,
  borderBottomWidth: 1,
  borderBottomColor: "#e5e5e5",
};
const colYear = { width: 68 };
const colCycle = { width: 56 };
const colKeyword = { flex: 1 };
const tableHeadLeft = { fontSize: 10, marginBottom: 0, textAlign: "left" as const };
const tableHeadCenter = { fontSize: 10, marginBottom: 0, textAlign: "center" as const };
const tableCellLeft = { fontSize: 9, lineHeight: 1.52, textAlign: "left" as const };
const tableCellCenter = { fontSize: 9, lineHeight: 1.52, textAlign: "center" as const };

export function PersonalYearOverviewPage({
  birthMonth,
  birthDay,
  referenceDate,
  bodyStyle,
  bodyExpandWidth,
}: Props) {
  const now = referenceDate ?? new Date();
  const rows = buildPersonalYearNineYearRows(birthMonth, birthDay, now);
  const startY = rows[0]?.calendarYear ?? now.getFullYear();
  const endY = rows[rows.length - 1]?.calendarYear ?? startY;

  const overviewBodyStyle: Style[] = [
    pdfStyles.sectionBody,
    {
      fontFamily: "NotoSansJP",
      textAlign: "left" as const,
      fontSize: 9.5,
      lineHeight: 1.45,
    },
    ...(bodyStyle ? (Array.isArray(bodyStyle) ? bodyStyle : [bodyStyle]) : []),
  ];

  return (
    <PdfPageFrame title="パーソナルイヤー">
      <Text style={[pdfStyles.h1, { fontSize: 16, marginBottom: 10 }]}>パーソナルイヤー（9 年一覧）</Text>
      {/* PdfLongFormBody は「。」以外では改行しないため、指定位置の改行はここで明示 */}
      <View style={{ marginTop: 4 }}>
        <Text style={[...overviewBodyStyle, { marginTop: 4 }]}>
          パーソナルイヤーは、１から９までの流れが9年ごとにひと巡り
        </Text>
        <Text style={[...overviewBodyStyle, { marginTop: 3 }]}>するサイクルです。</Text>
      </View>
      <View style={{ marginBottom: 11 }}>
        <PdfLongFormBody
          text={`9の年を終えると、また1の年に戻り、新しい周期が始まります。

1月1日を区切りとして、その年の流れを読み解いていきます。`}
          marginTop={0}
          firstParagraphMarginTop={6}
          paragraphGap={4}
          majorBlockExtraGap={2}
          sentenceLineGap={2}
          continuationPageTopGap={0}
          bodyStyle={bodyStyle ? [bodyStyle, { fontSize: 9.5, lineHeight: 1.45 }] : { fontSize: 9.5, lineHeight: 1.45 }}
          expandWidth={bodyExpandWidth}
        />
      </View>
      <Text style={[pdfStyles.muted, { marginTop: 0 }]}>
        一覧の基準日: {`${now.toISOString().slice(0, 10)}（この日の西暦年から${startY}年〜${endY}年を表示）`}
      </Text>
      {/* 説明文末尾から約1行分空けたあと「あなたの周期」→表 */}
      <View wrap={false}>
        <Text style={[pdfStyles.h2, { marginTop: 16, marginBottom: 4 }]}>あなたの周期</Text>
        <View style={tableHeader}>
          <View style={colYear}>
            <Text style={[pdfStyles.sectionTitle, tableHeadLeft]}>年</Text>
          </View>
          <View style={[colCycle, { alignItems: "center", justifyContent: "center" }]}>
            <Text style={[pdfStyles.sectionTitle, { width: "100%" }, tableHeadCenter]}>周期番号</Text>
          </View>
          <View style={[colKeyword, { alignItems: "center", justifyContent: "center" }]}>
            <Text style={[pdfStyles.sectionTitle, { width: "100%" }, tableHeadCenter]}>テーマ</Text>
          </View>
        </View>
        {rows.map((r) => (
          <View key={r.calendarYear} style={tableRow}>
            <View style={colYear}>
              <Text style={[pdfStyles.sectionBody, tableCellLeft]}>{r.calendarYear}</Text>
            </View>
            <View style={[colCycle, { alignItems: "center", justifyContent: "center" }]}>
              <Text style={[pdfStyles.sectionBody, { width: "100%" }, tableCellCenter]}>{r.cycleNumber}</Text>
            </View>
            <View style={[colKeyword, { alignItems: "center", justifyContent: "center" }]}>
              <Text style={[pdfStyles.sectionBody, { width: "100%" }, tableCellCenter]}>{r.theme}</Text>
            </View>
          </View>
        ))}
      </View>
    </PdfPageFrame>
  );
}
