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
} from "@/lib/journal/ashiatoPageTemplateLayout";
import { getDiaryBookEntryV2BodyFontLayout } from "@/lib/journal/diaryBookEntryBodyFontLayout";
import { getDiaryPreviewDateRowSegments } from "@/lib/journal/diaryPreviewFixedLayout";
import { stripTagsFromContent } from "@/lib/journal/diaryTags";
import { splitFixedWidthJapaneseLines } from "@/lib/pdf/splitFixedWidthJapaneseLines";

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

/** 縦書き本文：右から左へ列、各列は上から下へ（呼び出し側でタグ除去済みを渡す） */
export function splitVerticalJapaneseColumns(
  text: string,
  maxCharsPerColumn: number,
  maxColumns: number,
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
    columns.push(rawChars.slice(i, i + maxCharsPerColumn).join(""));
    i += maxCharsPerColumn;
  }
  return columns;
}

/** 縦書きあしあと本文の列分割（末尾タグ行を除く） */
export function getAshiatoVerticalBodyColumns(
  content: string,
  maxCharsPerColumn: number,
  maxColumns: number,
): string[] {
  const body = normalizeAshiatoBodyContent(content);
  if (!body) return [];
  return splitVerticalJapaneseColumns(body, maxCharsPerColumn, maxColumns);
}

/** 森の絵日記など縦書き：罫線間隔に合わせた列間（CSS line-height） */
export const ASHIATO_VERTICAL_BODY_COLUMN_LINE_HEIGHT = 2;

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
): number {
  const mapped = bodyTextLayout?.lineStartChar?.[lineNo];
  if (typeof mapped === "number" && mapped >= 1) return mapped;
  return 1;
}

function ashiatoLineIndentChars(
  bodyTextLayout: AshiatoHorizontalBodyTextLayout | null | undefined,
  lineNo: number,
): number {
  return Math.max(0, ashiatoLineStartChar(bodyTextLayout, lineNo) - 1);
}

/** 横書きあしあと本文の行数・字数上限（装飾インデント込み） */
export function getAshiatoHorizontalBodyCapacity(
  contentFontMode: string | null | undefined,
  bodyRect: AshiatoLayoutPercentRect,
  bodyTextLayout?: AshiatoHorizontalBodyTextLayout | null,
): AshiatoHorizontalBodyCapacity {
  const font = getDiaryBookEntryV2BodyFontLayout(contentFontMode);
  const widthPx = (bodyRect.width / 100) * ASHIATO_PAGE_TEMPLATE_LAYOUT_SIZE_PX.widthPx;
  const heightPx = (bodyRect.height / 100) * ASHIATO_PAGE_TEMPLATE_LAYOUT_SIZE_PX.heightPx;
  const shrinkChars = bodyTextLayout?.shrinkChars ?? 0;
  const baseMaxCharsPerLine = Math.max(1, Math.floor(widthPx / font.fontSizePx) - shrinkChars);
  const maxLines = Math.max(
    1,
    Math.floor(heightPx / (font.fontSizePx * font.lineHeight)),
  );
  const maxCharsByLine = Array.from({ length: maxLines }, (_, index) => {
    const indent = ashiatoLineIndentChars(bodyTextLayout, index + 1);
    return Math.max(1, baseMaxCharsPerLine - indent);
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
): number {
  return ashiatoLineIndentChars(bodyTextLayout, lineNo);
}

/** 横書きあしあと本文：枠幅・shrink/行ごと開始位置を反映した行分割 */
export function getAshiatoHorizontalBodyLayoutLines(
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
    if (lines.length >= capacity.maxLines) break;
    if (segment.length === 0) {
      lines.push("");
      continue;
    }
    let rest = segment;
    while (rest.length > 0 && lines.length < capacity.maxLines) {
      const maxChars = capacity.maxCharsByLine[lines.length] ?? capacity.baseMaxCharsPerLine;
      const parts = splitFixedWidthJapaneseLines(rest, maxChars);
      const head = parts[0] ?? "";
      lines.push(head);
      rest = parts.slice(1).join("");
    }
  }
  return lines;
}

export function estimateVerticalBodyCapacity(
  rect: AshiatoPxRect,
  fontSizePx: number,
  columnLineHeight: number = ASHIATO_VERTICAL_BODY_COLUMN_LINE_HEIGHT,
): {
  maxCharsPerColumn: number;
  maxColumns: number;
} {
  /** 縦方向の文字送り（列内） */
  const charAdvance = 1.2;
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
