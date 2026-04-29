import {
  personalDayNumber,
  personalMonthNumber,
  personalYearNumber,
} from "@/lib/numerology/personalYearMonth";

import { generateDiaryReading } from "./generateDiaryReading";
import type {
  DiaryActionCategory,
  DiaryReadingInput,
  MoodType,
  NumerologyNumber,
} from "./types";

type BuildFromJournalInput = {
  activity: string;
  mood: string;
  /** Calendar date used for PY/PM/PD (must match `createdAt` / 記録日 shown in the diary UI). */
  referenceDate: Date;
  birthMonth: number | null;
  birthDay: number | null;
  recentTemplateIds?: string[];
};

const activityMap: Record<string, DiaryActionCategory> = {
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

const moodMap: Record<string, MoodType> = {
  happy: "smile",
  calm: "calm",
  normal: "calm",
  tired: "tired",
  moody: "moyamoya",
};

function toNumerologyNumber(value: number): NumerologyNumber {
  if (value >= 1 && value <= 9) return value as NumerologyNumber;
  const safe = ((Math.abs(Math.trunc(value)) - 1) % 9) + 1;
  return safe as NumerologyNumber;
}

export function buildDiaryReadingFromJournalInput(input: BuildFromJournalInput): {
  text: string;
  usedTemplateIds: string[];
} {
  const actionCategory = activityMap[input.activity] ?? "ordinary_record";
  const mood = moodMap[input.mood] ?? "calm";
  const date = input.referenceDate;
  const birthMonth = input.birthMonth ?? 1;
  const birthDay = input.birthDay ?? 1;

  const py = toNumerologyNumber(
    personalYearNumber(birthMonth, birthDay, date.getFullYear()),
  );
  const pm = toNumerologyNumber(personalMonthNumber(py, date.getMonth() + 1));
  const pd = toNumerologyNumber(personalDayNumber(pm, date.getDate()));

  const readingInput: DiaryReadingInput = {
    actionCategory,
    mood,
    personalYear: py,
    personalMonth: pm,
    personalDay: pd,
    calendarMonth: date.getMonth() + 1,
    calendarDay: date.getDate(),
    recentTemplateIds: input.recentTemplateIds,
  };

  return generateDiaryReading(readingInput);
}
