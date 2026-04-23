import { View } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";

import { PdfText as Text } from "./PdfText";
import { pdfStyles } from "./styles";

const leftAlignedBody = { textAlign: "left" as const };
const defaultJapaneseBodyFont = { fontFamily: "NotoSansJP" as const };

/** 「。」の直後で行を分ける（読みやすさ用）。句点が無い塊はそのまま1行。 */
const SENTENCE_SPLIT = /(?<=。)/;

/**
 * 原稿内の空行（\\n\\n）で段落分割。単独の改行は同一段落内の空白にまとめる（Excel 由来の手動改行対策）。
 * すべての長文本文はこの経路で描画し、段落単位の Text に分けて行末ハイフンを抑える。
 */
export function splitBodyIntoParagraphs(raw: string): string[] {
  const t = raw.replace(/\r\n/g, "\n").trim();
  if (!t) return [];
  return t
    .split(/\n\s*\n+/)
    .map((p) => p.replace(/\n/g, " ").replace(/[ \t\u00a0]+/g, " ").trim())
    .filter(Boolean);
}

/**
 * 大きな段落（空行区切り）ごとにブロックを分け、各ブロック内は「。」のあとで必ず次の行へ。
 * 空行区切り＝話題の切り替えなので、ブロック間は sentence 行より広い余白を付ける。
 */
export function splitBodyIntoMajorBlocksAndSentenceLines(raw: string): string[][] {
  const t = raw.replace(/\r\n/g, "\n").trim();
  if (!t) return [];
  const majors = t
    .split(/\n\s*\n+/)
    .map((p) => p.replace(/\n/g, " ").replace(/[ \t\u00a0]+/g, " ").trim())
    .filter(Boolean);

  return majors.map((block) => {
    const chunks = block.split(SENTENCE_SPLIT).map((s) => s.trim()).filter(Boolean);
    return chunks.length > 0 ? chunks : [block];
  });
}

function splitSentenceWithReadableWrap(sentence: string, maxLineLen: number, minHeadLen: number): string[] {
  const pickNaturalBreakIndex = (text: string, min: number, max: number): number => {
    const markers = [
      "かもしれません",
      "でしょう",
      "として",
      "ことが",
      "ことを",
      "ために",
      "ながら",
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

  const out: string[] = [];
  let rest = sentence.trim();

  while (rest.length > maxLineLen) {
    const commaPositions: number[] = [];
    for (let i = 0; i < rest.length; i += 1) {
      if (rest[i] === "、") commaPositions.push(i);
    }

    const commaCut = commaPositions
      .filter((i) => i + 1 >= minHeadLen && i + 1 <= maxLineLen)
      .reduce((acc, i) => Math.max(acc, i + 1), -1);

    const cutIdx =
      commaCut > 0
        ? commaCut
        : pickNaturalBreakIndex(rest, minHeadLen, Math.min(maxLineLen, rest.length - 1));

    out.push(rest.slice(0, cutIdx).trim());
    rest = rest.slice(cutIdx).trim();
  }

  if (rest) out.push(rest);
  if (out.length >= 2 && out[out.length - 1].length <= 4) {
    out[out.length - 2] = `${out[out.length - 2]}${out[out.length - 1]}`;
    out.pop();
  }

  return out;
}

function splitBodyIntoReadableSentenceLines(raw: string): string[][] {
  const t = raw.replace(/\r\n/g, "\n").trim();
  if (!t) return [];
  const majors = t
    .split(/\n\s*\n+/)
    .map((p) => p.replace(/\n/g, " ").replace(/[ \t\u00a0]+/g, " ").trim())
    .filter(Boolean);

  const MAX_LINE_LEN = 36;
  const MIN_HEAD_LEN = 10;

  return majors.map((block) =>
    block
      .split(SENTENCE_SPLIT)
      .map((s) => s.trim())
      .filter(Boolean)
      .flatMap((sentence) => splitSentenceWithReadableWrap(sentence, MAX_LINE_LEN, MIN_HEAD_LEN)),
  );
}

type Props = {
  text: string;
  /** ブロック全体の上余白 */
  marginTop?: number;
  /** 先頭段落の上余白（2 段落目以降は paragraphGap） */
  firstParagraphMarginTop?: number;
  /** 空行で区切られた「大きな段落」とのあいだの余白（話題が変わるところ） */
  paragraphGap?: number;
  /**
   * 2 つ目以降の大ブロックの先頭に追加する余白（原稿の空行区切り＝文脈の切り替えを、さらに1行分ゆったり見せる用）
   */
  majorBlockExtraGap?: number;
  /** 同じブロック内で「。」のあとに続く行とのあいだの余白 */
  sentenceLineGap?: number;
  /**
   * 同じ `<Page>` が複数枚に分割されるとき、2 枚目以降の先頭だけに足す上余白（pt）。
   * ライフパス「基本」の続きページなど、1 枚目はイラスト付きで下げているが続きだけ窮屈に見える場合に使う。
   */
  continuationPageTopGap?: number;
  bodyStyle?: Style | Style[];
  expandWidth?: number;
  /** 「。」で必ず区切り、長文のみ自然な位置（主に「、」）で追加改行 */
  readableSentenceWrap?: boolean;
};

const DEFAULT_SENTENCE_LINE_GAP = 3;

export function PdfLongFormBody({
  text,
  marginTop = 0,
  firstParagraphMarginTop = 0,
  paragraphGap = 12,
  majorBlockExtraGap = 10,
  sentenceLineGap = DEFAULT_SENTENCE_LINE_GAP,
  continuationPageTopGap = 0,
  bodyStyle,
  expandWidth = 2,
  readableSentenceWrap = false,
}: Props) {
  const majorBlocks = readableSentenceWrap
    ? splitBodyIntoReadableSentenceLines(text)
    : splitBodyIntoMajorBlocksAndSentenceLines(text);
  if (majorBlocks.length === 0) return null;

  const continuationSpacer =
    continuationPageTopGap > 0 ? (
      <View
        render={(props: { subPageNumber?: number }) => {
          const sn = props.subPageNumber ?? 1;
          return <View style={{ height: sn > 1 ? continuationPageTopGap : 0 }} />;
        }}
      />
    ) : null;

  return (
    <View style={{ marginTop, marginHorizontal: expandWidth > 0 ? -expandWidth : 0 }}>
      {continuationSpacer}
      {majorBlocks.map((lines, bi) => (
        <View
          key={bi}
          style={{
            marginTop:
              bi === 0
                ? firstParagraphMarginTop
                : paragraphGap + majorBlockExtraGap,
          }}
        >
          {lines.map((line, li) => (
            <Text
              key={`${bi}-${li}`}
              style={[
                pdfStyles.sectionBody,
                defaultJapaneseBodyFont,
                leftAlignedBody,
                ...(bodyStyle == null ? [] : Array.isArray(bodyStyle) ? bodyStyle : [bodyStyle]),
                { marginTop: li === 0 ? 0 : sentenceLineGap },
              ]}
            >
              {line}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}
