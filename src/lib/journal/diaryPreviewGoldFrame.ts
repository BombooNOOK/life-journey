import {
  DIARY_PREVIEW_PAGE_HEIGHT,
  DIARY_PREVIEW_PAGE_WIDTH,
} from "@/lib/journal/diaryPreviewFixedLayout";

/**
 * 金枠専用の表示定数（日付・本文・数字などのレイアウトとは独立）。
 * 調整はこのファイルのみ行う。
 */

export const DIARY_PREVIEW_GOLD_FRAME_PAGE_WIDTH = DIARY_PREVIEW_PAGE_WIDTH;
export const DIARY_PREVIEW_GOLD_FRAME_PAGE_HEIGHT = DIARY_PREVIEW_PAGE_HEIGHT;

/** ページ地色（PNG 外周マスク・プレビュー背景と一致させる） */
export const DIARY_PREVIEW_GOLD_FRAME_PAGE_BG = "#faf8f5";

/** PNG 内の外周金枠を隠すマスク帯の厚さ（px） */
export const DIARY_PREVIEW_GOLD_FRAME_MASK_THICKNESS_PX = 18;

/** 外側の金線（724×1024 ページ端からの inset） */
export const DIARY_PREVIEW_GOLD_FRAME_OUTER_INSET_PX = 11;

/** 内側の金線（二重枠の内周） */
export const DIARY_PREVIEW_GOLD_FRAME_INNER_INSET_PX = 14;

export const DIARY_PREVIEW_GOLD_FRAME_OUTER_STROKE_PX = 1.25;
export const DIARY_PREVIEW_GOLD_FRAME_INNER_STROKE_PX = 0.85;

export const DIARY_PREVIEW_GOLD_FRAME_RADIUS_PX = 2;

export const DIARY_PREVIEW_GOLD_FRAME_OUTER_COLOR = "#c4a06a";
export const DIARY_PREVIEW_GOLD_FRAME_INNER_COLOR = "#d8bc8e";
