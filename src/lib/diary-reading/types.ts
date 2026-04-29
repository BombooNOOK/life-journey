export type DiaryActionCategory =
  | "work_study"
  | "family_friends"
  | "new_challenge"
  | "rest"
  | "organize"
  | "favorite_fun"
  | "outing"
  | "health_care"
  | "very_happy"
  | "heart_unsettled"
  | "hard_day"
  | "sad"
  | "anxious"
  | "irritated"
  | "lost_confidence"
  | "nothing_to_do"
  | "did_not_go_well"
  | "ordinary_record";

export type MoodType =
  | "smile"
  | "calm"
  | "tired"
  | "moyamoya"
  | "sad"
  | "angry"
  | "anxious";

export type NumerologyNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type DiaryReadingInput = {
  actionCategory: DiaryActionCategory;
  mood: MoodType;
  personalYear: NumerologyNumber;
  personalMonth: NumerologyNumber;
  personalDay: NumerologyNumber;
  calendarMonth: number; // 1-12
  calendarDay: number; // 1-31
  recentTemplateIds?: string[];
};

export type CommentTemplate = {
  id: string;
  actionCategory: DiaryActionCategory;
  personalDay: NumerologyNumber;
  text: string;
};

export type AccentTemplate = {
  id: string;
  number: NumerologyNumber;
  type: "calendar_month" | "calendar_day" | "special_overlap";
  text: string;
};
