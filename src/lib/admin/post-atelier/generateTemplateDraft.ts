import { getCompanionLabel } from "@/lib/journal/meta";
import {
  DIARY_NUMBER_VALUES,
  NUMEROLOGY_NUMBER_MEANINGS,
  type DiaryNumberValue,
} from "@/lib/journal/numerologyNumberMeanings";

import { SOCIAL_POST_PLATFORM_LABELS, type SocialPostPlatform } from "./types";

export type TemplateDraftInput = {
  theme: string;
  companionType: string;
  platform: SocialPostPlatform;
  scheduledDate: string;
  todayNumber: number | null;
};

function isDiaryNumberValue(n: number): n is DiaryNumberValue {
  return (DIARY_NUMBER_VALUES as readonly number[]).includes(n);
}

function formatScheduledDateLabel(scheduledDate: string): string {
  if (!scheduledDate) return "（予定日未設定）";
  const [y, m, d] = scheduledDate.split("-");
  if (!y || !m || !d) return scheduledDate;
  return `${y}年${Number(m)}月${Number(d)}日`;
}

function buildTodayNumberBlock(todayNumber: number | null): string {
  if (todayNumber != null && isDiaryNumberValue(todayNumber)) {
    const entry = NUMEROLOGY_NUMBER_MEANINGS[todayNumber];
    return `【ユニバーサルデイ ${todayNumber}｜${entry.title}】
${entry.description}

${entry.diaryHint}`;
  }
  return `【ユニバーサルデイ】
（投稿予定日を入力すると、その日のユニバーサルデイが入ります）`;
}

/** 外部 AI なしのテンプレート仮生成 */
export function generateTemplateDraftBody(input: TemplateDraftInput): string {
  const companion = getCompanionLabel(input.companionType);
  const theme = input.theme.trim() || "（テーマ未入力）";
  const dateLabel = formatScheduledDateLabel(input.scheduledDate);
  const platformLabel = SOCIAL_POST_PLATFORM_LABELS[input.platform] ?? input.platform;
  const numberBlock = buildTodayNumberBlock(input.todayNumber);

  return `${dateLabel}｜${platformLabel}

${companion}と一緒に、その日のユニバーサルデイをやさしく見つめてみませんか。

${numberBlock}

---
テーマ：${theme}
（ここから自由に編集してください）`;
}

export function assembleSocialPostCopyText(input: {
  bodyText: string;
  hashtags: string;
  linkUrl: string;
}): string {
  const parts: string[] = [];
  const body = input.bodyText.trim();
  if (body) parts.push(body);

  const tags = input.hashtags.trim();
  if (tags) parts.push(tags);

  const link = input.linkUrl.trim();
  if (link) parts.push(link);

  return parts.join("\n\n");
}
