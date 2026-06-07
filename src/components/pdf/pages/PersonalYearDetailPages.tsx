import { Fragment } from "react";
import { View } from "@react-pdf/renderer";

import { PdfLongFormBody } from "../PdfLongFormBody";
import { PdfText as Text } from "../PdfText";
import { PdfPageFrame } from "../PdfPageFrame";

import {
  buildPersonalYearNineYearRows,
  type PersonalYearTableRow,
} from "@/lib/numerology/personalYearMonth";

import type { BodyRenderOverrides } from "../pdfRenderConfig";
import { pdfStyles } from "../styles";

interface Props extends BodyRenderOverrides {
  birthMonth: number;
  birthDay: number;
  /** 一覧ページと同じ基準日にする（省略時は PDF 生成時点の「今」） */
  referenceDate?: Date;
}

/** 他コア本文と同じ `sectionBody` 系（空白ページ対策で 10pt/1.45 にした名残を戻す） */
const PY_DETAIL_BODY_STYLE = {
  ...pdfStyles.sectionBody,
  fontFamily: "NotoSansJP" as const,
  textAlign: "left" as const,
};

function splitSubtitleForHeading(raw: string): string[] {
  const normalized = raw.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  if (normalized.includes("\n")) {
    return normalized
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  const commaIdx = normalized.indexOf("、");
  if (commaIdx >= 2 && commaIdx < normalized.length - 2) {
    return [normalized.slice(0, commaIdx + 1).trim(), normalized.slice(commaIdx + 1).trim()];
  }

  const spaceIdx = normalized.indexOf(" ");
  if (spaceIdx >= 2 && spaceIdx < normalized.length - 2) {
    return [normalized.slice(0, spaceIdx).trim(), normalized.slice(spaceIdx + 1).trim()];
  }

  return [normalized];
}

export function YearDetailPage({
  row,
  bodyStyle,
  bodyExpandWidth,
}: { row: PersonalYearTableRow } & BodyRenderOverrides) {
  const subtitleLines = splitSubtitleForHeading(row.subtitle);
  const shortYear = String(row.calendarYear).slice(-2);
  const articleBodyStyle = [
    PY_DETAIL_BODY_STYLE,
    ...(bodyStyle ? (Array.isArray(bodyStyle) ? bodyStyle : [bodyStyle]) : []),
  ];

  return (
    <PdfPageFrame title={`パーソナルイヤー 周期${row.cycleNumber}`}>
      <Text style={pdfStyles.h1}>あなたの20{shortYear}年</Text>

      {subtitleLines.length > 0 ? (
        <Text style={[pdfStyles.h2, { marginTop: 10 }]}>
          {subtitleLines.map((line, idx) => (
            <Fragment key={`${row.calendarYear}-subtitle-${idx}`}>
              {idx > 0 ? "\n" : ""}
              {line}
            </Fragment>
          ))}
        </Text>
      ) : null}

      <View
        style={{
          marginTop: 6,
          marginHorizontal: bodyExpandWidth ? -bodyExpandWidth : 0,
        }}
      >
        <PdfLongFormBody
          text={row.article}
          fixedWidthCharsPerLine={34}
          fixedWidthPreserveDoubleNewlineBlocks
          firstParagraphMarginTop={6}
          paragraphGap={10}
          majorBlockExtraGap={6}
          sentenceLineGap={4}
          continuationPageTopGap={28}
          bodyStyle={articleBodyStyle}
          expandWidth={bodyExpandWidth}
        />
      </View>
    </PdfPageFrame>
  );
}

/**
 * `buildPersonalYearNineYearRows` と同じ 9 行について、年ごとに 1 ページずつ出力する。
 */
export function PersonalYearDetailPages({
  birthMonth,
  birthDay,
  referenceDate,
  bodyStyle,
  bodyExpandWidth,
}: Props) {
  const now = referenceDate ?? new Date();
  const rows = buildPersonalYearNineYearRows(birthMonth, birthDay, now);
  return (
    <Fragment>
      {rows.map((row) => (
        <YearDetailPage
          key={row.calendarYear}
          row={row}
          bodyStyle={bodyStyle}
          bodyExpandWidth={bodyExpandWidth}
        />
      ))}
    </Fragment>
  );
}
