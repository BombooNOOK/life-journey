import { personalDayActivityDraft } from "@/lib/journal/commentPersonalDayActivityDraft";

import type {
  CommentTemplate,
  DiaryActionCategory,
  NumerologyNumber,
} from "./types";

const actionCategoryMap: Record<string, DiaryActionCategory> = {
  work_study: "work_study",
  family_friends: "family_friends",
  new_challenge: "new_challenge",
  rest: "rest",
  organize: "organize",
  enjoyed: "favorite_fun",
  outing: "outing",
  health_care: "health_care",
  very_happy: "very_happy",
  emotional_wave: "heart_unsettled",
  hard_day: "hard_day",
  sad: "sad",
  anxious: "anxious",
  irritated: "irritated",
  lost_confidence: "lost_confidence",
  no_energy: "nothing_to_do",
  down: "did_not_go_well",
  record_anyway: "ordinary_record",
};

export const baseComments: CommentTemplate[] = Object.entries(
  personalDayActivityDraft,
).flatMap(([activityKey, byDay]) => {
  const actionCategory = actionCategoryMap[activityKey];
  if (!actionCategory) return [];
  return Object.entries(byDay).map(([day, text]) => ({
    id: `${actionCategory}_${day}_a`,
    actionCategory,
    personalDay: Number(day) as NumerologyNumber,
    text,
  }));
});
