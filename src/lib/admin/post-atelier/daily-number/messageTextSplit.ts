import type { DailyNumberMessage, DailyNumberTodayValue } from "./types";

/** 画像用：本文の先頭から最初の「。」まで（「。」なしなら全文） */
export function extractImageBody(body: string): string {
  const normalized = body.replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  const periodIndex = normalized.indexOf("。");
  if (periodIndex === -1) return normalized;
  return normalized.slice(0, periodIndex + 1);
}

export type DailyNumberBlockImageText = {
  number: DailyNumberMessage["lifePathNumber"];
  todayNumber: DailyNumberTodayValue;
  imageBody: string;
  charmColor: string;
};

export type DailyNumberBlockCaptionText = {
  number: DailyNumberMessage["lifePathNumber"];
  todayNumber: DailyNumberTodayValue;
  fullBody: string;
};

export function buildBlockImageText(
  block: DailyNumberMessage,
  todayNumber: DailyNumberTodayValue,
): DailyNumberBlockImageText {
  return {
    number: block.lifePathNumber,
    todayNumber,
    imageBody: extractImageBody(block.body),
    /** 画像合成時の短縮表記は compositeImages 側で formatCharmColorForImage を適用 */
    charmColor: block.colorName,
  };
}

export function buildBlockCaptionText(
  block: DailyNumberMessage,
  todayNumber: DailyNumberTodayValue,
): DailyNumberBlockCaptionText {
  return {
    number: block.lifePathNumber,
    todayNumber,
    fullBody: block.body.replace(/\s+/g, " ").trim(),
  };
}

export function listBlockImageTexts(
  blocks: DailyNumberMessage[],
  todayNumber: DailyNumberTodayValue,
): DailyNumberBlockImageText[] {
  return blocks.map((block) => buildBlockImageText(block, todayNumber));
}

export function listBlockCaptionTexts(
  blocks: DailyNumberMessage[],
  todayNumber: DailyNumberTodayValue,
): DailyNumberBlockCaptionText[] {
  return blocks.map((block) => buildBlockCaptionText(block, todayNumber));
}
