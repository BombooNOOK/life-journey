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
 * あしあとブック本文 v2（724×1024）に対する行数判定。
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
  relaxed: 4,
  standard: 6,
  generous: 8,
  compact: 8,
};

/** 入力欄・ステータス用（短いラベル） */
export const DIARY_BODY_FRAME_OVERFLOW_MESSAGE_BY_MODE: Record<ContentFontMode, string> = {
  relaxed: "本文枠：1ページに入りきりません。標準モードをおすすめします",
  standard: "本文枠：1ページに入りきりません。たっぷりまたはぎゅっとをおすすめします",
  generous: "本文枠：1ページに入りきりません。ぎゅっとをおすすめします",
  compact: "本文枠：1ページに入りきりません。文章を短くしてください",
};

/** ギリ収まるかも／描画差あり得るときの注意（プレビュー確認） */
export const DIARY_BODY_FRAME_CAUTION_MESSAGE =
  "本文枠：製本プレビューで一度確認してみてください" as const;

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

export const DIARY_BINDING_BODY_CAUTION_MESSAGE =
  "本文が枠の上限付近です。製本プレビューで入りきるか確認してください。" as const;

/** 本文枠の警告段階：ok＝収まる / caution＝プレビュー確認 / overflow＝明らかに入りきらない */
export type BodyFrameSeverity = "ok" | "caution" | "overflow";

/**
 * 行数ベースの本文枠警告段階（テンプレなし＝v2 レイアウト）。
 * 1行超過＝caution、2行以上＝overflow。
 */
export function resolveV2BodyFrameSeverity(
  content: string,
  contentFontMode: string | null | undefined,
): BodyFrameSeverity {
  const trimmed = content.trim();
  if (!trimmed) return "ok";
  const { maxLines } = getDiaryBodyLineLimit(contentFontMode);
  const lines = countBodyLayoutLines(trimmed, contentFontMode);
  if (lines <= maxLines) return "ok";
  if (lines - maxLines <= 1) return "caution";
  return "overflow";
}

export function bodyFrameSeverityFromLengthFlag(
  flag: "ok" | "soft" | "strong",
): BodyFrameSeverity {
  if (flag === "strong") return "overflow";
  if (flag === "soft") return "caution";
  return "ok";
}

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
  bodySeverity: BodyFrameSeverity | boolean,
  commentOverflows: boolean,
): string {
  const severity: BodyFrameSeverity =
    typeof bodySeverity === "boolean"
      ? bodySeverity
        ? "overflow"
        : "ok"
      : bodySeverity;

  if (severity === "overflow" && commentOverflows) {
    return "本文枠・読み解き枠：1ページに入りきりません";
  }
  if (severity === "caution" && commentOverflows) {
    return "本文枠・読み解き枠：製本プレビューで確認してください";
  }
  if (severity === "overflow") {
    const mode = normalizeContentFontMode(contentFontMode);
    return DIARY_BODY_FRAME_OVERFLOW_MESSAGE_BY_MODE[mode];
  }
  if (severity === "caution") {
    return DIARY_BODY_FRAME_CAUTION_MESSAGE;
  }
  if (commentOverflows) {
    return "読み解き枠：製本プレビューで確認してください";
  }
  return "本文枠：収まっています";
}
