import {
  normalizeContentFontMode,
  type ContentFontMode,
} from "@/lib/journal/contentFontMode";

/**
 * 製本固定本文枠（724×1024・DIARY_PREVIEW_BODY_REGION）に対する行数判定。
 * 枠の位置・高さは変更しない（モード別の行数・chars/行のみ調整）。
 */

/** 1行あたりの想定文字数（全角主体・折り返し判定・プレビュー表示折り返し） */
export const DIARY_BODY_CHARS_PER_LINE_BY_MODE: Record<ContentFontMode, number> = {
  /** 短文・一言向け（大きめ表示・28×4。標準32×6と差別化） */
  relaxed: 28,
  /** 日常用（724px 本文枠・端末差に余裕を持たせる・32×6） */
  standard: 32,
  /** やや長め（724px 本文枠・標準より多く・40×7） */
  generous: 40,
  /** 長文向け（読める範囲で多め・44×8） */
  compact: 44,
};

/** 本文枠に収まる最大行数（手動改行・折り返し行の合計） */
export const DIARY_BODY_MAX_LINES_BY_MODE: Record<ContentFontMode, number> = {
  relaxed: 4,
  standard: 6,
  generous: 7,
  compact: 8,
};

/** 推奨行数（警告は maxLines 超のみ。UI 目安用） */
export const DIARY_BODY_RECOMMENDED_MAX_LINES_BY_MODE: Record<ContentFontMode, number> = {
  relaxed: 3,
  standard: 4,
  generous: 5,
  compact: 6,
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
  const lines = getBodyLayoutLines(content, contentFontMode);
  const { maxLines } = getDiaryBodyLineLimit(contentFontMode);
  return lines.slice(0, maxLines);
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
 * 手動改行を尊重し、超過分はモード別 charsPerLine で分割する。
 */
export function getBodyLayoutLines(
  content: string,
  contentFontMode: string | null | undefined,
): string[] {
  const normalized = normalizeJournalContentNewlines(content);
  if (!normalized.trim()) return [];

  const mode = normalizeContentFontMode(contentFontMode);
  const charsPerLine = DIARY_BODY_CHARS_PER_LINE_BY_MODE[mode];
  const visualLines: string[] = [];

  for (const segment of normalized.split("\n")) {
    if (segment.length === 0) {
      visualLines.push("");
      continue;
    }
    for (let i = 0; i < segment.length; i += charsPerLine) {
      visualLines.push(segment.slice(i, i + charsPerLine));
    }
  }

  return visualLines;
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
 * 製本枠上の想定行数。手動改行は1行、超過分は ceil(len/charsPerLine) で折り返し行を加算。
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
  const mode = normalizeContentFontMode(contentFontMode);
  return {
    charsPerLine: DIARY_BODY_CHARS_PER_LINE_BY_MODE[mode],
    maxLines: DIARY_BODY_MAX_LINES_BY_MODE[mode],
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
