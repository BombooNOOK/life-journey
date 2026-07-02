import {
  activityOptions,
  companionTypes,
  moodOptions,
  type ActivityId,
  type CompanionType,
  type MoodId,
} from "@/lib/journal/meta";

/** 18択の温度感 */
export type CompanionDayTone = "positive" | "softPositive" | "negative" | "neutral";

/** companionShortLine の出し分け枠 */
export type CompanionShortLineBucket = "positive" | "soft" | "negative" | "neutral";

/** 18択ごとの画面上の受け止め文（dayLabel 主役・mood は含めない） */
const ACTIVITY_ACKNOWLEDGMENT_LINE: Record<ActivityId, string> = {
  work_study: "がんばった一日だったんですね。",
  family_friends: "家族や友人と過ごした時間だったんですね。",
  new_challenge: "新しい挑戦の一日だったんですね。",
  rest: "ゆっくり休めた一日だったんですね。",
  organize: "整理や片づけの時間だったんですね。",
  enjoyed: "好きなことの時間だったんですね。",
  outing: "おでかけの一日だったんですね。",
  health_care: "体調を整えた一日だったんですね。",
  very_happy: "とても嬉しかった一日だったんですね。",
  emotional_wave: "心がざわつくような日だったんですね。",
  hard_day: "しんどさを感じながら過ごした日だったんですね。",
  sad: "悲しさのある一日だったんですね。",
  anxious: "不安の強かった一日だったんですね。",
  irritated: "イライラのあった一日だったんですね。",
  lost_confidence: "自信をなくした一日だったんですね。",
  no_energy: "何もしたくない日だったんですね。",
  down: "落ち込んだ一日だったんですね。",
  record_anyway: "特別なことがなくても、残しておきたい日ってありますよね。",
};

/** 18択ごとの温度感 */
const ACTIVITY_DAY_TONE: Record<ActivityId, CompanionDayTone> = {
  work_study: "positive",
  family_friends: "positive",
  new_challenge: "positive",
  enjoyed: "positive",
  very_happy: "positive",
  rest: "softPositive",
  organize: "softPositive",
  outing: "softPositive",
  health_care: "softPositive",
  emotional_wave: "negative",
  hard_day: "negative",
  sad: "negative",
  anxious: "negative",
  irritated: "negative",
  lost_confidence: "negative",
  no_energy: "negative",
  down: "negative",
  record_anyway: "neutral",
};

/** 案内役 × 温度感ごとの短い一言（各2種類） */
const COMPANION_SHORT_LINES: Record<
  CompanionType,
  Record<CompanionShortLineBucket, readonly [string, string]>
> = {
  owl: {
    positive: [
      "今日の中で、心に残ったことをひとつ見つけてみましょう",
      "少しずつ整えていけば、きっと大丈夫ですよ",
    ],
    soft: [
      "答えを急がず、今の気持ちをそっと置いてみましょう",
      "ゆっくり振り返れば、今日の輪郭が見えてきますよ",
    ],
    negative: [
      "しんどいときほど、言葉は小さくて大丈夫ですよ",
      "今の気持ちを、そのまま少しだけ置いてみましょう",
    ],
    neutral: [
      "特別なことはなくても、残しておく価値はありますよ",
      "なんとなくの一日も、そっと残しておきましょう",
    ],
  },
  hedgehog: {
    positive: [
      "小さく残せば、それで大丈夫だよ",
      "うまくいったことを、ひとつだけ拾ってみよう",
    ],
    soft: [
      "言葉になりそうなところだけ、そっと置いてみよう",
      "無理にきれいに書かなくても大丈夫だよ",
    ],
    negative: [
      "つらい気持ちも、小さく書けば十分だよ",
      "今日は短くでも、それで大事だよ",
    ],
    neutral: [
      "なんとなくの一日も、残しておいていいよ",
      "ぼんやりした気持ちも、そのままでいいよ",
    ],
  },
  sloth: {
    positive: [
      "急がなくても、今日のことばはちゃんと残せるよ",
      "のんびり振り返っても、今日はちゃんとあったよ",
    ],
    soft: [
      "ゆっくり思い出せるところからで大丈夫だよ",
      "ひと休みするように、少しだけ書いてみよう",
    ],
    negative: [
      "しんどい日は、一言でも残せば十分だよ",
      "今日の気持ちを、そのまま置いておこう",
    ],
    neutral: [
      "なんとなくの一日も、のんびり残していいよ",
      "ぼんやりした気持ちも、そのままで大丈夫だよ",
    ],
  },
  squirrel: {
    positive: [
      "小さなできごとを、ひとつ拾ってみよう",
      "今日の中で、きらっとした場面はあったかな",
    ],
    soft: [
      "覚えておきたいことを、ひとつだけ持って帰ろう",
      "今日のことばを、ゆっくりひとつ残そう",
    ],
    negative: [
      "しんどい日も、小さな一言で十分だよ",
      "今日の気持ちを、そのまま少しだけ置いてみよう",
    ],
    neutral: [
      "なんとなくの一日も、拾っておこう",
      "ささやかなことでも、残しておいていいよ",
    ],
  },
  frog: {
    positive: [
      "心に残った余韻を、ひとつ言葉にしてみよう",
      "今日の音を、少しだけ聞かせて",
    ],
    soft: [
      "今日の中で、まだ響いていることはあるかな",
      "静かな一日の余韻を、そっと残してみよう",
    ],
    negative: [
      "ざわつく気持ちも、そのまま少し置いてみよう",
      "しんどい日の余韻も、短く残せばいいよ",
    ],
    neutral: [
      "なんとなくの一日の音も、聞いておこう",
      "静かな一日を、そっと残してみよう",
    ],
  },
};

const UPBEAT_MOODS = new Set<MoodId>(["happy", "calm", "normal"]);
const HEAVY_MOODS = new Set<MoodId>(["tired", "moody"]);
const SOFT_POSITIVE_MOODS = new Set<MoodId>(["happy", "calm"]);

function stablePickIndex(seed: string, length: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % length;
}

export function getCompanionActivityTone(activity: ActivityId): CompanionDayTone {
  return ACTIVITY_DAY_TONE[activity] ?? "neutral";
}

export function getCompanionMoodLabel(mood: MoodId): string {
  return moodOptions.find((m) => m.id === mood)?.label ?? "ふつう";
}

export function getCompanionDayLabel(activity: ActivityId): string {
  return activityOptions.find((a) => a.id === activity)?.label ?? "記録したい一日";
}

/** 画面上のみ：dayLabel を主役にした受け止め文 */
export function buildCompanionAcknowledgmentLine(activity: ActivityId): string {
  return (
    ACTIVITY_ACKNOWLEDGMENT_LINE[activity] ??
    ACTIVITY_ACKNOWLEDGMENT_LINE.record_anyway
  );
}

/** dayLabel.tone と moodLabel から companionShortLine の枠を決める */
export function resolveCompanionShortLineBucket(
  activity: ActivityId,
  mood: MoodId,
): CompanionShortLineBucket {
  const dayTone = getCompanionActivityTone(activity);

  if (dayTone === "negative") return "negative";
  if (dayTone === "neutral") return "neutral";

  if (dayTone === "positive") {
    if (UPBEAT_MOODS.has(mood)) return "positive";
    return pickSoftOrNeutralBucket(`${activity}:${mood}:positive-fallback`);
  }

  if (SOFT_POSITIVE_MOODS.has(mood)) return "positive";
  return pickSoftOrNeutralBucket(`${activity}:${mood}:soft-positive-fallback`);
}

function pickSoftOrNeutralBucket(seed: string): CompanionShortLineBucket {
  return stablePickIndex(seed, 2) === 0 ? "soft" : "neutral";
}

/** 案内役の短い一言を選ぶ（dayLabel.tone × moodLabel × 案内役で安定して同じ行を返す） */
export function pickCompanionShortLine(
  companionType: CompanionType,
  mood: MoodId,
  activity: ActivityId,
): string {
  const bucket = resolveCompanionShortLineBucket(activity, mood);
  const lines = COMPANION_SHORT_LINES[companionType][bucket];
  const index = stablePickIndex(`${companionType}:${mood}:${activity}:${bucket}`, lines.length);
  return lines[index] ?? lines[0]!;
}

export function assertCompanionPromptPartsComplete(): void {
  for (const activity of activityOptions) {
    if (!ACTIVITY_ACKNOWLEDGMENT_LINE[activity.id]?.trim()) {
      throw new Error(`Missing acknowledgmentLine: ${activity.id}`);
    }
    if (!ACTIVITY_DAY_TONE[activity.id]) {
      throw new Error(`Missing dayTone: ${activity.id}`);
    }
  }
  for (const companion of companionTypes) {
    const buckets = COMPANION_SHORT_LINES[companion];
    for (const bucket of ["positive", "soft", "negative", "neutral"] as const) {
      const lines = buckets[bucket];
      if (!lines || lines.length !== 2) {
        throw new Error(`Missing companionShortLines: ${companion}/${bucket}`);
      }
      for (const line of lines) {
        if (!line.trim()) {
          throw new Error(`Empty companionShortLine: ${companion}/${bucket}`);
        }
      }
    }
  }
}
