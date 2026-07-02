import {
  companionOptions,
  moodOptions,
  type CompanionType,
  type MoodId,
} from "@/lib/journal/meta";

import {
  companionWritingFeedbackOptions,
  type CompanionWritingFeedbackId,
} from "./types";

const moodIds = moodOptions.map((m) => m.id);

/** 気分 × どうぶつ鑑定士のことば（v0 静的テンプレ） */
const OPENING_MESSAGES: Record<CompanionType, Record<MoodId, string>> = {
  owl: {
    happy: "うれしい気持ちも、静かに残しておくと、あとから読み返しやすいものです。今日はどんなうれしさがありましたか？",
    calm: "おだやかな日は、言葉を急がなくて大丈夫です。いまの空気感を、そのまま置いておきましょう。",
    normal: "ふつうの日こそ、あとから振り返ると意味が見えてくることがあります。今日はどんな一日でしたか？",
    tired: "つかれた日も、ここに一行残せば十分です。今日はどんな重さを感じていますか？",
    moody: "もやもやは、すぐ言葉にしなくても大丈夫です。いま心に近い色は、どんな感じですか？",
  },
  hedgehog: {
    happy: "うれしいことがあったのですね。小さなうれしさでも、ちゃんと残しておきましょう。",
    calm: "おだやかな気分、いいですね。今日はゆっくり過ごせましたか？",
    normal: "ふつうの一日も、あなたにとって大切な記録です。いま思い浮かぶことを、そのまま置いてください。",
    tired: "つかれたときは、無理に元気を出さなくて大丈夫です。今日いちばんしんどかったことは何でしょう？",
    moody: "もやもやした気持ち、ひとりで抱え込まなくて大丈夫です。いま心に引っかかっていることはありますか？",
  },
  sloth: {
    happy: "うれしい日は、そのままゆっくり味わって大丈夫です。今日のうれしさを、ひとことで残してみませんか？",
    calm: "おだやかな一日、とてもいい流れですね。いまの気持ちを、そのまま置いておきましょう。",
    normal: "特別なことがなくても、今日はちゃんと過ごしてきました。いま心に残っていることは何ですか？",
    tired: "つかれた日は、休むことも大切な記録です。今日はどこで力を使いましたか？",
    moody: "もやもやする日も、自然なことです。いまいちばん気になることを、ゆっくり言葉にしてみませんか？",
  },
  squirrel: {
    happy: "うれしいことがあったんですね！ その気持ち、ちょっとだけ残しておきましょう。",
    calm: "おだやかな一日、いいペースですね。今日の空気感を、ひとことで置いておきませんか？",
    normal: "ふつうの日も、あとで読み返すと意外な発見があるかもしれません。いま思い浮かぶことを書いてみてください。",
    tired: "つかれた日は、ちょっとペースを落としても大丈夫です。今日いちばん疲れたのはどんなことでしたか？",
    moody: "もやもやした気分、置いていきましょう。いま心の中でぐるっとしていることは何ですか？",
  },
  frog: {
    happy: "うれしい日、いいですね。今日のうれしさを、ポンっと置いておきましょう。",
    calm: "おだやかな気分、とても穏やかですね。いまの心地よさを、そのまま残してみませんか？",
    normal: "ふつうの一日も、あなたの旅の一部です。今日いちばん印象に残ったことは何でしょう？",
    tired: "つかれた日は、無理せず短くでも大丈夫です。今日はどんなことが重く感じましたか？",
    moody: "もやもやも、雨のあとの空みたいに、いつかすっきりすることもあります。いま心に近いことは何ですか？",
  },
};

/** フィードバック別の一問（v0 は気分で微調整） */
const FOLLOW_UP_BY_FEEDBACK: Record<
  CompanionWritingFeedbackId,
  Record<MoodId, string>
> = {
  perfect_fit: {
    happy: "そのうれしさを、ひとことで残すならどんな言葉になりますか？",
    calm: "いまのおだやかな気持ちを、一言で残すとしたら何ですか？",
    normal: "今日の感覚を、いちばん近い言葉で残すとしたら何ですか？",
    tired: "今日のつかれの中でも、残しておきたいことはありますか？",
    moody: "もやもやの中でも、いま一番はっきりしていることは何ですか？",
  },
  somewhat: {
    happy: "少し響いたことばのあと、いま心に残っていることは何ですか？",
    calm: "今日、ひとつだけ置いていきたいものはありますか？",
    normal: "今日、ひとつだけ置いていきたいものはありますか？",
    tired: "今日、ひとつだけ置いていきたいものはありますか？",
    moody: "いまの気持ちに、いちばん近いことは何でしょう？",
  },
  different: {
    happy: "読み解きとは少し違うけれど、いまの気持ちに近いことは何ですか？",
    calm: "いまの気持ちに、いちばん近いことばは何でしょう？",
    normal: "いまの気持ちに、いちばん近いことばは何でしょう？",
    tired: "読み解きとは少し違うけれど、今日いちばん感じていることは何ですか？",
    moody: "もやもやの正体に、いまいちばん近いことは何でしょう？",
  },
  unsure: {
    happy: "まだはっきりしなくても大丈夫です。いま一番浮かんでいることは何ですか？",
    calm: "まだわからなくても大丈夫です。いま静かに感じていることは何ですか？",
    normal: "まだわからなくても大丈夫です。いま一番浮かんでいることは何ですか？",
    tired: "はっきりしなくても大丈夫です。いま体や心で感じていることは何ですか？",
    moody: "まだ言葉にならなくても大丈夫です。いま心に引っかかっていることはありますか？",
  },
};

/** 鑑定士ごとの一問差し替え（v0：一部のみ） */
const COMPANION_FOLLOW_UP_OVERRIDES: Partial<
  Record<
    CompanionType,
    Partial<Record<CompanionWritingFeedbackId, Partial<Record<MoodId, string>>>>
  >
> = {
  hedgehog: {
    somewhat: {
      tired: "今日、そっと手放したいことはありますか？",
      moody: "いま、心にいちばん近い小さなことは何でしょう？",
    },
  },
  sloth: {
    somewhat: {
      tired: "ゆっくりで大丈夫です。今日、少し楽にしたいことは何ですか？",
      calm: "いまのペースのまま、ひとつだけ残すなら何ですか？",
    },
  },
  squirrel: {
    perfect_fit: {
      happy: "そのうれしさ、誰に伝えたくなりますか？",
    },
    somewhat: {
      normal: "いま頭の中で、いちばん大きいことは何ですか？",
    },
  },
  frog: {
    different: {
      moody: "もやもやの奥に、小さな光は見えますか？",
    },
    unsure: {
      normal: "まだはっきりしなくても大丈夫。いまふと思い浮かんだことは？",
    },
  },
};

export function getCompanionOpeningMessage(
  companionType: CompanionType,
  mood: MoodId,
): string {
  return OPENING_MESSAGES[companionType][mood];
}

export function getCompanionFollowUpQuestion(
  feedback: CompanionWritingFeedbackId,
  mood: MoodId,
  companionType: CompanionType = "owl",
): string {
  const override = COMPANION_FOLLOW_UP_OVERRIDES[companionType]?.[feedback]?.[mood];
  if (override) return override;
  return FOLLOW_UP_BY_FEEDBACK[feedback][mood];
}

export function getCompanionWritingFeedbackLabel(
  feedback: CompanionWritingFeedbackId,
): string {
  const row = companionWritingFeedbackOptions.find((o) => o.id === feedback);
  return row?.label ?? feedback;
}

export function formatMoodForDiary(mood: MoodId): string {
  switch (mood) {
    case "happy":
      return "うれしい";
    case "calm":
      return "おだやかな";
    case "normal":
      return "ふつうの";
    case "tired":
      return "つかれた";
    case "moody":
      return "もやもやした";
    default:
      return moodOptions.find((m) => m.id === mood)?.label ?? "ふつうの";
  }
}

/** 鑑定士ラベル（表示用） */
export function getAppraiserDisplayName(companionType: CompanionType): string {
  return companionOptions.find((c) => c.id === companionType)?.label ?? "フクロウ先生";
}

export function assertCompanionWritingMessagesComplete(): void {
  for (const companion of companionOptions) {
    for (const mood of moodIds) {
      if (!OPENING_MESSAGES[companion.id][mood]?.trim()) {
        throw new Error(`Missing opening message: ${companion.id}/${mood}`);
      }
    }
  }
}
