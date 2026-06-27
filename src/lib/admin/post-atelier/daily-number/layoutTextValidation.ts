import { DAILY_NUMBER_COVER_LAYOUT, DAILY_NUMBER_PERSONAL_BLOCK_LAYOUTS, dailyNumberPersonalBlockLayoutV2 } from "./imageLayout";
import { DAILY_NUMBER_PERSONAL_PAGE_GROUPS } from "./pageLayout";
import { extractImageBody } from "./messageTextSplit";
import { countDailyNumberImageBodyShownChars } from "./imageBodyWrap";
import type { DailyNumberLifePathValue } from "./types";
import {
  wrapBulletActionLines,
  wrapTextLines,
} from "./svgText";

/** v2 画像用本文（1文目）の推奨上限 */
export const DAILY_NUMBER_PERSONAL_BODY_RECOMMENDED_MAX_CHARS = 52 as const;

export type LayoutTextField = "body" | "action1" | "action2" | "summaryMessage";

export type LayoutTextIssue = {
  field: LayoutTextField;
  message: string;
  length: number;
  shown: number;
  /** 個別本文のみ。上段=0・下段=1 */
  blockIndex?: 0 | 1;
  blockLabel?: "上段" | "下段";
};

function bodyLayoutConfig(blockIndex: 0 | 1) {
  const body = dailyNumberPersonalBlockLayoutV2(1, blockIndex).body;
  return {
    maxLines: body.maxLines,
    continuationMaxCharsPerLine: body.imageBodyContinuationMaxCharsPerLine,
  };
}

export function personalBodyBlockIndexForLifePath(lifePathNumber: number): 0 | 1 {
  for (const group of DAILY_NUMBER_PERSONAL_PAGE_GROUPS) {
    const index = group.indexOf(lifePathNumber as DailyNumberLifePathValue);
    if (index >= 0) return index as 0 | 1;
  }
  throw new Error(`Unknown lifePathNumber: ${lifePathNumber}`);
}

export function validatePersonalBodyText(
  body: string,
  blockIndex: 0 | 1,
): LayoutTextIssue | null {
  const normalized = extractImageBody(body);
  if (!normalized) return null;

  const { maxLines, continuationMaxCharsPerLine } = bodyLayoutConfig(blockIndex);
  const shown = countDailyNumberImageBodyShownChars(normalized, {
    continuationMaxCharsPerLine,
    maxLines,
  });
  if (shown >= normalized.length) return null;

  const blockLabel = blockIndex === 0 ? "上段" : "下段";
  return {
    field: "body",
    blockIndex,
    blockLabel,
    length: normalized.length,
    shown,
    message:
      `個別画像本文（${blockLabel}・1文目）がレイアウトに収まりません（${normalized.length}文字中${shown}文字まで表示・最大${maxLines}行）。` +
      ` 推奨は${DAILY_NUMBER_PERSONAL_BODY_RECOMMENDED_MAX_CHARS}文字以内です。`,
  };
}

const ACTION_MAX_CHARS_PER_LINE = DAILY_NUMBER_PERSONAL_BLOCK_LAYOUTS[0]!.actions.maxCharsPerLine;
const ACTION_MAX_LINES = 2;

function validateActionText(action: string, field: "action1" | "action2"): LayoutTextIssue | null {
  const normalized = action.replace(/\s+/g, " ").trim();
  if (!normalized) return null;

  const lines = wrapBulletActionLines(normalized, ACTION_MAX_CHARS_PER_LINE, ACTION_MAX_LINES);
  const shown = lines.reduce((sum, line) => sum + line.text.length, 0);
  if (shown >= normalized.length) return null;

  return {
    field,
    length: normalized.length,
    shown,
    message:
      `${field === "action1" ? "すごしかた1" : "すごしかた2"}が画像レイアウトに収まりません（${normalized.length}文字中${shown}文字まで表示）。` +
      ` ・付き${ACTION_MAX_LINES}行・各行最大${ACTION_MAX_CHARS_PER_LINE}文字（1行目は・分を除く）です。`,
  };
}

export function validateCoverSummaryText(summaryMessage: string): LayoutTextIssue | null {
  const normalized = summaryMessage.replace(/\s+/g, " ").trim();
  if (!normalized) return null;

  const { maxCharsPerLine, maxLines } = DAILY_NUMBER_COVER_LAYOUT.summary;
  const lines = wrapTextLines(normalized, maxCharsPerLine, maxLines);
  const shown = lines.join("").length;
  if (shown >= normalized.length) return null;

  return {
    field: "summaryMessage",
    length: normalized.length,
    shown,
    message:
      `表紙本文が画像レイアウトに収まりません（${normalized.length}文字中${shown}文字まで表示）。` +
      ` ${maxCharsPerLine}文字/行 × 最大${maxLines}行です。`,
  };
}

export function validateDailyNumberMessageLayout(input: {
  lifePathNumber: number;
  body: string;
  action1: string;
  action2: string;
}): LayoutTextIssue[] {
  const issues: LayoutTextIssue[] = [];
  const blockIndex = personalBodyBlockIndexForLifePath(input.lifePathNumber);
  const bodyIssue = validatePersonalBodyText(input.body, blockIndex);
  if (bodyIssue) issues.push(bodyIssue);

  const action1Issue = validateActionText(input.action1, "action1");
  if (action1Issue) issues.push(action1Issue);

  const action2Issue = validateActionText(input.action2, "action2");
  if (action2Issue) issues.push(action2Issue);

  return issues;
}

export function formatLayoutTextIssueContext(input: {
  todayNumber: number;
  lifePathNumber: number;
  variant: string;
  issue: LayoutTextIssue;
}): string {
  const { todayNumber, lifePathNumber, variant, issue } = input;
  const placement =
    issue.blockLabel != null ? ` / ${issue.blockLabel}` : "";
  return `UD${todayNumber} × LP${lifePathNumber} × variant ${variant}${placement}: ${issue.message}`;
}

export function formatCoverLayoutTextIssueContext(input: {
  todayNumber: number;
  variant: string;
  issue: LayoutTextIssue;
}): string {
  return `UD${input.todayNumber} × cover variant ${input.variant}: ${input.issue.message}`;
}

export function assertDailyNumberMessageLayoutsValid(
  rows: Array<{
    todayNumber: number;
    lifePathNumber: number;
    variant: string;
    body: string;
    action1: string;
    action2: string;
  }>,
  options?: { onlyFilled?: boolean },
): void {
  const onlyFilled = options?.onlyFilled ?? true;
  const errors: string[] = [];

  for (const row of rows) {
    if (
      onlyFilled &&
      !row.body.trim() &&
      !row.action1.trim() &&
      !row.action2.trim()
    ) {
      continue;
    }
    for (const issue of validateDailyNumberMessageLayout(row)) {
      errors.push(formatLayoutTextIssueContext({ ...row, issue }));
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `画像レイアウトの文字数チェックに失敗しました（${errors.length}件）:\n${errors.join("\n")}`,
    );
  }
}

export function assertDailyNumberCoverLayoutsValid(
  rows: Array<{
    todayNumber: number;
    variant: string;
    summaryMessage: string;
  }>,
  options?: { onlyFilled?: boolean },
): void {
  const onlyFilled = options?.onlyFilled ?? true;
  const errors: string[] = [];

  for (const row of rows) {
    if (onlyFilled && !row.summaryMessage.trim()) continue;
    const issue = validateCoverSummaryText(row.summaryMessage);
    if (issue) {
      errors.push(formatCoverLayoutTextIssueContext({ ...row, issue }));
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `表紙の文字数チェックに失敗しました（${errors.length}件）:\n${errors.join("\n")}`,
    );
  }
}
