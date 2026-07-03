import type { ActivityId } from "@/lib/journal/meta";
import { activityOptions } from "@/lib/journal/meta";

import type { CompanionDayTone } from "./companionPrompt";

export type OwlQuestionAnswers = {
  answer1: string;
  answer2: string;
};

export type OwlQuestionSet = {
  id: string;
  activityId: ActivityId;
  variant: "a" | "b";
  tone: CompanionDayTone;
  dayLabel: string;
  q1: string;
  q2: string;
  compose: (answers: OwlQuestionAnswers) => string;
};

function dayLabelFor(activityId: ActivityId): string {
  return activityOptions.find((a) => a.id === activityId)?.label ?? "";
}

function set(
  activityId: ActivityId,
  variant: "a" | "b",
  tone: CompanionDayTone,
  q1: string,
  q2: string,
  compose: (answers: OwlQuestionAnswers) => string,
): OwlQuestionSet {
  return {
    id: `${activityId}_${variant}`,
    activityId,
    variant,
    tone,
    dayLabel: dayLabelFor(activityId),
    q1,
    q2,
    compose,
  };
}

/** フクロウ先生：18択 × セットA/B（各 compose は質問の意味に合わせて個別定義） */
export const OWL_QUESTION_SETS: readonly OwlQuestionSet[] = [
  // positive
  set(
    "work_study",
    "a",
    "positive",
    "お疲れさまでした。今日がんばったのは、どんな場面でしたか？",
    "今日がんばった自分に、ひとつだけ贈り物をするとしたら、何にしますか？",
    ({ answer1, answer2 }) =>
      `今日がんばったのは、${answer1}。\nそんな自分に、${answer2}を贈ってあげたい。`,
  ),
  set(
    "work_study",
    "b",
    "positive",
    "お疲れさまでした。今日がんばった時間は、朝・昼・夜のどのあたりでしたか？",
    "今日のがんばりのごほうびに、何が食べたいですか？",
    ({ answer1, answer2 }) =>
      `がんばったのは、${answer1}のあたり。\nごほうびには、${answer2}が食べたい。`,
  ),
  set(
    "family_friends",
    "a",
    "positive",
    "それは素敵ですね。誰と過ごしましたか？",
    "また一緒に過ごすなら、次は何をしてみたいですか？",
    ({ answer1, answer2 }) =>
      `${answer1}と過ごした時間。\nまた一緒なら、${answer2}をしてみたい。`,
  ),
  set(
    "family_friends",
    "b",
    "positive",
    "それは素敵ですね。どこで過ごしましたか？",
    "その時間を思い出す時、いちばん浮かぶものは何ですか？",
    ({ answer1, answer2 }) =>
      `${answer1}で過ごした。\n思い出すと、${answer2}がいちばん浮かぶ。`,
  ),
  set(
    "new_challenge",
    "a",
    "positive",
    "それは素晴らしいです。今日は、どんな新しいことに踏み出しましたか？",
    "そのあと、まず何をしたくなりましたか？",
    ({ answer1, answer2 }) =>
      `${answer1}という新しい一歩を踏み出した。\nそのあと、まず${answer2}をしたくなった。`,
  ),
  set(
    "new_challenge",
    "b",
    "positive",
    "よく一歩進みましたね。新しいことを始めたのは、どこにいた時でしたか？",
    "その一歩に、小さな名前をつけるなら何にしますか？",
    ({ answer1, answer2 }) =>
      `${answer1}で、新しいことを始めた。\nその一歩は、「${answer2}」という名前がつきそう。`,
  ),
  set(
    "enjoyed",
    "a",
    "positive",
    "いい時間でしたね。今日は、何を楽しみましたか？",
    "その時間をもう少し続けられるなら、何を足したいですか？",
    ({ answer1, answer2 }) =>
      `${answer1}を楽しんだ。\nもう少し続けられるなら、${answer2}を足したい。`,
  ),
  set(
    "enjoyed",
    "b",
    "positive",
    "好きなことに触れられた日だったんですね。どこで楽しみましたか？",
    "その時間にぴったりな飲みものを選ぶなら、何にしますか？",
    ({ answer1, answer2 }) =>
      `${answer1}で好きなことを楽しんだ。\nその時間には、${answer2}がぴったりそう。`,
  ),
  set(
    "very_happy",
    "a",
    "positive",
    "それは大切に残したいですね。何が嬉しかったですか？",
    "その嬉しさを誰かに渡せるなら、誰に伝えたいですか？",
    ({ answer1, answer2 }) =>
      `${answer1}が嬉しかった。\nその気持ちを、${answer2}に伝えたい。`,
  ),
  set(
    "very_happy",
    "b",
    "positive",
    "嬉しいことがあったんですね。その時、どこにいましたか？",
    "その場面を写真にするなら、何が写っていそうですか？",
    ({ answer1, answer2 }) =>
      `${answer1}にいた時の出来事。\n写真にするなら、${answer2}が写っていそう。`,
  ),
  // softPositive
  set(
    "rest",
    "a",
    "softPositive",
    "休めた時間があったんですね。どこで一息つきましたか？",
    "その時、近くにあったものは何ですか？",
    ({ answer1, answer2 }) =>
      `${answer1}で一息ついた。\nその時、近くには${answer2}があった。`,
  ),
  set(
    "rest",
    "b",
    "softPositive",
    "少し力を抜けた日だったんですね。いちばん「ふぅ」と息をつけたのは、何をしている時でしたか？",
    "その時間をもう少し心地よくするなら、何を足したいですか？",
    ({ answer1, answer2 }) =>
      `${answer1}をしている時に、いちばん「ふぅ」と息をつけた。\nもう少し心地よくするなら、${answer2}を足したい。`,
  ),
  set(
    "organize",
    "a",
    "softPositive",
    "整える時間を作れたんですね。今日は何を片づけましたか？",
    "片づけた後、いちばん目に入りやすくなったものは何ですか？",
    ({ answer1, answer2 }) =>
      `${answer1}を片づけた。\nそのあと、${answer2}がいちばん目に入りやすくなった。`,
  ),
  set(
    "organize",
    "b",
    "softPositive",
    "今日は、どこを少し整えましたか？",
    "その場所に、ひとつだけ置きたいものを選ぶなら何ですか？",
    ({ answer1, answer2 }) =>
      `${answer1}を少し整えた。\nそこに置きたいのは、${answer2}。`,
  ),
  set(
    "outing",
    "a",
    "softPositive",
    "移動のある一日だったんですね。今日はどこへ行きましたか？",
    "道の途中で、目に残っているものはありますか？",
    ({ answer1, answer2 }) =>
      `${answer1}へ行った。\n道の途中では、${answer2}が目に残っている。`,
  ),
  set(
    "outing",
    "b",
    "softPositive",
    "おでかけの一日だったんですね。いちばん長くいた場所はどこでしたか？",
    "帰ってきたあと、まず何をしたくなりましたか？",
    ({ answer1, answer2 }) =>
      `${answer1}にいちばん長くいた。\n帰ってきたあと、まず${answer2}をしたくなった。`,
  ),
  set(
    "health_care",
    "a",
    "softPositive",
    "自分を整える日だったんですね。今日は何をして体を整えましたか？",
    "そのあと、体が少し楽になった場所はありますか？",
    ({ answer1, answer2 }) =>
      `${answer1}して体を整えた。\nそのあと、${answer2}が少し楽になった。`,
  ),
  set(
    "health_care",
    "b",
    "softPositive",
    "今日は、自分の体に少し目を向けたんですね。いちばん気にかけたのはどこですか？",
    "今の自分に置いてあげたいものを選ぶなら、何ですか？",
    ({ answer1, answer2 }) =>
      `${answer1}をいちばん気にかけた。\n今の自分に置いてあげたいのは、${answer2}。`,
  ),
  // negative
  set(
    "emotional_wave",
    "a",
    "negative",
    "ざわざわする日だったんですね。いちばん心が動いたのは、何をしている時でしたか？",
    "そのあと、少しだけ離れられる場所があるなら、どこに行きたいですか？",
    ({ answer1, answer2 }) =>
      `${answer1}をしている時に、心がいちばん動いた。\n少し離れるなら、${answer2}に行きたい。`,
  ),
  set(
    "emotional_wave",
    "b",
    "negative",
    "心が落ち着きにくい日だったんですね。そのざわざわは、朝・昼・夜のどのあたりに強かったですか？",
    "今の自分のそばに置くなら、どんなものがあると安心しますか？",
    ({ answer1, answer2 }) =>
      `ざわざわは、${answer1}のあたりに強かった。\nそばに${answer2}があると安心する。`,
  ),
  set(
    "hard_day",
    "a",
    "negative",
    "しんどい一日でしたね。いちばん「もう無理かも」と思ったのは、何をしている時でしたか？",
    "その時間が終わったあと、真っ先に何がしたかったですか？",
    ({ answer1, answer2 }) =>
      `${answer1}をしている時に、「もう無理かも」と思った。\n終わったあと、真っ先に${answer2}がしたかった。`,
  ),
  set(
    "hard_day",
    "b",
    "negative",
    "よくここまで来ましたね。今日いちばん重たかった時間は、どのあたりでしたか？",
    "今の自分に許可を出せるなら、何をしていいことにしますか？",
    ({ answer1, answer2 }) =>
      `いちばん重たかったのは、${answer1}のあたり。\n今の自分には、${answer2}をしていい。`,
  ),
  set(
    "sad",
    "a",
    "negative",
    "悲しい気持ちがあったんですね。その気持ちは、どんな場面で出てきましたか？",
    "今の自分に、そっと渡したいものは何ですか？",
    ({ answer1, answer2 }) =>
      `${answer1}の場面で、悲しい気持ちが出てきた。\n今の自分に渡したいのは、${answer2}。`,
  ),
  set(
    "sad",
    "b",
    "negative",
    "今日は、胸の奥に残るものがあったんですね。その時、どこにいましたか？",
    "その場面から少し離れるなら、どんな場所に行きたいですか？",
    ({ answer1, answer2 }) =>
      `${answer1}にいた時、胸の奥に何かが残った。\n少し離れるなら、${answer2}に行きたい。`,
  ),
  set(
    "anxious",
    "a",
    "negative",
    "不安が強い日だったんですね。その不安は、何をしている時に大きくなりましたか？",
    "少し安心するために、今ひとつだけ確認したいことは何ですか？",
    ({ answer1, answer2 }) =>
      `${answer1}をしている時に、不安が大きくなった。\n少し安心するために、${answer2}を確認したい。`,
  ),
  set(
    "anxious",
    "b",
    "negative",
    "落ち着かない時間があったんですね。不安が出てきたのは、朝・昼・夜のどのあたりでしたか？",
    "今の自分に「ここまでは大丈夫」と言えることがあるなら、何ですか？",
    ({ answer1, answer2 }) =>
      `不安は、${answer1}のあたりに出てきた。\nここまでは大丈夫なのは、${answer2}。`,
  ),
  set(
    "irritated",
    "a",
    "negative",
    "イライラする日だったんですね。いちばん力が入ったのは、何をしている時でしたか？",
    "その力を抜くために、今すぐできる小さなことは何ですか？",
    ({ answer1, answer2 }) =>
      `${answer1}をしている時に、いちばん力が入った。\n力を抜くために、今すぐ${answer2}をしてみたい。`,
  ),
  set(
    "irritated",
    "b",
    "negative",
    "今日は、気持ちが尖りやすかったんですね。その時、近くにあったものは何ですか？",
    "今の自分にひとつだけ許すなら、何を許してあげたいですか？",
    ({ answer1, answer2 }) =>
      `気持ちが尖りやすかった時、近くには${answer1}があった。\n今の自分には、${answer2}を許してあげたい。`,
  ),
  set(
    "lost_confidence",
    "a",
    "negative",
    "自信が揺れる日だったんですね。そう感じたのは、どんな場面でしたか？",
    "それでも今日できたことを、ひとつだけ拾うなら何ですか？",
    ({ answer1, answer2 }) =>
      `${answer1}の場面で、自信が揺れた。\nそれでも今日できたのは、${answer2}。`,
  ),
  set(
    "lost_confidence",
    "b",
    "negative",
    "今日は、自分を小さく感じる時間があったんですね。それは何をしている時でしたか？",
    "今の自分に、責めない言葉をかけるなら何と言いたいですか？",
    ({ answer1, answer2 }) =>
      `${answer1}をしている時、自分を小さく感じた。\n今の自分には、「${answer2}」と言いたい。`,
  ),
  set(
    "no_energy",
    "a",
    "negative",
    "何もしたくない日もありますよね。今日は、どこで一番長く過ごしましたか？",
    "今の自分に許可を出すなら、何をしないでいいことにしますか？",
    ({ answer1, answer2 }) =>
      `${answer1}でいちばん長く過ごした。\n今日は、${answer2}をしなくていい。`,
  ),
  set(
    "no_energy",
    "b",
    "negative",
    "動きたくない日だったんですね。今日、いちばん近くにあったものは何ですか？",
    "今夜だけ、自分を甘やかすなら何をしますか？",
    ({ answer1, answer2 }) =>
      `動きたくない日、いちばん近くには${answer1}があった。\n今夜だけは、${answer2}で自分を甘やかしたい。`,
  ),
  set(
    "down",
    "a",
    "negative",
    "うまくいかない日でしたね。いちばん引っかかっているのは、どんな場面ですか？",
    "その場面のあと、ほんの少しでも助かったことはありますか？",
    ({ answer1, answer2 }) =>
      `${answer1}の場面が、いちばん引っかかっている。\nそのあと、${answer2}がほんの少し助かった。`,
  ),
  set(
    "down",
    "b",
    "negative",
    "落ち込む時間があったんですね。それは何をしている時でしたか？",
    "明日の自分に、ひとつだけ残しておきたい助けは何ですか？",
    ({ answer1, answer2 }) =>
      `${answer1}をしている時、落ち込む時間があった。\n明日の自分への助けは、${answer2}。`,
  ),
  // neutral
  set(
    "record_anyway",
    "a",
    "neutral",
    "特別なことがなくても、残しておきたい日ってありますよね。今日、もし1枚だけ写真を撮るなら何を撮りますか？",
    "その写真に小さな名前をつけるなら、何にしますか？",
    ({ answer1, answer2 }) =>
      `写真を撮るなら、${answer1}。\nその写真の名前は「${answer2}」。`,
  ),
  set(
    "record_anyway",
    "b",
    "neutral",
    "なんでもない日を残そうと思えたんですね。今日いちばん長くいた場所はどこですか？",
    "その場所に、今日のしるしをひとつ置くなら何を置きますか？",
    ({ answer1, answer2 }) =>
      `${answer1}にいちばん長くいた。\n今日のしるしとして、${answer2}を置きたい。`,
  ),
] as const;

const SETS_BY_ACTIVITY: Record<ActivityId, [OwlQuestionSet, OwlQuestionSet]> = (() => {
  const map = {} as Partial<Record<ActivityId, { a?: OwlQuestionSet; b?: OwlQuestionSet }>>;
  for (const questionSet of OWL_QUESTION_SETS) {
    const bucket = map[questionSet.activityId] ?? {};
    bucket[questionSet.variant] = questionSet;
    map[questionSet.activityId] = bucket;
  }
  const result = {} as Record<ActivityId, [OwlQuestionSet, OwlQuestionSet]>;
  for (const option of activityOptions) {
    const pair = map[option.id];
    if (pair?.a && pair?.b) {
      result[option.id] = [pair.a, pair.b];
    }
  }
  return result;
})();

export function pickOwlQuestionSet(activityId: ActivityId): OwlQuestionSet {
  const pair = SETS_BY_ACTIVITY[activityId];
  if (!pair) {
    return SETS_BY_ACTIVITY.record_anyway[0];
  }
  return pair[Math.floor(Math.random() * 2)]!;
}

export function composeOwlGeneratedBody(
  questionSet: OwlQuestionSet,
  answers: OwlQuestionAnswers,
): string {
  return questionSet.compose({
    answer1: answers.answer1.trim(),
    answer2: answers.answer2.trim(),
  });
}
