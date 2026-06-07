import type { CSSProperties } from "react";

import type { DiaryPreviewRegionBox } from "@/lib/journal/diaryDesignPreviewTiers";
import { isDiaryBodyOverLineLimit } from "@/lib/journal/diaryPreviewBodyLineLimits";
import { isDiaryCommentOverPdfLineLimit } from "@/lib/journal/diaryCommentPdfWrap";
import {
  DIARY_PREVIEW_OVERLAY_FONT,
  DIARY_PREVIEW_PAGE_HEIGHT,
  DIARY_PREVIEW_PAGE_WIDTH,
  DIARY_PREVIEW_SCROLL_INNER_CLASS,
} from "@/lib/journal/diaryPreviewFixedLayout";

const OVERFLOW_EPSILON_PX = 1;

/**
 * DiaryPreviewFixedPage と同じ DOM・スタイルで枠内 overflow を測定。
 * 724×1024 + container-type:inline-size で cqw/cqh を解決する。
 */
export function measureDiaryPreviewRegionOverflow(
  content: string,
  region: DiaryPreviewRegionBox,
  textStyle: CSSProperties,
  innerClassName: string = DIARY_PREVIEW_SCROLL_INNER_CLASS,
): boolean {
  if (typeof document === "undefined") return false;
  const text = content.trim();
  if (!text) return false;

  const page = document.createElement("div");
  page.className = "[container-type:inline-size] [-webkit-text-size-adjust:100%] [text-size-adjust:100%]";
  page.style.cssText = [
    "position:fixed",
    "left:-12000px",
    "top:0",
    `width:${DIARY_PREVIEW_PAGE_WIDTH}px`,
    `height:${DIARY_PREVIEW_PAGE_HEIGHT}px`,
    "visibility:hidden",
    "pointer-events:none",
    `font-family:${DIARY_PREVIEW_OVERLAY_FONT}`,
  ].join(";");

  const shell = document.createElement("div");
  shell.style.cssText = [
    "position:absolute",
    "overflow:hidden",
    `left:${region.left}`,
    `top:${region.top}`,
    `width:${region.width}`,
    `height:${region.heightPct}`,
  ].join(";");

  const inner = document.createElement("div");
  inner.className = innerClassName;
  Object.assign(inner.style, textStyle);
  inner.textContent = text;

  shell.appendChild(inner);
  page.appendChild(shell);
  document.body.appendChild(page);

  const overflows = inner.scrollHeight > inner.clientHeight + OVERFLOW_EPSILON_PX;

  document.body.removeChild(page);
  return overflows;
}

/** 本文枠：行数ベース判定（製本固定枠・モード別 chars/行・最大行数） */
export function measureDiaryBodyOverflows(
  content: string,
  contentFontMode: string | null | undefined,
): boolean {
  return isDiaryBodyOverLineLimit(content, contentFontMode);
}

export function measureDiaryCommentOverflows(comment: string | null | undefined): boolean {
  return isDiaryCommentOverPdfLineLimit(comment ?? "");
}

/** 本文またはフクロウ欄のいずれかがはみ出す */
export function measureDiaryPageTextOverflows(
  content: string,
  comment: string | null | undefined,
  contentFontMode: string | null | undefined,
): { body: boolean; comment: boolean; any: boolean } {
  const body = measureDiaryBodyOverflows(content, contentFontMode);
  const commentOverflow = measureDiaryCommentOverflows(comment);
  return { body, comment: commentOverflow, any: body || commentOverflow };
}
