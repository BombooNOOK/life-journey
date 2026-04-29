export const companionTypes = [
  "owl",
  "hedgehog",
  "squirrel",
  "sloth",
  "frog",
] as const;

export type CompanionType = (typeof companionTypes)[number];

export const diaryDesignOptions = [
  { id: "cute", label: "かわいい系（スタンダード）" },
  { id: "simple", label: "シンプル系" },
] as const;

export type DiaryDesignId = (typeof diaryDesignOptions)[number]["id"];
export const diaryDesignIds = diaryDesignOptions.map((d) => d.id);

export const moodOptions = [
  { id: "happy", label: "うれしい", emoji: "😊" },
  { id: "calm", label: "おだやか", emoji: "🙂" },
  { id: "normal", label: "ふつう", emoji: "😌" },
  { id: "tired", label: "つかれた", emoji: "😮‍💨" },
  { id: "moody", label: "もやもや", emoji: "😔" },
] as const;

export type MoodId = (typeof moodOptions)[number]["id"];

export const moodOptionIds = moodOptions.map((m) => m.id);

export const activityOptions = [
  { id: "work_study", label: "仕事・勉強をがんばった" },
  { id: "family_friends", label: "家族・友人と過ごした" },
  { id: "new_challenge", label: "新しいことをした" },
  { id: "rest", label: "ゆっくり休んだ" },
  { id: "organize", label: "整理・片づけをした" },
  { id: "enjoyed", label: "好きなことを楽しんだ" },
  { id: "outing", label: "移動・おでかけをした" },
  { id: "health_care", label: "体調を整えた" },
  { id: "very_happy", label: "とても嬉しいことがあった" },
  { id: "emotional_wave", label: "心がざわついた" },
  { id: "hard_day", label: "しんどかった" },
  { id: "sad", label: "悲しい気持ちがあった" },
  { id: "anxious", label: "不安が強かった" },
  { id: "irritated", label: "イライラした" },
  { id: "lost_confidence", label: "自信をなくした" },
  { id: "no_energy", label: "何もしたくない日だった" },
  { id: "down", label: "うまくいかず落ち込んだ" },
  { id: "record_anyway", label: "特別なことはないけれど、記録したい" },
] as const;

export type ActivityId = (typeof activityOptions)[number]["id"];
export const activityOptionIds = activityOptions.map((a) => a.id);

export function isCompanionType(value: string): value is CompanionType {
  return companionTypes.includes(value as CompanionType);
}

export function isMoodId(value: string): value is MoodId {
  return moodOptionIds.includes(value as MoodId);
}

export function isActivityId(value: string): value is ActivityId {
  return activityOptionIds.includes(value as ActivityId);
}

export function isDiaryDesignId(value: string): value is DiaryDesignId {
  return diaryDesignIds.includes(value as DiaryDesignId);
}

export function getMoodMeta(mood: string) {
  return moodOptions.find((m) => m.id === mood) ?? moodOptions[1];
}

export function getActivityMeta(activity: string) {
  return activityOptions.find((a) => a.id === activity) ?? activityOptions[10];
}

export function getCompanionStamp(companion: string): string {
  switch (companion) {
    case "hedgehog":
      return "🐾";
    case "squirrel":
      return "🐾";
    case "sloth":
      return "🐾";
    case "frog":
      return "🐾";
    case "owl":
    default:
      return "🐾";
  }
}
