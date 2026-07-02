import {
  activityOptions,
  companionTypes,
  moodOptions,
  type ActivityId,
  type CompanionType,
  type MoodId,
} from "@/lib/journal/meta";

/** 受け止め文の組み立て用（例：おだやかな、うれしい） */
const COMPANION_MOOD_PHRASE: Record<MoodId, string> = {
  happy: "うれしい",
  calm: "おだやかな",
  normal: "ふつうの",
  tired: "少しつかれた",
  moody: "もやもやした",
};

/** 18択ごとの dayPhrase（画面上の受け止め文のみ） */
const ACTIVITY_DAY_PHRASE: Record<ActivityId, string> = {
  work_study: "がんばった一日",
  family_friends: "家族や友人と過ごした時間",
  new_challenge: "新しい挑戦の一日",
  rest: "静かに過ごした時間",
  organize: "整理や片づけの時間",
  enjoyed: "好きなことの時間",
  outing: "おでかけの一日",
  health_care: "体調を整えた一日",
  very_happy: "とても嬉しかった一日",
  emotional_wave: "心がざわついた一日",
  hard_day: "しんどかった一日",
  sad: "悲しさのある一日",
  anxious: "不安の強かった一日",
  irritated: "イライラのあった一日",
  lost_confidence: "自信をなくした一日",
  no_energy: "何もしたくない一日",
  down: "落ち込んだ一日",
  record_anyway: "なんとなく過ぎた一日",
};

/** 案内役ごとの短い一言（2〜3種類） */
const COMPANION_SHORT_LINES: Record<CompanionType, readonly string[]> = {
  owl: [
    "少しずつ整理していけば大丈夫ですよ",
    "今日の中で、心に残ったことをひとつ見つけてみましょう",
    "答えを急がず、今の気持ちをそっと置いてみましょう",
  ],
  hedgehog: [
    "小さく残せば、それで大丈夫だよ",
    "言葉になりそうなところだけ、そっと置いてみよう",
    "無理にきれいに書かなくても大丈夫だよ",
  ],
  sloth: [
    "急がなくても、今日のことばはちゃんと残せるよ",
    "ゆっくり思い出せるところからで大丈夫だよ",
    "ひと休みするように、少しだけ書いてみよう",
  ],
  squirrel: [
    "小さなできごとを、ひとつ拾ってみよう",
    "今日の中で、きらっとした場面はあったかな",
    "覚えておきたいことを、ひとつだけ持って帰ろう",
  ],
  frog: [
    "今日の音を、少しだけ聞かせて",
    "心に残った余韻を、ひとつ言葉にしてみよう",
    "今日の中で、まだ響いていることはあるかな",
  ],
};

function stablePickIndex(seed: string, length: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % length;
}

export function getCompanionMoodLabel(mood: MoodId): string {
  return moodOptions.find((m) => m.id === mood)?.label ?? "ふつう";
}

export function getCompanionDayLabel(activity: ActivityId): string {
  return activityOptions.find((a) => a.id === activity)?.label ?? "記録したい一日";
}

export function getCompanionMoodPhrase(mood: MoodId): string {
  return COMPANION_MOOD_PHRASE[mood] ?? COMPANION_MOOD_PHRASE.normal;
}

export function getCompanionDayPhrase(activity: ActivityId): string {
  return ACTIVITY_DAY_PHRASE[activity] ?? ACTIVITY_DAY_PHRASE.record_anyway;
}

/** 画面上のみ：dayPhrase + moodPhrase の受け止め文 */
export function buildCompanionAcknowledgmentLine(mood: MoodId, activity: ActivityId): string {
  const dayPhrase = getCompanionDayPhrase(activity);
  const moodPhrase = getCompanionMoodPhrase(mood);
  return `${dayPhrase}を、${moodPhrase}気分で振り返っているんですね。`;
}

/** 案内役の短い一言を選ぶ（気分・18択・案内役で安定して同じ行を返す） */
export function pickCompanionShortLine(
  companionType: CompanionType,
  mood: MoodId,
  activity: ActivityId,
): string {
  const lines = COMPANION_SHORT_LINES[companionType];
  const index = stablePickIndex(`${companionType}:${mood}:${activity}`, lines.length);
  return lines[index] ?? lines[0]!;
}

export function assertCompanionPromptPartsComplete(): void {
  for (const activity of activityOptions) {
    if (!ACTIVITY_DAY_PHRASE[activity.id]?.trim()) {
      throw new Error(`Missing dayPhrase: ${activity.id}`);
    }
  }
  for (const mood of moodOptions) {
    if (!COMPANION_MOOD_PHRASE[mood.id]?.trim()) {
      throw new Error(`Missing moodPhrase: ${mood.id}`);
    }
  }
  for (const companion of companionTypes) {
    const lines = COMPANION_SHORT_LINES[companion];
    if (!lines || lines.length < 2) {
      throw new Error(`Missing companionShortLines: ${companion}`);
    }
    for (const line of lines) {
      if (!line.trim()) {
        throw new Error(`Empty companionShortLine: ${companion}`);
      }
    }
  }
}
