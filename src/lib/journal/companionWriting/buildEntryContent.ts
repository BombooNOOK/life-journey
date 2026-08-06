import type { ActivityId, MoodId } from "@/lib/journal/meta";

import { getCompanionDayLabel, getCompanionMoodLabel } from "./companionPrompt";

export type BuildCompanionWritingContentInput = {
  mood: MoodId;
  activity: ActivityId;
  companionName: string;
  companionShortLine: string;
  generatedBody: string;
};

/** 既存 JournalEntry.content にそのまま保存できる自然なあしあと文 */
export function buildCompanionWritingEntryContent(
  input: BuildCompanionWritingContentInput,
): string {
  const moodLabel = getCompanionMoodLabel(input.mood);
  const dayLabel = getCompanionDayLabel(input.activity);
  const body = input.generatedBody.trim();
  const companionName = input.companionName.trim();
  const companionShortLine = input.companionShortLine.trim();

  const paragraphs = [
    `今日は、${moodLabel}気分。`,
    `「${dayLabel}」として残したい一日。`,
    "",
    `${companionName}に「${companionShortLine}」と言われた。`,
    "",
    body,
  ];

  return paragraphs.join("\n").trim();
}
