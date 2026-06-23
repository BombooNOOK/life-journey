import { type ActivityId, activityOptionIds, isActivityId } from "@/lib/journal/meta";

/**
 * 製本プレビュー・PDF「きもちの記録」欄の改行（約10字/行・読みやすさ優先）。
 * 入力UIの `<select>` ラベル（`activityOptions[].label`）とは別。
 */
export const ACTIVITY_BINDING_LABEL_LINES: Record<ActivityId, readonly string[]> = {
  work_study: ["仕事・勉強を", "がんばった"],
  family_friends: ["家族・友人と", "過ごした"],
  new_challenge: ["新しいことを", "した"],
  rest: ["ゆっくり", "休んだ"],
  organize: ["整理・片づけを", "した"],
  enjoyed: ["好きなことを", "楽しんだ"],
  outing: ["移動・おでかけを", "した"],
  health_care: ["体調を", "整えた"],
  very_happy: ["とても嬉しいこと", "があった"],
  emotional_wave: ["心が", "ざわついた"],
  hard_day: ["しんどかった"],
  sad: ["悲しい気持ちが", "あった"],
  anxious: ["不安が", "強かった"],
  irritated: ["イライラ", "した"],
  lost_confidence: ["自信を", "なくした"],
  no_energy: ["何もしたくない日", "だった"],
  down: ["うまくいかず", "落ち込んだ"],
  record_anyway: ["特別なことはない", "けれど、記録したい"],
};

export function getActivityBindingLabelLines(activity: string): string[] {
  const id: ActivityId = isActivityId(activity) ? activity : "record_anyway";
  return [...ACTIVITY_BINDING_LABEL_LINES[id]];
}

/** 全 activity id に製本用改行が定義されていること */
export function assertActivityBindingLabelLinesComplete(): void {
  for (const id of activityOptionIds) {
    if (!ACTIVITY_BINDING_LABEL_LINES[id]?.length) {
      throw new Error(`Missing binding label lines for activity: ${id}`);
    }
  }
}
