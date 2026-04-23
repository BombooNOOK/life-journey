import { Fragment } from "react";
import { View } from "@react-pdf/renderer";

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

function splitSubtitleForHeading(raw: string): string[] {
  const normalized = raw.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  // 原稿側で改行指定がある場合はそれを最優先
  if (normalized.includes("\n")) {
    return normalized
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  // 1行が長くなりそうな場合は、読点や空白で自然に分割
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

function splitArticleIntoReadableLines(raw: string): string[][] {
  const normalized = raw.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const paragraphs = normalized
    .split(/\n\s*\n+/)
    .map((p) => p.replace(/\n/g, " ").replace(/[ \t\u00a0]+/g, " ").trim())
    .filter(Boolean);

  const MAX_LINE_LEN = 36;
  const MIN_HEAD_LEN = 10;

  const pickNaturalBreakIndex = (text: string, min: number, max: number): number => {
    const markers = [
      "かもしれません",
      "でしょう",
      "として",
      "ことが",
      "ことを",
      "ために",
      "ながら",
      "ので",
      "から",
      "こと",
      "ため",
      "もの",
    ];

    let best = -1;
    for (const marker of markers) {
      let from = 0;
      while (true) {
        const i = text.indexOf(marker, from);
        if (i < 0) break;
        const end = i + marker.length;
        if (end >= min && end <= max) best = Math.max(best, end);
        from = i + 1;
      }
    }
    return best >= 0 ? best : max;
  };

  const splitSentence = (sentence: string): string[] => {
    const out: string[] = [];
    let rest = sentence.trim();

    while (rest.length > MAX_LINE_LEN) {
      const commaPositions: number[] = [];
      for (let i = 0; i < rest.length; i += 1) {
        if (rest[i] === "、") commaPositions.push(i);
      }

      // 1行に収まる範囲で、できるだけ後ろの読点まで含める
      const commaCut = commaPositions
        .filter((i) => i + 1 >= MIN_HEAD_LEN && i + 1 <= MAX_LINE_LEN)
        .reduce((acc, i) => Math.max(acc, i + 1), -1);

      const cutIdx =
        commaCut > 0
          ? commaCut
          : pickNaturalBreakIndex(rest, MIN_HEAD_LEN, Math.min(MAX_LINE_LEN, rest.length - 1));

      out.push(rest.slice(0, cutIdx).trim());
      rest = rest.slice(cutIdx).trim();
    }

    if (rest) out.push(rest);

    // 末尾が「。」のみ等の極端に短い行は前行へ戻し、孤立改行を防ぐ
    if (out.length >= 2) {
      const last = out[out.length - 1];
      if (last.length <= 2) {
        out[out.length - 2] = `${out[out.length - 2]}${last}`;
        out.pop();
      }
    }
    return out;
  };

  return paragraphs.map((p) =>
    p
      .split(/(?<=。)/)
      .map((s) => s.trim())
      .filter(Boolean)
      .flatMap((sentence) => splitSentence(sentence)),
  );
}

function YearDetailPage({
  row,
  bodyStyle,
  bodyExpandWidth,
}: { row: PersonalYearTableRow } & BodyRenderOverrides) {
  const subtitleLines = splitSubtitleForHeading(row.subtitle);
  const shortYear = String(row.calendarYear).slice(-2);
  const articleBlocks = splitArticleIntoReadableLines(row.article);

  return (
    <PdfPageFrame title={`パーソナルイヤー 周期${row.cycleNumber}`}>
      <Text style={pdfStyles.h1}>あなたの20{shortYear}年</Text>

      {subtitleLines.length > 0 ? (
        <Text style={[pdfStyles.h2, { marginTop: 14 }]}>
          {subtitleLines.map((line, idx) => (
            <Fragment key={`${row.calendarYear}-subtitle-${idx}`}>
              {idx > 0 ? "\n" : ""}
              {line}
            </Fragment>
          ))}
        </Text>
      ) : null}

      <View style={{ marginTop: 8, marginHorizontal: bodyExpandWidth ? -bodyExpandWidth : 0 }}>
        {articleBlocks.map((block, bi) => (
          <View key={`${row.calendarYear}-article-block-${bi}`} style={{ marginTop: bi === 0 ? 0 : 10 }}>
            {block.map((line, li) => (
              <Text
                key={`${row.calendarYear}-article-line-${bi}-${li}`}
                style={[
                  pdfStyles.sectionBody,
                  { fontFamily: "NotoSansJP", textAlign: "left", marginTop: li === 0 ? 0 : 2 },
                  ...(bodyStyle ? (Array.isArray(bodyStyle) ? bodyStyle : [bodyStyle]) : []),
                ]}
              >
                {line}
              </Text>
            ))}
          </View>
        ))}
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
