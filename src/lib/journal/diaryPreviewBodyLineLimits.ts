import {
  normalizeContentFontMode,
  type ContentFontMode,
} from "@/lib/journal/contentFontMode";
import {
  getDiaryBookEntryV2BodyLayoutLines,
  getDiaryBookEntryV2BodyLayoutLinesAll,
} from "@/lib/journal/diaryBookEntryBodyWrap";
import { getDiaryBookEntryV2BodyFontLayout } from "@/lib/journal/diaryBookEntryBodyFontLayout";

/**
 * 日記ブック本文 v2（724×1024）に対する行数判定。
 * PDF・本棚プレビュー・入力画面の製本警告で共通。
 */

const MODES = ["relaxed", "standard", "generous", "compact"] as const satisfies readonly ContentFontMode[];

function buildCharsPerLineByMode(): Record<ContentFontMode, number> {
  return Object.fromEntries(
    MODES.map((mode) => [mode, getDiaryBookEntryV2BodyFontLayout(mode).maxCharsPerLine]),
  ) as Record<ContentFontMode, number>;
}

function buildMaxLinesByMode(): Record<ContentFontMode, number> {
  return Object.fromEntries(
    MODES.map((mode) => [mode, getDiaryBookEntryV2BodyFontLayout(mode).maxLines]),
  ) as Record<ContentFontMode, number>;
}

/** 1行あたりの想定文字数（全角主体・v2 折り返し） */
export const DIARY_BODY_CHARS_PER_LINE_BY_MODE = buildCharsPerLineByMode();

/** 本文枠に収まる最大行数（手動改行・折り返し行の合計） */
export const DIARY_BODY_MAX_LINES_BY_MODE = buildMaxLinesByMode();

/** 推奨行数（警告は maxLines 超のみ。UI 目安用） */
export const DIARY_BODY_RECOMMENDED_MAX_LINES_BY_MODE: Record<ContentFontMode, number> = {
  relaxed: 5,
  standard: 7,
  generous: 9,
  compact: 9,
};

/** 入力欄・ステータス用（短いラベル） */
export const DIARY_BODY_FRAME_OVERFLOW_MESSAGE_BY_MODE: Record<ContentFontMode, string> = {
  relaxed: "本文枠：長めです。標準モードをおすすめします",
  standard: "本文枠：長めです。たっぷりまたはぎゅっとをおすすめします",
  generous: "本文枠：長めです。ぎゅっとをおすすめします",
  compact: "本文枠：長めです。プレビューで確認してください",
};

/**
 * 製本プレビュー用（1ページに載る範囲を超えたとき）。
 * スクロールで全文を読める＝製本に載る、という誤解を避ける文言。
 */
export const DIARY_BINDING_BODY_OVERFLOW_MESSAGE_BY_MODE: Record<ContentFontMode, string> = {
  relaxed:
    "このモードでは本文が1ページに入りきりません。標準・たっぷり・ぎゅっとに変更するか、本文を短くしてください。",
  standard:
    "このモードでは本文が1ページに入りきりません。たっぷり・ぎゅっとに変更するか、本文を短くしてください。",
  generous:
    "このモードでは本文が1ページに入りきりません。ぎゅっとに変更するか、本文を短くしてください。",
  compact:
    "このモードでは本文が1ページに入りきりません。本文を短くしてください。",
};

export function getDiaryBindingBodyOverflowMessage(
  contentFontMode: string | null | undefined,
): string {
  const mode = normalizeContentFontMode(contentFontMode);
  return DIARY_BINDING_BODY_OVERFLOW_MESSAGE_BY_MODE[mode];
}

/** 製本プレビューに表示する行（最大行数まで。保存データは変更しない） */
export function getBodyLayoutLinesForBindingPreview(
  content: string,
  contentFontMode: string | null | undefined,
): string[] {
  return getDiaryBookEntryV2BodyLayoutLines(content, contentFontMode);
}

export function countBodyLayoutLinesBeyondBindingPreview(
  content: string,
  contentFontMode: string | null | undefined,
): number {
  const total = countBodyLayoutLines(content, contentFontMode);
  const { maxLines } = getDiaryBodyLineLimit(contentFontMode);
  return Math.max(0, total - maxLines);
}

export function normalizeJournalContentNewlines(content: string): string {
  return content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

/**
 * 表示・行数判定用の行配列（保存データ・textarea は変更しない）。
 * 手動改行を尊重し、超過分はモード別 chars/行で分割する（v2 製本ルール）。
 */
export function getBodyLayoutLines(
  content: string,
  contentFontMode: string | null | undefined,
): string[] {
  return getDiaryBookEntryV2BodyLayoutLinesAll(content, contentFontMode);
}

/**
 * プレビュー用の表示テキスト（保存データは変更しない）。
 * @deprecated 行ごと描画では getBodyLayoutLines を直接使用
 */
export function formatBodyForPreviewDisplay(
  content: string,
  contentFontMode: string | null | undefined,
): string {
  return getBodyLayoutLines(content, contentFontMode).join("\n");
}

/** @deprecated formatBodyForPreviewDisplay を使用 */
export function formatRelaxedBodyForPreviewDisplay(content: string): string {
  return formatBodyForPreviewDisplay(content, "standard");
}

/**
 * 製本枠上の想定行数。手動改行は1行、超過分は折り返し行を加算。
 */
export function countBodyLayoutLines(
  content: string,
  contentFontMode: string | null | undefined,
): number {
  return getBodyLayoutLines(content, contentFontMode).length;
}

export function getDiaryBodyLineLimit(contentFontMode: string | null | undefined): {
  charsPerLine: number;
  maxLines: number;
} {
  const layout = getDiaryBookEntryV2BodyFontLayout(contentFontMode);
  return {
    charsPerLine: layout.maxCharsPerLine,
    maxLines: layout.maxLines,
  };
}

export function isDiaryBodyOverLineLimit(
  content: string,
  contentFontMode: string | null | undefined,
): boolean {
  const trimmed = content.trim();
  if (!trimmed) return false;
  const { maxLines } = getDiaryBodyLineLimit(contentFontMode);
  return countBodyLayoutLines(trimmed, contentFontMode) > maxLines;
}

export function getBodyFrameStatusLabel(
  contentFontMode: string | null | undefined,
  bodyOverflows: boolean,
  commentOverflows: boolean,
): string {
  if (bodyOverflows && commentOverflows) {
    return "本文枠・読み解き枠：長めです。プレビューで確認してください";
  }
  if (bodyOverflows) {
    const mode = normalizeContentFontMode(contentFontMode);
    return DIARY_BODY_FRAME_OVERFLOW_MESSAGE_BY_MODE[mode];
  }
  if (commentOverflows) {
    return "読み解き枠：長めです。プレビューで確認してください";
  }
  return "本文枠：収まっています";
}
