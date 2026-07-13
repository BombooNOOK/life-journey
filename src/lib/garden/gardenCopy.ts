import {
  GARDEN_WATER_GOAL,
  type GardenGrowthStage,
} from "@/lib/garden/gardenGrowth";

/** ステージごとのひとこと（表示時に日付シードで1つ選ぶ）— 急かさないトーン */
export const GARDEN_STAGE_COMMENTS: Record<GardenGrowthStage, readonly string[]> = {
  1: [
    "ちいさな芽が、そっと顔を出しました",
    "まだ小さいけれど、ちゃんと育っています",
    "ゆっくりで大丈夫。森のペースでいきましょう",
  ],
  2: [
    "葉が、すこしだけ増えました",
    "今日も森の空気をすって、すくすくです",
    "ゆっくり育っています",
  ],
  3: [
    "茎が、しっかりしてきたようです",
    "日なたのきもちよさを、覚えはじめました",
    "あなたが来てくれると、うれしそうです",
  ],
  4: [
    "葉の色が、少し濃くなりました",
    "お庭の風が、やさしく通り過ぎます",
    "きょうも、ひとくちだけお水がうれしいです",
  ],
  5: [
    "つぼみの気配が、すこしあります",
    "急がなくていい。森のペースでいきましょう",
    "今日も少し育っています",
  ],
  6: [
    "つぼみが、かわいくふくらんできました",
    "今日も少しずつ、大きくなっています",
    "ゆっくり育っています",
  ],
  7: [
    "つぼみが、色づきはじめました",
    "お水の日々が、ちゃんと積み重なっています",
    "今日も少し育っています",
  ],
  8: [
    "花びらが、そっと見えはじめています",
    "あなたのお庭が、いちだんと華やぎそうです",
    "ゆっくりで大丈夫。ちゃんと生きています",
  ],
  9: [
    "咲きかけの花が、光をまっています",
    "今日も少し育っています",
    "ここまで、いっしょに過ごせてうれしいです",
  ],
  10: [
    "今日も見に来てくれてありがとう",
    "きれいなお花が咲きました",
    "ここまで育ててくれて、ありがとう",
  ],
};

export const GARDEN_PAGE_TITLE = "お庭" as const;

export const GARDEN_PAGE_DESCRIPTION =
  "ログハウスのそばで、小さな植物を育てられます。" as const;

export const GARDEN_WATER_BUTTON_LABEL = "お水をあげる" as const;

export const GARDEN_STATUS_NOT_WATERED = "気が向いたら、お水をあげてみてください" as const;
export const GARDEN_STATUS_WATERED = "今日はもうお水をもらいました" as const;
export const GARDEN_STATUS_COMPLETE = "きれいなお花が咲きました" as const;

export const GARDEN_WATERED_SOFT_MESSAGE =
  "今日はもうお水をもらって、うれしそうです" as const;

export const GARDEN_COMPLETE_TITLE = "きれいなお花が咲きました" as const;
export const GARDEN_COMPLETE_SUB =
  `${GARDEN_WATER_GOAL}日分のお水で、\nここまで育ちました。` as const;
export const GARDEN_COMPLETE_PROMPT = "このお花をどうしますか？" as const;
export const GARDEN_COMPLETE_BODY = GARDEN_COMPLETE_PROMPT;

export const GARDEN_GROWING_SUB = "今日も少し育っています" as const;

export const GARDEN_BLOOM_CHOICE_DISPLAY = "お庭に飾る" as const;
export const GARDEN_BLOOM_CHOICE_KEEP = "このまま置いておく" as const;
export const GARDEN_BLOOM_CHOICE_SHARE = "クマくんのショップにおすそわけする" as const;

export const GARDEN_DISPLAY_DONE_MESSAGE =
  "お花をお庭に飾りました。\nログハウスのそばに、またひとつ思い出が増えました。" as const;

export const GARDEN_KEEP_DONE_MESSAGE =
  "このまま、もう少し眺めておくことにしました。\nお花はいつでも飾ることができます。" as const;

export const GARDEN_SHARE_COMING_SOON_MESSAGE =
  "クマくんのショップにお花をおすそわけすると、\nお礼にどんぐりがもらえます。\n\nいまは準備中です。もうしばらくお待ちください。" as const;

export const GARDEN_DISPLAY_SLOTS_FULL_MESSAGE = "飾る場所がいっぱいです" as const;

export const GARDEN_DISPLAY_SLOT_PICK_PROMPT = "どの場所に飾りますか？" as const;

export const GARDEN_DISPLAY_SLOT_COUNT = 3 as const;

export const GARDEN_PAGE_PATH = "/orders/garden" as const;

/** メイン画面用：分母なしの進捗ラベル */
export function gardenProgressPrimaryLabel(waterCount: number, isComplete: boolean): string {
  if (isComplete) return GARDEN_COMPLETE_TITLE;
  if (waterCount <= 0) return "これから、ゆっくり育ちます";
  return `お水をあげた日：${waterCount}回目`;
}

/** メイン画面用：やわらかいサブ文言 */
export function gardenProgressSecondaryLabel(isComplete: boolean): string {
  if (isComplete) return GARDEN_COMPLETE_SUB;
  return GARDEN_GROWING_SUB;
}
