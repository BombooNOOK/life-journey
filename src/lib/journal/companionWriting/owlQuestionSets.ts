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
  q1Placeholder: string;
  q2Placeholder: string;
  compose: (answers: OwlQuestionAnswers) => string;
};

function dayLabelFor(activityId: ActivityId): string {
  return activityOptions.find((a) => a.id === activityId)?.label ?? "";
}

function Q(answer: string): string {
  return `「${answer}」`;
}

function set(
  activityId: ActivityId,
  variant: "a" | "b",
  tone: CompanionDayTone,
  q1: string,
  q2: string,
  q1Placeholder: string,
  q2Placeholder: string,
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
    q1Placeholder,
    q2Placeholder,
    compose,
  };
}

/** フクロウ先生：18択 × セットA/B（単語・短文でも破綻しにくい compose） */
export const OWL_QUESTION_SETS: readonly OwlQuestionSet[] = [
  // positive
  set(
    "work_study",
    "a",
    "positive",
    "お疲れさまでした。今日がんばった場面を、短く書くなら？",
    "今日がんばった自分への贈り物を、短く書くなら？",
    "例）会議の準備／資料づくり／夜までの作業",
    "例）温かい紅茶／長い風呂／早めの就寝",
    ({ answer1, answer2 }) =>
      `今日がんばったのは${Q(answer1)}の場面。\nそんな自分に${Q(answer2)}を贈ってあげたいと思った。`,
  ),
  set(
    "work_study",
    "b",
    "positive",
    "お疲れさまでした。がんばった時間帯を、短く書くなら？",
    "今日のごほうびに食べたいものを、短く書くなら？",
    "例）朝／昼／夜",
    "例）お寿司／プリン／あたたかいスープ",
    ({ answer1, answer2 }) =>
      `がんばったのは${Q(answer1)}のあたり。\nごほうびには${Q(answer2)}と思った。`,
  ),
  set(
    "family_friends",
    "a",
    "positive",
    "それは素敵ですね。誰と過ごしたか、短く書くなら？",
    "また一緒ならしたいことを、短く書くなら？",
    "例）母／友人／ひとり",
    "例）散歩／お茶／映画",
    ({ answer1, answer2 }) =>
      `${Q(answer1)}と過ごした時間。\nまた一緒なら${Q(answer2)}と思った。`,
  ),
  set(
    "family_friends",
    "b",
    "positive",
    "それは素敵ですね。どこで過ごしたか、短く書くなら？",
    "思い出すといちばん浮かぶものを、短く書くなら？",
    "例）キッチン／帰り道／カフェ",
    "例）笑顔／音楽／夕焼け",
    ({ answer1, answer2 }) =>
      `${Q(answer1)}で過ごした。\n思い出すと${Q(answer2)}がいちばん浮かんできた。`,
  ),
  set(
    "new_challenge",
    "a",
    "positive",
    "それは素晴らしいです。踏み出した新しいことを、短く書くなら？",
    "そのあと、まずしたいことを短く書くなら？",
    "例）アプリを作る／楽器を始める／初めての場所へ",
    "例）少し休む／誰かに見せる／お茶を飲む",
    ({ answer1, answer2 }) =>
      `${answer1}という新しい一歩を踏み出した。\nそのあと、まず${Q(answer2)}と思った。`,
  ),
  set(
    "new_challenge",
    "b",
    "positive",
    "よく一歩進みましたね。新しいことを始めた場所を、短く書くなら？",
    "その一歩につける小さな名前を、短く書くなら？",
    "例）自宅／カフェ／図書館",
    "例）小さな一歩／はじまり／今日の冒険",
    ({ answer1, answer2 }) =>
      `${Q(answer1)}で、新しいことを始めた。\nその一歩は、${Q(answer2)}という名前がついた。`,
  ),
  set(
    "enjoyed",
    "a",
    "positive",
    "いい時間でしたね。楽しんだことを、短く書くなら？",
    "もう少し続けられるなら足したいものを、短く書くなら？",
    "例）読書／散歩／料理",
    "例）音楽／お茶／まったり時間",
    ({ answer1, answer2 }) =>
      `${Q(answer1)}を楽しんだ。\nもう少し続けられるなら${Q(answer2)}と思った。`,
  ),
  set(
    "enjoyed",
    "b",
    "positive",
    "好きなことに触れられた日だったんですね。楽しんだ場所を、短く書くなら？",
    "その時間にぴったりな飲みものを、短く書くなら？",
    "例）キッチン／公園／お気に入りの席",
    "例）紅茶／コーヒー／ハーブティー",
    ({ answer1, answer2 }) =>
      `${Q(answer1)}で好きなことを楽しんだ。\nその時間には${Q(answer2)}がぴったりだと感じた。`,
  ),
  set(
    "very_happy",
    "a",
    "positive",
    "それは大切に残したいですね。嬉しかったことを、短く書くなら？",
    "その嬉しさを伝えたい相手を、短く書くなら？",
    "例）連絡が来た／褒められた／思いがけない出来事",
    "例）母／友人／チームの人",
    ({ answer1, answer2 }) =>
      `${Q(answer1)}が嬉しかった。\nその気持ちを${Q(answer2)}に伝えたいと思った。`,
  ),
  set(
    "very_happy",
    "b",
    "positive",
    "嬉しいことがあったんですね。その時の場所を、短く書くなら？",
    "写真に写っていそうなものを、短く書くなら？",
    "例）キッチン／帰り道／電車の中",
    "例）マグカップ／夕焼け／スマホ",
    ({ answer1, answer2 }) =>
      `${Q(answer1)}にいた時の出来事。\n写真にするなら${Q(answer2)}が写っていた気がした。`,
  ),
  // softPositive
  set(
    "rest",
    "a",
    "softPositive",
    "休めた時間があったんですね。一息ついた場所を、短く書くなら？",
    "その時、近くにあったものを、短く書くなら？",
    "例）ソファ／ベッド／窓辺",
    "例）マグカップ／本／ぬいぐるみ",
    ({ answer1, answer2 }) =>
      `${Q(answer1)}で一息ついた。\nその時、近くには${Q(answer2)}があった。`,
  ),
  set(
    "rest",
    "b",
    "softPositive",
    "少し力を抜けた日だったんですね。いちばん「ふぅ」と息をつけたことを、短く書くなら？",
    "もう少し心地よくするなら足したいものを、短く書くなら？",
    "例）お風呂／昼寝／ぼーっとする",
    "例）ブランケット／お茶／静かな音楽",
    ({ answer1, answer2 }) =>
      `${Q(answer1)}のとき、いちばん「ふぅ」と息をつけた。\nもう少し心地よくするなら${Q(answer2)}と思った。`,
  ),
  set(
    "organize",
    "a",
    "softPositive",
    "整える時間を作れたんですね。片づけたものを、短く書くなら？",
    "片づけたあといちばん目に入ったものを、短く書くなら？",
    "例）机の上／引き出し／本棚",
    "例）マグカップ／ノート／小さな花",
    ({ answer1, answer2 }) =>
      `${Q(answer1)}を片づけた。\nそのあと、${Q(answer2)}がいちばん目に入りやすくなった。`,
  ),
  set(
    "organize",
    "b",
    "softPositive",
    "今日は、少し整えた場所を、短く書くなら？",
    "そこにひとつだけ置きたいものを、短く書くなら？",
    "例）キッチン／玄関／作業スペース",
    "例）小さな花／写真立て／お気に入りの小物",
    ({ answer1, answer2 }) =>
      `${Q(answer1)}を少し整えた。\nそこに置きたいと思ったのは${Q(answer2)}。`,
  ),
  set(
    "outing",
    "a",
    "softPositive",
    "移動のある一日だったんですね。行った場所を、短く書くなら？",
    "道の途中で目に残ったものを、短く書くなら？",
    "例）スーパー／公園／駅",
    "例）夕焼け／看板／花",
    ({ answer1, answer2 }) =>
      `${Q(answer1)}へ行った。\n道の途中では、${Q(answer2)}が目に残った。`,
  ),
  set(
    "outing",
    "b",
    "softPositive",
    "おでかけの一日だったんですね。いちばん長くいた場所を、短く書くなら？",
    "帰ってきたあと、まずしたいことを短く書くなら？",
    "例）カフェ／図書館／友人の家",
    "例）少し休む／お風呂／温かい飲みもの",
    ({ answer1, answer2 }) =>
      `${Q(answer1)}にいちばん長くいた。\n帰ってきたあと、まず${Q(answer2)}と思った。`,
  ),
  set(
    "health_care",
    "a",
    "softPositive",
    "自分を整える日だったんですね。体を整えたことを、短く書くなら？",
    "そのあと少し楽になった場所を、短く書くなら？",
    "例）ストレッチ／散歩／早めの就寝",
    "例）肩／腰／目",
    ({ answer1, answer2 }) =>
      `${Q(answer1)}で体を整えた。\nそのあと、${Q(answer2)}が少し楽になった。`,
  ),
  set(
    "health_care",
    "b",
    "softPositive",
    "今日は、自分の体でいちばん気にかけた場所を、短く書くなら？",
    "今の自分に置いてあげたいものを、短く書くなら？",
    "例）肩／胃／頭",
    "例）毛布／温かい飲みもの／ゆっくりした時間",
    ({ answer1, answer2 }) =>
      `${Q(answer1)}をいちばん気にかけた。\nその日の自分に置いてあげたいと思ったのは${Q(answer2)}。`,
  ),
  // negative
  set(
    "emotional_wave",
    "a",
    "negative",
    "ざわざわする日だったんですね。心がいちばん動いたことを、短く書くなら？",
    "少し離れられる場所を、短く書くなら？",
    "例）仕事のあと／寝る前／一人の時間",
    "例）公園／海辺／静かな部屋",
    ({ answer1, answer2 }) =>
      `${Q(answer1)}のとき、心がいちばん動いた。\n少し離れるなら${Q(answer2)}と思った。`,
  ),
  set(
    "emotional_wave",
    "b",
    "negative",
    "心が落ち着きにくい日だったんですね。ざわざわが強かった時間帯を、短く書くなら？",
    "そばに置いてあると安心するものを、短く書くなら？",
    "例）朝／昼／夜",
    "例）ぬいぐるみ／毛布／お気に入りのマグ",
    ({ answer1, answer2 }) =>
      `ざわざわは${Q(answer1)}のあたりに強かった。\nそばに${Q(answer2)}があると、少し安心できる気がした。`,
  ),
  set(
    "hard_day",
    "a",
    "negative",
    "しんどい一日でしたね。いちばん「もう無理かも」と思ったことを、短く書くなら？",
    "そのあと、真っ先にしたかったことを短く書くなら？",
    "例）仕事／家事／人とのやりとり",
    "例）寝る／何もしない／温かいものを飲む",
    ({ answer1, answer2 }) =>
      `${Q(answer1)}のとき、「もう無理かも」と思った。\n終わったあと、真っ先に${Q(answer2)}と思った。`,
  ),
  set(
    "hard_day",
    "b",
    "negative",
    "よくここまで来ましたね。いちばん重たかった時間帯を、短く書くなら？",
    "今の自分にしていいことと許すことを、短く書くなら？",
    "例）朝／午後／夜",
    "例）休む／何もしない／早めに寝る",
    ({ answer1, answer2 }) =>
      `いちばん重たかったのは${Q(answer1)}のあたり。\nその日の自分には、${Q(answer2)}をしていいと思った。`,
  ),
  set(
    "sad",
    "a",
    "negative",
    "悲しい気持ちがあったんですね。その場面を、短く書くなら？",
    "今の自分にそっと渡したいものを、短く書くなら？",
    "例）別れの連絡／思い出した出来事／一人の夜",
    "例）温かい飲みもの／毛布／短いメッセージ",
    ({ answer1, answer2 }) =>
      `${Q(answer1)}の場面で、悲しい気持ちが出てきた。\nその日の自分に渡したいと思ったのは${Q(answer2)}。`,
  ),
  set(
    "sad",
    "b",
    "negative",
    "今日は、胸の奥に残るものがあったんですね。その時の場所を、短く書くなら？",
    "少し離れたい場所を、短く書くなら？",
    "例）キッチン／帰り道／電車の中",
    "例）公園／海辺／静かなカフェ",
    ({ answer1, answer2 }) =>
      `${Q(answer1)}にいた時、胸の奥に何かが残った。\n少し離れるなら${Q(answer2)}と思った。`,
  ),
  set(
    "anxious",
    "a",
    "negative",
    "不安が強い日だったんですね。不安が大きくなったことを、短く書くなら？",
    "少し安心するために確認したいことを、短く書くなら？",
    "例）仕事の連絡／明日の予定／体調",
    "例）予定表／メッセージ／呼吸を整える",
    ({ answer1, answer2 }) =>
      `${Q(answer1)}のとき、不安が大きくなった。\n少し安心するために${Q(answer2)}と思った。`,
  ),
  set(
    "anxious",
    "b",
    "negative",
    "落ち着かない時間があったんですね。不安が出た時間帯を、短く書くなら？",
    "「ここまでは大丈夫」と感じたことを、短く書くなら？",
    "例）朝／昼／夜",
    "例）ごはんを食べた／一歩外に出た／誰かに話した",
    ({ answer1, answer2 }) =>
      `不安は${Q(answer1)}のあたりに出てきた。\nここまでは大丈夫だと感じたのは${Q(answer2)}。`,
  ),
  set(
    "irritated",
    "a",
    "negative",
    "イライラする日だったんですね。いちばん力が入ったことを、短く書くなら？",
    "力を抜くために今すぐできることを、短く書くなら？",
    "例）仕事／家事／待ち時間",
    "例）深呼吸／水を飲む／席を立つ",
    ({ answer1, answer2 }) =>
      `${Q(answer1)}のとき、いちばん力が入った。\n力を抜くために${Q(answer2)}と思った。`,
  ),
  set(
    "irritated",
    "b",
    "negative",
    "今日は、気持ちが尖りやすかったんですね。近くにあったものを、短く書くなら？",
    "今の自分に許してあげたいことを、短く書くなら？",
    "例）マグカップ／机の上の物／窓の外",
    "例）休む／何もしない／気分を変える",
    ({ answer1, answer2 }) =>
      `気持ちが尖りやすかった時、近くには${Q(answer1)}があった。\nその日の自分には、${Q(answer2)}を許してあげたいと思った。`,
  ),
  set(
    "lost_confidence",
    "a",
    "negative",
    "自信が揺れる日だったんですね。そう感じた場面を、短く書くなら？",
    "それでも今日できたことを、短く書くなら？",
    "例）会議／提出物／人とのやりとり",
    "例）連絡した／準備した／一歩動いた",
    ({ answer1, answer2 }) =>
      `${Q(answer1)}の場面で、自信が揺れた。\nそれでも今日できたのは${Q(answer2)}。`,
  ),
  set(
    "lost_confidence",
    "b",
    "negative",
    "今日は、自分を小さく感じたことを、短く書くなら？",
    "今の自分にかけてあげたい言葉を、短く書くなら？",
    "例）仕事／勉強／人と比べてしまう",
    "例）ここまでよくやった／今日は休んでいい／明日でいい",
    ({ answer1, answer2 }) =>
      `${Q(answer1)}のとき、自分を小さく感じた。\nその日の自分には、${Q(answer2)}と言いたくなった。`,
  ),
  set(
    "no_energy",
    "a",
    "negative",
    "何もしたくない日もありますよね。いちばん長くいた場所を、短く書くなら？",
    "今日はしなくていいことと感じたことを、短く書くなら？",
    "例）ベッド／ソファ／窓辺",
    "例）返信／家事／無理な予定",
    ({ answer1, answer2 }) =>
      `${Q(answer1)}でいちばん長く過ごした。\n今日は、${Q(answer2)}をしなくていいと感じた。`,
  ),
  set(
    "no_energy",
    "b",
    "negative",
    "動きたくない日だったんですね。いちばん近くにあったものを、短く書くなら？",
    "今夜だけ自分を甘やかすなら、短く書くなら？",
    "例）マグカップ／毛布／スマホ",
    "例）早めの就寝／好きな動画／温かい飲みもの",
    ({ answer1, answer2 }) =>
      `動きたくない日、いちばん近くには${Q(answer1)}があった。\n今夜だけは、${Q(answer2)}で自分を甘やかしたいと思った。`,
  ),
  set(
    "down",
    "a",
    "negative",
    "うまくいかない日でしたね。いちばん引っかかっている場面を、短く書くなら？",
    "そのあと、ほんの少しでも助かったことを、短く書くなら？",
    "例）仕事の連絡／思い出した出来事／一人の時間",
    "例）温かい飲みもの／短い散歩／誰かの言葉",
    ({ answer1, answer2 }) =>
      `${Q(answer1)}の場面が、いちばん引っかかっていた。\nそのあと、${Q(answer2)}がほんの少し助かった。`,
  ),
  set(
    "down",
    "b",
    "negative",
    "落ち込む時間があったんですね。そのときのことを、短く書くなら？",
    "明日の自分への助けを、短く書くなら？",
    "例）仕事のあと／寝る前／ぼーっとする時間",
    "例）早めの就寝／少し整える／誰かに連絡する",
    ({ answer1, answer2 }) =>
      `${Q(answer1)}のとき、落ち込む時間があった。\n明日の自分への助けは${Q(answer2)}。`,
  ),
  // neutral
  set(
    "record_anyway",
    "a",
    "neutral",
    "特別なことがなくても、残しておきたい日ってありますよね。写真に残すなら何を、短く書くなら？",
    "その写真につける小さな名前を、短く書くなら？",
    "例）マグカップ／夕焼け／窓の外",
    "例）ふつうの一日／小さなしるし／今日の空",
    ({ answer1, answer2 }) =>
      `今日を残すなら${Q(answer1)}を撮った。\nその写真の名前は${Q(answer2)}にした。`,
  ),
  set(
    "record_anyway",
    "b",
    "neutral",
    "なんでもない日を残そうと思えたんですね。いちばん長くいた場所を、短く書くなら？",
    "今日のしるしとして置きたいものを、短く書くなら？",
    "例）キッチン／帰り道／電車の中",
    "例）マグカップ／一輪の花／メモ一枚",
    ({ answer1, answer2 }) =>
      `${Q(answer1)}にいちばん長くいた。\n今日のしるしとして、${Q(answer2)}を置きたいと思った。`,
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
