import { View } from "@react-pdf/renderer";

import { PdfLongFormBody } from "../PdfLongFormBody";
import { PdfText as Text } from "../PdfText";
import { PdfPageFrame } from "../PdfPageFrame";

import { buildPersonalMonthThreeMonthRows } from "@/lib/numerology/personalYearMonth";

import { pdfLongFormProseProps } from "../pdfLongFormSpacing";
import { pdfStyles } from "../styles";

interface Props {
  birthMonth: number;
  birthDay: number;
  purchaseDate: Date;
}

const tableHeader = {
  flexDirection: "row" as const,
  borderBottomWidth: 1,
  borderBottomColor: "#333",
  paddingBottom: 6,
  marginTop: 12,
};
const tableRow = {
  flexDirection: "row" as const,
  paddingVertical: 6,
  borderBottomWidth: 1,
  borderBottomColor: "#e5e5e5",
};
const colYm = { width: 88 };
const colNo = { width: 64 };
const colTheme = { width: 86 };
const colSubtitle = { flex: 1 };

export function PersonalMonthBonusPage({ birthMonth, birthDay, purchaseDate }: Props) {
  const rows = buildPersonalMonthThreeMonthRows(birthMonth, birthDay, purchaseDate);
  const startYearMonth = `${purchaseDate.getFullYear()}年${purchaseDate.getMonth() + 1}月`;

  return (
    <PdfPageFrame title="おまけのページ">
      <Text style={pdfStyles.h1}>今日から3ヶ月の流れ</Text>
      <PdfLongFormBody
        text={`起点月は注文作成月（${startYearMonth}）です。起点月を含む3か月分を表示します。`}
        marginTop={6}
        {...pdfLongFormProseProps}
      />

      <View style={tableHeader}>
        <Text style={[pdfStyles.sectionTitle, colYm, { textAlign: "left" }]}>年月</Text>
        <Text style={[pdfStyles.sectionTitle, colNo, { textAlign: "left" }]}>周期番号</Text>
        <Text style={[pdfStyles.sectionTitle, colTheme, { textAlign: "left" }]}>テーマ</Text>
        <Text style={[pdfStyles.sectionTitle, colSubtitle, { textAlign: "center" }]}>過ごし方</Text>
      </View>

      {rows.map((row) => (
        <View
          key={`${row.calendarYear}-${row.calendarMonth}`}
          style={tableRow}
          wrap={false}
        >
          <Text style={[pdfStyles.sectionBody, colYm]}>
            {row.calendarYear}年{row.calendarMonth}月
          </Text>
          <Text style={[pdfStyles.sectionBody, colNo]}>{row.personalMonthNumber}</Text>
          <Text style={[pdfStyles.sectionBody, colTheme]}>
            {row.theme.split("・").join("\n")}
          </Text>
          <Text style={[pdfStyles.sectionBody, colSubtitle]}>
            {row.subtitle.replace(/\n/g, " ")}
          </Text>
        </View>
      ))}
    </PdfPageFrame>
  );
}
