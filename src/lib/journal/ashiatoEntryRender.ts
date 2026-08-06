/**
 * あしあと本文ページ描画用：テンプレID → 背景・枠・%配置の解決
 */

import {
  ashiatoPageTemplateBackgroundPath,
  ashiatoPageTemplateBodyPathForCompanion,
  ashiatoPageTemplatePhotoOverlayPath,
  ashiatoPageTemplatePreviewPath,
  getAshiatoPageTemplate,
  normalizeAshiatoPageTemplateId,
  type AshiatoPageTemplateContentKey,
  type AshiatoPageTemplateId,
} from "@/lib/journal/ashiatoPageTemplates";
import {
  ASHIATO_PAGE_TEMPLATE_LAYOUT_SIZE_PX,
  getAshiatoPageTemplateLayout,
  type AshiatoBodyWritingMode,
  type AshiatoDateLayoutMode,
  type AshiatoHorizontalBodyTextLayout,
  type AshiatoLayoutPercentRect,
  type AshiatoLayoutSlotId,
  type AshiatoSlashYmdWeekdayDateParts,
  type AshiatoVerticalBodyTextLayout,
} from "@/lib/journal/ashiatoPageTemplateLayout";
import { getDiaryBookEntryV2BodyFontLayout } from "@/lib/journal/diaryBookEntryBodyFontLayout";
import {
  journalEntryLayoutLengthFlag,
  normalizeContentFontMode,
  type JournalContentLengthFlag,
} from "@/lib/journal/contentFontMode";
import {
  isJapaneseLineEndPullbackChar,
  isJapaneseLineStartPullbackChar,
  splitFixedWidthJapaneseLines,
} from "@/lib/pdf/splitFixedWidthJapaneseLines";
import { getDiaryPreviewDateRowSegments } from "@/lib/journal/diaryPreviewFixedLayout";
import { stripTagsFromContent } from "@/lib/journal/diaryTags";

/** 横書き本文枠の左右 padding（preview 4px / PDF ≈0.55% ≈4px）。字数計算から差し引く */
export const ASHIATO_HORIZONTAL_BODY_INLINE_PAD_PX = 4;
/** 横書き本文枠の上下 padding（preview と同じ）。行数計算から差し引く */
export const ASHIATO_HORIZONTAL_BODY_BLOCK_PAD_PX = 4;
export type AshiatoPxRect = {
  leftPx: number;
  topPx: number;
  widthPx: number;
  heightPx: number;
};

export function ashiatoPercentRectToPx(
  rect: AshiatoLayoutPercentRect,
  size = ASHIATO_PAGE_TEMPLATE_LAYOUT_SIZE_PX,
): AshiatoPxRect {
  return {
    leftPx: (rect.left / 100) * size.widthPx,
    topPx: (rect.top / 100) * size.heightPx,
    widthPx: (rect.width / 100) * size.widthPx,
    heightPx: (rect.height / 100) * size.heightPx,
  };
}

export function resolveAshiatoDateLayoutMode(
  bodyWritingMode: AshiatoBodyWritingMode,
  dateLayout?: AshiatoDateLayoutMode,
): AshiatoDateLayoutMode {
  if (dateLayout) return dateLayout;
  return bodyWritingMode === "vertical" ? "vertical" : "plain";
}

export type AshiatoEntryRenderPlan = {
  templateId: AshiatoPageTemplateId;
  design: typeof ASHIATO_PAGE_TEMPLATE_LAYOUT_SIZE_PX;
  bodyWritingMode: AshiatoBodyWritingMode;
  dateLayout: AshiatoDateLayoutMode;
  dateParts: AshiatoSlashYmdWeekdayDateParts | null;
  bodyTextLayout: AshiatoHorizontalBodyTextLayout | null;
  verticalBodyTextLayout: AshiatoVerticalBodyTextLayout | null;
  photoRotateDeg: number;
  photoBorderRadiusPx: number;
  backgroundSrc: string;
  photoOverlaySrc: string | null;
  includes: readonly AshiatoPageTemplateContentKey[];
  excludes: readonly AshiatoPageTemplateContentKey[];
  slotsPercent: Partial<Record<AshiatoLayoutSlotId, AshiatoLayoutPercentRect>>;
  slotsPx: Partial<Record<AshiatoLayoutSlotId, AshiatoPxRect>>;
};

export function resolveAshiatoEntryRenderPlan(params: {
  pageTemplate?: string | null;
  companionType?: string | null;
  /** レイヤー型：preview（背景+枠合成）を背景に使い、枠は重ねない */
  preferLayeredPreviewComposite?: boolean;
}): AshiatoEntryRenderPlan {
  const templateId = normalizeAshiatoPageTemplateId(params.pageTemplate);
  const def = getAshiatoPageTemplate(templateId);
  const layout = getAshiatoPageTemplateLayout(templateId);
  const companionType = params.companionType?.trim() || "owl";
  const useLayeredComposite =
    params.preferLayeredPreviewComposite === true && def.files.kind === "layered";

  const backgroundSrc = useLayeredComposite
    ? ashiatoPageTemplatePreviewPath(templateId)
    : def.files.kind === "layered"
      ? (ashiatoPageTemplateBackgroundPath(templateId) ??
        ashiatoPageTemplateBodyPathForCompanion(templateId, companionType))
      : ashiatoPageTemplateBodyPathForCompanion(templateId, companionType);

  const photoOverlaySrc =
    def.files.kind === "layered" && !useLayeredComposite
      ? ashiatoPageTemplatePhotoOverlayPath(templateId)
      : null;

  const slotsPx: Partial<Record<AshiatoLayoutSlotId, AshiatoPxRect>> = {};
  for (const [key, rect] of Object.entries(layout.slots)) {
    if (!rect) continue;
    slotsPx[key as AshiatoLayoutSlotId] = ashiatoPercentRectToPx(rect);
  }

  const dateLayout = resolveAshiatoDateLayoutMode(layout.bodyWritingMode, layout.dateLayout);

  return {
    templateId,
    design: ASHIATO_PAGE_TEMPLATE_LAYOUT_SIZE_PX,
    bodyWritingMode: layout.bodyWritingMode,
    dateLayout,
    dateParts: dateLayout === "slash_ymd_weekday" ? (layout.dateParts ?? null) : null,
    bodyTextLayout: layout.bodyTextLayout ?? null,
    verticalBodyTextLayout: layout.verticalBodyTextLayout ?? null,
    photoRotateDeg: layout.photoRotateDeg,
    photoBorderRadiusPx: layout.photoBorderRadiusPx ?? 0,
    backgroundSrc,
    photoOverlaySrc,
    includes: def.includes,
    excludes: def.excludes,
    slotsPercent: layout.slots,
    slotsPx,
  };
}

export function ashiatoPlanShows(
  plan: AshiatoEntryRenderPlan,
  key: AshiatoPageTemplateContentKey,
): boolean {
  if (plan.excludes.includes(key)) return false;
  return plan.includes.includes(key);
}

/** あしあと本文表示用：末尾のタグ行（#モグ など）を除く */
export function normalizeAshiatoBodyContent(content: string): string {
  return stripTagsFromContent(content)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}

/**
 * 横書き用句読点 → Unicode 縦書き用互換字形。
 * （。＝左下寄り字形のまま縦マスに置くと左側に見える問題への対策）
 * Noto Sans CJK / Klee One 双方に vert 字形あり。
 */
const ASHIATO_VERTICAL_PUNCTUATION_DISPLAY: ReadonlyMap<string, string> = new Map([
  ["、", "\uFE11"], // ︑
  ["。", "\uFE12"], // ︒
  ["､", "\uFE11"],
  ["｡", "\uFE12"],
  ["，", "\uFE10"], // ︐
  ["．", "\uFE12"],
  ["：", "\uFE13"], // ︓
  ["；", "\uFE14"], // ︔
  ["！", "\uFE15"], // ︕
  ["!", "\uFE15"],
  ["？", "\uFE16"], // ︖
  ["?", "\uFE16"],
]);

export function isAshiatoVerticalPunctuation(ch: string): boolean {
  return ASHIATO_VERTICAL_PUNCTUATION_DISPLAY.has(ch);
}

/** 縦書きマス描画用：句読点だけ縦書き専用字形へ（他はそのまま） */
export function ashiatoVerticalDisplayChar(ch: string): string {
  return ASHIATO_VERTICAL_PUNCTUATION_DISPLAY.get(ch) ?? ch;
}

/** 縦書き：列の開始文字位置（1始まり） */
function ashiatoVerticalColumnStartChar(
  verticalLayout: AshiatoVerticalBodyTextLayout | null | undefined,
  colNo: number,
  contentFontMode?: string | null,
): number {
  const mode = normalizeContentFontMode(contentFontMode);
  const byMode = verticalLayout?.columnStartCharByMode?.[mode]?.[colNo];
  if (typeof byMode === "number" && byMode >= 1) return byMode;
  const mapped = verticalLayout?.columnStartChar?.[colNo];
  if (typeof mapped === "number" && mapped >= 1) return mapped;
  return 1;
}

/** 縦書き：列末を何文字短くするか（下から N 文字目が末字 → N-1） */
function ashiatoVerticalColumnShortenChars(
  verticalLayout: AshiatoVerticalBodyTextLayout | null | undefined,
  colNo: number,
  contentFontMode?: string | null,
): number {
  const mode = normalizeContentFontMode(contentFontMode);
  const byMode = verticalLayout?.columnShortenCharsByMode?.[mode]?.[colNo];
  if (typeof byMode === "number" && byMode >= 0) return byMode;
  const mapped = verticalLayout?.columnShortenChars?.[colNo];
  if (typeof mapped === "number" && mapped >= 0) return mapped;
  return 0;
}

/** 縦書き本文：右から左へ列、各列は上から下へ（呼び出し側でタグ除去済みを渡す） */
export function splitVerticalJapaneseColumns(
  text: string,
  maxCharsPerColumn: number,
  maxColumns: number,
  verticalLayout?: AshiatoVerticalBodyTextLayout | null,
  contentFontMode?: string | null,
): string[] {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rawChars: string[] = [];
  for (const ch of normalized) {
    if (ch === "\n") continue;
    rawChars.push(ch);
  }

  const columns: string[] = [];
  let i = 0;
  while (i < rawChars.length && columns.length < maxColumns) {
    const colNo = columns.length + 1;
    const startChar = ashiatoVerticalColumnStartChar(verticalLayout, colNo, contentFontMode);
    const shorten = ashiatoVerticalColumnShortenChars(verticalLayout, colNo, contentFontMode);
    const indent = Math.max(0, startChar - 1);
    let take = Math.max(1, maxCharsPerColumn - shorten - indent);
    take = Math.min(take, rawChars.length - i);

    // 次列先頭が句読点などにならないよう、分割位置を手前へ（横書きと同じ禁則）
    while (take > 1 && i + take < rawChars.length) {
      const nextCh = rawChars[i + take]!;
      if (isJapaneseLineStartPullbackChar(nextCh)) {
        take -= 1;
        continue;
      }
      const lastCh = rawChars[i + take - 1]!;
      if (isJapaneseLineEndPullbackChar(lastCh)) {
        take -= 1;
        continue;
      }
      break;
    }

    const chunk = rawChars.slice(i, i + take).join("");
    columns.push(`${"　".repeat(indent)}${chunk}`);
    i += take;
  }
  return columns;
}

/** 縦書きあしあと本文の列分割（末尾タグ行を除く） */
export function getAshiatoVerticalBodyColumns(
  content: string,
  maxCharsPerColumn: number,
  maxColumns: number,
  verticalLayout?: AshiatoVerticalBodyTextLayout | null,
  contentFontMode?: string | null,
): string[] {
  const body = normalizeAshiatoBodyContent(content);
  if (!body) return [];
  return splitVerticalJapaneseColumns(
    body,
    maxCharsPerColumn,
    maxColumns,
    verticalLayout,
    contentFontMode,
  );
}

/**
 * 森の絵日記など縦書き：罫線の列間（標準20px × 2.18）。
 * 本文幅÷10 にすると列が広すぎて、途中から罫線を跨ぐ。
 */
export const ASHIATO_VERTICAL_BODY_COLUMN_LINE_HEIGHT = 2.18;

/** 森の絵日記：罫線どおり書ける最大列数（11列目は使わない） */
export const ASHIATO_ENIKKI_MAX_BODY_COLUMNS = 10;

/** 罫線に合わせた列ピッチ（全モード共通・px） */
export const ASHIATO_ENIKKI_COLUMN_PITCH_PX =
  20 * ASHIATO_VERTICAL_BODY_COLUMN_LINE_HEIGHT;

/**
 * @deprecated 列ピッチは resolveAshiatoEnikkiVerticalMetrics の columnWidthPx を使う。
 */
export function getAshiatoVerticalBodyColumnLineHeight(
  contentFontMode?: string | null,
  options?: { bodyWidthPx?: number },
): number {
  const mode = normalizeContentFontMode(contentFontMode);
  const fontSizePx = getDiaryBookEntryV2BodyFontLayout(mode).fontSizePx;
  if (options?.bodyWidthPx && options.bodyWidthPx > 0) {
    return ASHIATO_ENIKKI_COLUMN_PITCH_PX / fontSizePx;
  }
  return ASHIATO_VERTICAL_BODY_COLUMN_LINE_HEIGHT;
}

/** 森の絵日記向け：罫線グリッド（列ピッチ共通・字送りはモードのフォントサイズ） */
export function resolveAshiatoEnikkiVerticalMetrics(
  contentFontMode: string | null | undefined,
  bodyRect: AshiatoLayoutPercentRect,
): {
  columnLineHeight: number;
  maxCharsPerColumn: number;
  maxColumns: number;
  columnWidthPx: number;
  charCellPx: number;
} {
  const font = getDiaryBookEntryV2BodyFontLayout(contentFontMode);
  const px = ashiatoPercentRectToPx(bodyRect);
  // 列ピッチは全モード共通（テンプレ罫線）。幅÷10は広すぎて左側で跨ぐ
  const columnWidthPx = ASHIATO_ENIKKI_COLUMN_PITCH_PX;
  const maxColumns = Math.min(
    ASHIATO_ENIKKI_MAX_BODY_COLUMNS,
    Math.max(1, Math.floor(px.widthPx / columnWidthPx)),
  );
  // 字送りはフォントサイズに合わせる（固定20pxだとゆったり24pxが詰まる）
  const charCellPx = font.fontSizePx;
  const maxCharsPerColumn = Math.max(1, Math.floor(px.heightPx / charCellPx));
  return {
    columnLineHeight: columnWidthPx / font.fontSizePx,
    maxCharsPerColumn,
    maxColumns,
    columnWidthPx,
    charCellPx,
  };
}

export type AshiatoHorizontalBodyCapacity = {
  maxLines: number;
  /** shrink 反映後の1行あたり基準字数（インデントなし） */
  baseMaxCharsPerLine: number;
  /** 行ごとの最大文字数（インデント反映・1始まり行番号に対応する 0-index 配列） */
  maxCharsByLine: number[];
  /** 合計最大文字数（あとで文字数カウンターへ反映） */
  maxBindingChars: number;
};

function ashiatoLineStartChar(
  bodyTextLayout: AshiatoHorizontalBodyTextLayout | null | undefined,
  lineNo: number,
  contentFontMode?: string | null,
): number {
  const mode = normalizeContentFontMode(contentFontMode);
  const byMode = bodyTextLayout?.lineStartCharByMode?.[mode]?.[lineNo];
  if (typeof byMode === "number" && byMode >= 1) return byMode;
  const mapped = bodyTextLayout?.lineStartChar?.[lineNo];
  if (typeof mapped === "number" && mapped >= 1) return mapped;
  return 1;
}

function ashiatoLineIndentChars(
  bodyTextLayout: AshiatoHorizontalBodyTextLayout | null | undefined,
  lineNo: number,
  contentFontMode?: string | null,
): number {
  return Math.max(0, ashiatoLineStartChar(bodyTextLayout, lineNo, contentFontMode) - 1);
}

function ashiatoLineShortenChars(
  bodyTextLayout: AshiatoHorizontalBodyTextLayout | null | undefined,
  lineNo: number,
  contentFontMode?: string | null,
): number {
  const mode = normalizeContentFontMode(contentFontMode);
  const byMode = bodyTextLayout?.lineShortenCharsByMode?.[mode]?.[lineNo];
  if (typeof byMode === "number" && byMode >= 1) return byMode;
  const mapped = bodyTextLayout?.lineShortenChars?.[lineNo];
  if (typeof mapped === "number" && mapped >= 1) return mapped;
  return 0;
}

/** 横書きあしあと本文の行数・字数上限（装飾インデント込み） */
export function getAshiatoHorizontalBodyCapacity(
  contentFontMode: string | null | undefined,
  bodyRect: AshiatoLayoutPercentRect,
  bodyTextLayout?: AshiatoHorizontalBodyTextLayout | null,
): AshiatoHorizontalBodyCapacity {
  const mode = normalizeContentFontMode(contentFontMode);
  const font = getDiaryBookEntryV2BodyFontLayout(mode);
  const widthPx = (bodyRect.width / 100) * ASHIATO_PAGE_TEMPLATE_LAYOUT_SIZE_PX.widthPx;
  const heightPx = (bodyRect.height / 100) * ASHIATO_PAGE_TEMPLATE_LAYOUT_SIZE_PX.heightPx;
  const shrinkChars = bodyTextLayout?.shrinkChars ?? 0;
  // 枠の左右 padding を差し引かないと1字だけはみ出し、CSSが二次改行してしまう
  const usableWidthPx = Math.max(1, widthPx - ASHIATO_HORIZONTAL_BODY_INLINE_PAD_PX * 2);
  const baseMaxCharsPerLine = Math.max(
    1,
    Math.floor(usableWidthPx / font.fontSizePx) - shrinkChars,
  );
  // 上下 padding を差し引いた高さで行数を出す（一律 -1 の安全マージンだと必要行が消える）
  const usableHeightPx = Math.max(1, heightPx - ASHIATO_HORIZONTAL_BODY_BLOCK_PAD_PX * 2);
  const computedMaxLines = Math.max(
    1,
    Math.floor(usableHeightPx / (font.fontSizePx * font.lineHeight)),
  );
  const overrideMaxLines = bodyTextLayout?.maxLinesByMode?.[mode];
  const maxLines =
    typeof overrideMaxLines === "number" && overrideMaxLines >= 1
      ? overrideMaxLines
      : computedMaxLines;
  const maxCharsByLine = Array.from({ length: maxLines }, (_, index) => {
    const indent = ashiatoLineIndentChars(bodyTextLayout, index + 1, mode);
    const shorten = ashiatoLineShortenChars(bodyTextLayout, index + 1, mode);
    return Math.max(1, baseMaxCharsPerLine - indent - shorten);
  });
  return {
    maxLines,
    baseMaxCharsPerLine,
    maxCharsByLine,
    maxBindingChars: maxCharsByLine.reduce((sum, n) => sum + n, 0),
  };
}

export function ashiatoHorizontalBodyLineIndentChars(
  bodyTextLayout: AshiatoHorizontalBodyTextLayout | null | undefined,
  lineNo: number,
  contentFontMode?: string | null,
): number {
  return ashiatoLineIndentChars(bodyTextLayout, lineNo, contentFontMode);
}

/** 横書きあしあと本文：枠幅・shrink/行ごと開始位置を反映した行分割 */
export function getAshiatoHorizontalBodyLayoutLines(
  content: string,
  contentFontMode: string | null | undefined,
  bodyRect: AshiatoLayoutPercentRect,
  bodyTextLayout?: AshiatoHorizontalBodyTextLayout | null,
): string[] {
  const capacity = getAshiatoHorizontalBodyCapacity(
    contentFontMode,
    bodyRect,
    bodyTextLayout,
  );
  return getAshiatoHorizontalBodyLayoutLinesAll(
    content,
    contentFontMode,
    bodyRect,
    bodyTextLayout,
  ).slice(0, capacity.maxLines);
}

/** 横書きあしあと本文：行数上限なし（はみ出し判定用） */
export function getAshiatoHorizontalBodyLayoutLinesAll(
  content: string,
  contentFontMode: string | null | undefined,
  bodyRect: AshiatoLayoutPercentRect,
  bodyTextLayout?: AshiatoHorizontalBodyTextLayout | null,
): string[] {
  const normalized = normalizeAshiatoBodyContent(content);
  if (!normalized) return [];

  const capacity = getAshiatoHorizontalBodyCapacity(
    contentFontMode,
    bodyRect,
    bodyTextLayout,
  );

  const lines: string[] = [];
  for (const segment of normalized.split("\n")) {
    if (segment.length === 0) {
      lines.push("");
      continue;
    }
    let rest = segment;
    while (rest.length > 0) {
      const maxChars = capacity.maxCharsByLine[lines.length] ?? capacity.baseMaxCharsPerLine;
      const parts = splitFixedWidthJapaneseLines(rest, maxChars);
      const head = parts[0] ?? "";
      lines.push(head);
      rest = parts.slice(1).join("");
    }
  }
  return lines;
}

/**
 * 選んだページテンプレ＋文字サイズで、本文が1ページに収まるか。
 * テンプレ未指定時は字数ソフト上限にフォールバック。
 */
export function ashiatoEntryBodyLengthFlag(params: {
  content: string;
  contentFontMode: string | null | undefined;
  pageTemplate?: string | null;
}): JournalContentLengthFlag {
  const { content, contentFontMode, pageTemplate } = params;
  if (!pageTemplate) {
    return journalEntryLayoutLengthFlag(contentFontMode, content);
  }

  const plan = resolveAshiatoEntryRenderPlan({ pageTemplate });
  const body = plan.slotsPercent.body;
  if (!body) {
    return journalEntryLayoutLengthFlag(contentFontMode, content);
  }

  if (plan.bodyWritingMode === "vertical") {
    const metrics = resolveAshiatoEnikkiVerticalMetrics(contentFontMode, body);
    let capacityChars = 0;
    for (let col = 1; col <= metrics.maxColumns; col += 1) {
      const startChar = ashiatoVerticalColumnStartChar(
        plan.verticalBodyTextLayout,
        col,
        contentFontMode,
      );
      const shorten = ashiatoVerticalColumnShortenChars(
        plan.verticalBodyTextLayout,
        col,
        contentFontMode,
      );
      const indent = Math.max(0, startChar - 1);
      capacityChars += Math.max(1, metrics.maxCharsPerColumn - shorten - indent);
    }
    const usedChars = normalizeAshiatoBodyContent(content).replace(/\n/g, "").length;
    if (usedChars <= 0) return "ok";
    if (usedChars <= capacityChars) return "ok";
    if (usedChars <= Math.ceil(capacityChars * 1.34)) return "soft";
    return "strong";
  }

  const capacity = getAshiatoHorizontalBodyCapacity(
    contentFontMode,
    body,
    plan.bodyTextLayout,
  );
  const linesAll = getAshiatoHorizontalBodyLayoutLinesAll(
    content,
    contentFontMode,
    body,
    plan.bodyTextLayout,
  );
  if (linesAll.length <= capacity.maxLines) return "ok";
  const excessLines = linesAll.length - capacity.maxLines;
  // 1行超過は描画差でギリ収まることもある → soft（プレビュー確認）
  // 2行以上は明らかに入りきらない → strong
  if (excessLines <= 1) return "soft";
  return "strong";
}

export function estimateVerticalBodyCapacity(
  rect: AshiatoPxRect,
  fontSizePx: number,
  columnLineHeight: number = ASHIATO_VERTICAL_BODY_COLUMN_LINE_HEIGHT,
  charAdvance: number = 1.2,
): {
  maxCharsPerColumn: number;
  maxColumns: number;
} {
  const maxCharsPerColumn = Math.max(1, Math.floor(rect.heightPx / (fontSizePx * charAdvance)));
  const maxColumns = Math.max(1, Math.floor(rect.widthPx / (fontSizePx * columnLineHeight)));
  return { maxCharsPerColumn, maxColumns };
}

/** dailyNumber 枠を3等分（任意で各枠を横に微調整） */
export function splitDailyNumberSlots(
  rect: AshiatoLayoutPercentRect,
  options?: { leftNudgePctByIndex?: readonly [number, number, number] },
): AshiatoLayoutPercentRect[] {
  const w = rect.width / 3;
  const nudge = options?.leftNudgePctByIndex ?? [0, 0, 0];
  return [0, 1, 2].map((i) => ({
    left: rect.left + w * i + (nudge[i] ?? 0),
    top: rect.top,
    width: w,
    height: rect.height,
  }));
}

/** 彩り：日はそのまま、月・年を少し右へ */
export function ashiatoDailyNumberSlotLeftNudgePct(
  templateId: AshiatoPageTemplateId,
): readonly [number, number, number] | undefined {
  if (templateId === "suuji_ashiato_irodori") {
    return [0, 1.2, 2.2];
  }
  return undefined;
}

/** すうじ標準は Year / Month / Day 順。彩りは画像に 日・月・年 */
export function ashiatoDailyNumberOrder(
  templateId: AshiatoPageTemplateId,
): readonly ("year" | "month" | "today")[] {
  if (templateId === "suuji_ashiato_standard") {
    return ["year", "month", "today"];
  }
  return ["today", "month", "year"];
}

/** すうじ標準は Year / Month / Day。彩りは画像に 日・月・年 */
export function ashiatoDailyNumberLabels(
  templateId: AshiatoPageTemplateId,
): readonly ["Year", "Month", "Day"] | readonly ["日", "月", "年"] {
  if (templateId === "suuji_ashiato_standard") {
    return ["Year", "Month", "Day"];
  }
  return ["日", "月", "年"];
}

/** すうじ標準：枠の下寄せ（見出し直下の数字列に合わせる） */
export function ashiatoDailyNumberSlotAlign(
  templateId: AshiatoPageTemplateId,
): "center" | "flex-end" {
  return templateId === "suuji_ashiato_standard" ? "flex-end" : "center";
}

export function ashiatoDailyNumberValues(
  templateId: AshiatoPageTemplateId,
  numbers: { today: number | string; month: number | string; year: number | string },
): string[] {
  return ashiatoDailyNumberOrder(templateId).map((key) => String(numbers[key]));
}

/** 縦書き日付の部品。weekday は「金曜日」を日付列の左隣に別列で並べる */
export type AshiatoVerticalDatePart =
  | { kind: "text"; text: string }
  | { kind: "weekday"; text: string };

export type AshiatoVerticalDateColumns = {
  /** 例: ２０２６年６月５日 */
  dateText: string;
  /** 例: 金曜日 */
  weekdayText: string;
};

function toFullwidthDigits(text: string): string {
  return [...text]
    .map((ch) =>
      ch >= "0" && ch <= "9" ? String.fromCharCode(ch.charCodeAt(0) - 0x30 + 0xff10) : ch,
    )
    .join("");
}

/** 縦書き日付部品（曜日は「金」「曜」「日」の3文字） */
export function formatAshiatoVerticalDateParts(date: Date): AshiatoVerticalDatePart[] {
  const segs = getDiaryPreviewDateRowSegments(date).filter((segment) => segment.key !== "label");
  const parts: AshiatoVerticalDatePart[] = [];
  let i = 0;
  while (i < segs.length) {
    const seg = segs[i]!;
    if (seg.key === "open" && segs[i + 1]?.key === "week" && segs[i + 2]?.key === "close") {
      parts.push({
        kind: "weekday",
        text: `${segs[i + 1]!.text}曜日`,
      });
      i += 3;
      continue;
    }
    if (seg.key === "open" || seg.key === "week" || seg.key === "close") {
      i += 1;
      continue;
    }
    parts.push({ kind: "text", text: toFullwidthDigits(seg.text) });
    i += 1;
  }
  return parts;
}

/** 縦書き日付を「日付列 | 曜日列」に分ける（右が日付・左が曜日） */
export function formatAshiatoVerticalDateColumns(date: Date): AshiatoVerticalDateColumns {
  const parts = formatAshiatoVerticalDateParts(date);
  return {
    dateText: parts
      .filter((part) => part.kind === "text")
      .map((part) => part.text)
      .join(""),
    weekdayText: parts.find((part) => part.kind === "weekday")?.text ?? "",
  };
}

/** 余白ノート用：テンプレの `/` の間に年・月・日、下に「金曜日」 */
export type AshiatoSlashYmdWeekdayDate = {
  year: string;
  month: string;
  day: string;
  weekday: string;
};

export function formatAshiatoSlashYmdWeekdayDate(date: Date): AshiatoSlashYmdWeekdayDate {
  const segs = getDiaryPreviewDateRowSegments(date);
  const week = segs.find((segment) => segment.key === "week")?.text ?? "";
  return {
    year: String(date.getFullYear()),
    month: String(date.getMonth() + 1),
    day: String(date.getDate()),
    weekday: week ? `${week}曜日` : "",
  };
}

/** @deprecated プレビューは formatAshiatoVerticalDateColumns を使う */
export function formatAshiatoVerticalDateText(date: Date): string {
  const { dateText, weekdayText } = formatAshiatoVerticalDateColumns(date);
  return `${dateText}${weekdayText}`;
}

/** 縦書き日付が枠に収まる最大フォント（日付列の文字数基準・設計px） */
export function ashiatoVerticalDateFontSizePx(dateRectHeightPct: number): number {
  const heightPx = (dateRectHeightPct / 100) * ASHIATO_PAGE_TEMPLATE_LAYOUT_SIZE_PX.heightPx;
  /** 例: ２０２６年１２月２５日（曜日は別列なので含めない） */
  const maxUnits = 12;
  const letterSpacingFactor = 1.06;
  const paddingFactor = 0.94;
  const size = Math.floor((heightPx * paddingFactor) / (maxUnits * letterSpacingFactor));
  return Math.max(13, Math.min(18, size));
}
