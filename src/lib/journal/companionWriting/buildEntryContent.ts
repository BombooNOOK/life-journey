import { getCompanionLabel } from "@/lib/journal/meta";
import type { CompanionType, MoodId } from "@/lib/journal/meta";

import {
  formatMoodForDiary,
  getCompanionWritingFeedbackLabel,
} from "./messages";
import type { CompanionWritingFeedbackId } from "./types";

export type BuildCompanionWritingContentInput = {
  mood: MoodId;
  companionType: CompanionType;
  openingMessage: string;
  feedback: CompanionWritingFeedbackId;
  followUpQuestion: string;
  userAnswer: string;
};

/** 既存 JournalEntry.content にそのまま保存できる自然な日記文 */
export function buildCompanionWritingEntryContent(
  input: BuildCompanionWritingContentInput,
): string {
  const moodPhrase = formatMoodForDiary(input.mood);
  const companionLabel = getCompanionLabel(input.companionType);
  const feedbackLabel = getCompanionWritingFeedbackLabel(input.feedback);
  const answer = input.userAnswer.trim();

  const paragraphs = [
    `今日は、${moodPhrase}気分。`,
    "",
    `${companionLabel}は、こういってくれた。`,
    `「${input.openingMessage.trim()}」`,
    "",
    `そのことばは「${feedbackLabel}」。`,
    `「${input.followUpQuestion.trim()}」`,
    "",
    answer,
  ];

  return paragraphs.join("\n").trim();
}
