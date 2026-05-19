import { Text as RawText, View } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";

import { parseManuscriptLineMarkup } from "@/lib/pdf/pdfManuscriptMarkup";

import { PDF_GUIDE_BODY_NO_WRAP_MIN_WIDTH_PT } from "./pdfGuideBleedLayout";
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

export type ManuscriptLineNode = { kind: "text"; content: string } | { kind: "blank" };

/**
 * 原稿の改行・空行をそのまま保持する（単独改行を空白に潰さない）。
 * `split('\n')` で得た空要素＝空行。
 */
export function splitBodyIntoManuscriptLineNodes(raw: string): ManuscriptLineNode[] {
  const t = raw.replace(/\r\n/g, "\n");
  return t.split("\n").map((segment) => (segment === "" ? { kind: "blank" as const } : { kind: "text" as const, content: segment }));
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
  /** true のときは readableSentenceWrap を無視し、原稿の改行・空行をそのまま描画する */
  preserveManuscriptLineBreaks?: boolean;
  /** `preserveManuscriptLineBreaks` 時の空行の高さ（pt）。未指定は 19 */
  manuscriptBlankLineHeight?: number;
  /** 原稿1行を折り返さない（長い1行を句読点どおりに維持） */
  disableWrap?: boolean;
  noWrapMinChars?: number;
  noWrapMinWidthPt?: number;
};

const DEFAULT_SENTENCE_LINE_GAP = 3;
/** preserve 時の空行相当の高さ（sectionBody 10pt × lineHeight 1.9 に近い） */
const MANUSCRIPT_BLANK_LINE_HEIGHT = 19;

function manuscriptLineTextStyle(bodyStyle: Style | Style[] | undefined, italic: boolean): Style[] {
  const base = bodyStyle == null ? [pdfStyles.sectionBody] : Array.isArray(bodyStyle) ? bodyStyle : [bodyStyle];
  if (!italic) return base;
  return [...base, pdfStyles.numberGuideBleedBodyItalic];
}

function ManuscriptLineText({
  line,
  bodyStyle,
  disableWrap,
  noWrapMinChars = 22,
  noWrapMinWidthPt = PDF_GUIDE_BODY_NO_WRAP_MIN_WIDTH_PT,
}: {
  line: string;
  bodyStyle?: Style | Style[];
  disableWrap?: boolean;
  /** `disableWrap` 時に1行幅を確保する最小文字数 */
  noWrapMinChars?: number;
  noWrapMinWidthPt?: number;
}) {
  const segments = parseManuscriptLineMarkup(line);
  const useNoWrap = Boolean(disableWrap && line.length >= noWrapMinChars);
  const lineStyle: Style[] = [
    ...manuscriptLineTextStyle(bodyStyle, false),
    defaultJapaneseBodyFont,
    leftAlignedBody,
  ];

  const textNode =
    segments.length === 1 && !segments[0].italic ? (
      <RawText wrap={!useNoWrap} style={lineStyle}>
        {segments[0].text}
      </RawText>
    ) : (
      <RawText wrap={!useNoWrap} style={lineStyle}>
        {segments.map((seg, si) =>
          seg.italic ? (
            <RawText key={si} style={manuscriptLineTextStyle(bodyStyle, true)}>
              {seg.text}
            </RawText>
          ) : (
            <RawText key={si}>{seg.text}</RawText>
          ),
        )}
      </RawText>
    );

  if (!useNoWrap) return textNode;

  return (
    <View
      wrap={false}
      style={{
        width: noWrapMinWidthPt,
        minWidth: noWrapMinWidthPt,
        flexShrink: 0,
      }}
    >
      {textNode}
    </View>
  );
}

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
  preserveManuscriptLineBreaks = false,
  manuscriptBlankLineHeight,
  disableWrap = false,
  noWrapMinChars,
  noWrapMinWidthPt,
}: Props) {
  if (preserveManuscriptLineBreaks) {
    const blankLineHeight = manuscriptBlankLineHeight ?? MANUSCRIPT_BLANK_LINE_HEIGHT;
    const nodes = splitBodyIntoManuscriptLineNodes(text);
    const hasRenderable = nodes.some((n) => n.kind === "text");
    if (!hasRenderable) return null;

    const continuationSpacer =
      continuationPageTopGap > 0 ? (
        <View
          render={(props: { subPageNumber?: number }) => {
            const sn = props.subPageNumber ?? 1;
            return <View style={{ height: sn > 1 ? continuationPageTopGap : 0 }} />;
          }}
        />
      ) : null;

    let prev: "start" | "text" | "blank" = "start";

    return (
      <View style={{ marginTop, marginHorizontal: expandWidth !== 0 ? -Math.abs(expandWidth) : 0 }}>
        {continuationSpacer}
        {nodes.map((node, i) => {
          if (node.kind === "blank") {
            prev = "blank";
            return <View key={i} style={{ height: blankLineHeight }} />;
          }
          const marginTopForLine =
            prev === "start"
              ? firstParagraphMarginTop
              : prev === "blank"
                ? paragraphGap
                : sentenceLineGap;
          prev = "text";
          const useNoWrap = Boolean(disableWrap && node.content.length >= (noWrapMinChars ?? 22));
          return (
            <View
              key={i}
              wrap={useNoWrap ? false : undefined}
              style={{ marginTop: marginTopForLine, flexShrink: useNoWrap ? 0 : undefined }}
            >
              <ManuscriptLineText
                line={node.content}
                bodyStyle={bodyStyle}
                disableWrap={disableWrap}
                noWrapMinChars={noWrapMinChars}
                noWrapMinWidthPt={noWrapMinWidthPt}
              />
            </View>
          );
        })}
      </View>
    );
  }

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
