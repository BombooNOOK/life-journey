import type { CompanionType } from "@/lib/journal/meta";
import { diaryBookEntryCompanionImagePath } from "@/lib/journal/diaryBookEntryAssets";

export type SaveAfterAnimalDefinition = {
  key: string;
  companionType: CompanionType;
  name: string;
  messages: readonly string[];
};

export const SAVE_AFTER_ANIMALS: readonly SaveAfterAnimalDefinition[] = [
  {
    key: "owl",
    companionType: "owl",
    name: "フクロウ先生",
    messages: [
      "今日の記録が、そっと一ページになりました。",
      "書き残した言葉は、あとから小さな手がかりになるかもしれません。",
      "この日のことを、少し時間をおいてまた見つめてみましょう。",
      "言葉になったことは、もうあなたの中に残っています。",
      "ページをめくる音が、静かに聞こえるような一日でした。",
    ],
  },
  {
    key: "hedgehog",
    companionType: "hedgehog",
    name: "ハリネズミくん",
    messages: [
      "ちゃんと残したんですね。まあ、悪くないと思います。",
      "書いたなら、それだけで今日はもう一ページ進んでます。",
      "あとで読み返したら、何か見えるかもしれませんよ。たぶん。",
      "無理にまとめなくても、書けた分はちゃんと残っています。",
      "このページは、また必要なときに開けばいいだけです。",
    ],
  },
  {
    key: "squirrel",
    companionType: "squirrel",
    name: "リスくん",
    messages: [
      "今日のページ、ちゃんとできましたね！",
      "あとから読むと、きっと少し違って見えるかもしれませんよ。",
      "またひとつ、あなたの記録が増えましたね！",
      "書いた分だけ、今日の本は少し厚くなりました。",
      "この一行は、いつかあなたに届く準備ができています。",
    ],
  },
  {
    key: "kerosion",
    companionType: "frog",
    name: "ケロシオン",
    messages: [
      "言葉に残したことで、この日は少し違う形を持ちました。",
      "記録することは、自分の時間をそっと受け取ることでもあります。",
      "今日残した言葉は、いつか別の角度からあなたに届くかもしれません。",
      "書いたことは、静かにページの上に留まっています。",
      "この記録は、あとからゆっくり味わえば十分です。",
    ],
  },
  {
    key: "sloth",
    companionType: "sloth",
    name: "ナマケモノくん",
    messages: [
      "今日もここまで来ましたねえ。",
      "書けた分だけで、今日は十分です。",
      "また読みたくなったら、ゆっくり開けばいいですよ。",
      "急がなくて大丈夫。このページは待っていてくれます。",
      "今日の記録は、のんびり効いてきます。",
    ],
  },
] as const;

export type SaveAfterAnimalPick = {
  key: string;
  companionType: CompanionType;
  name: string;
  message: string;
  imagePath: string;
};

export function pickSaveAfterAnimalMessage(): SaveAfterAnimalPick {
  const animalIndex = Math.floor(Math.random() * SAVE_AFTER_ANIMALS.length);
  const animal = SAVE_AFTER_ANIMALS[animalIndex] ?? SAVE_AFTER_ANIMALS[0];
  const messageIndex = Math.floor(Math.random() * animal.messages.length);
  const message = animal.messages[messageIndex] ?? animal.messages[0] ?? "";
  return {
    key: animal.key,
    companionType: animal.companionType,
    name: animal.name,
    message,
    imagePath: diaryBookEntryCompanionImagePath(animal.companionType),
  };
}

/** 1段目：前置き演出（0.8〜1.2秒） */
export const SAVE_TRANSITION_PHASE1_MS = 1000;

/** 2段目：どうぶつカード（1.5〜2.0秒） */
export const SAVE_TRANSITION_PHASE2_MS = 1750;

export const SAVE_TRANSITION_TOTAL_MS = SAVE_TRANSITION_PHASE1_MS + SAVE_TRANSITION_PHASE2_MS;

/** 演出開始時刻から、プレビュー遷移まであと何 ms 待つか */
export function journalSaveTransitionRemainingMs(startedAt: number, now = Date.now()): number {
  return Math.max(0, SAVE_TRANSITION_TOTAL_MS - (now - startedAt));
}

export const SAVE_TRANSITION_OPENING_TEXT = "フクロウ先生が、\nこの日の数字をひらいています…";
