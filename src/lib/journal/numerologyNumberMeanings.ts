/** 今日のすうじ（1〜9）の辞書データ。日記の振り返り用。 */

export type DiaryNumberValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type NumerologyNumberMeaningEntry = {
  number: DiaryNumberValue;
  title: string;
  keywords: string[];
  description: string;
  /** 日記を書く・読み返すときの見方 */
  diaryHint: string;
};

export const DIARY_NUMBER_VALUES: readonly DiaryNumberValue[] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9,
] as const;

export const NUMEROLOGY_NUMBER_MEANINGS: Record<DiaryNumberValue, NumerologyNumberMeaningEntry> = {
  1: {
    number: 1,
    title: "始まりの数字",
    keywords: ["新しい一歩", "流れの切り替え", "自分から動く"],
    description:
      "「1」は、新しい流れが立ち上がりやすいテーマです。大きく変える必要はなく、小さな始まりや、気になっていたことへの一歩が意味を持ちやすい数字です。",
    diaryHint:
      "今日は何かを始めた日だったか、それとも「始めたい」と感じたことがあったかを書いてみましょう。",
  },
  2: {
    number: 2,
    title: "つながりの数字",
    keywords: ["やり取り", "相手の気持ち", "やわらかな関係"],
    description:
      "「2」は、ひとりで進むより、人とのあいだにある流れが大切になりやすいテーマです。聞くこと、待つこと、気配りが助けになる日です。",
    diaryHint:
      "誰かとの会話や、心が動いたやり取りがあったかを振り返ってみましょう。",
  },
  3: {
    number: 3,
    title: "表現の数字",
    keywords: ["楽しさ", "創造", "心が動くこと"],
    description:
      "「3」は、肩の力を少し抜いて、自分らしい表現や楽しさを大切にしたいテーマです。軽やかな気持ちが、意外とよいヒントになることがあります。",
    diaryHint:
      "笑ったこと、話したこと、心が弾んだ瞬間を書き留めてみましょう。",
  },
  4: {
    number: 4,
    title: "足もとを整える数字",
    keywords: ["安定", "積み重ね", "現実的な見直し"],
    description:
      "「4」は、大きく動くより、今あるものを整えたり、続けられる形にしたりすることに向いているテーマです。地味でも、あとから効く働きをします。",
    diaryHint:
      "生活のリズムや、小さな手入れ・見直しをしたことがあれば書いてみましょう。",
  },
  5: {
    number: 5,
    title: "変化の数字",
    keywords: ["新しい体験", "柔軟さ", "ちょっとした冒険"],
    description:
      "「5」は、いつもと少し違う選択や、新しい風を取り入れやすいテーマです。予定外の出来事も、別の視点を連れてくることがあります。",
    diaryHint:
      "いつもと違うことをした日、予想外の出来事があったかを振り返ってみましょう。",
  },
  6: {
    number: 6,
    title: "育てる・支える数字",
    keywords: ["家族や身近な人", "責任", "あたたかさ"],
    description:
      "「6」は、自分だけでなく、誰かのために力を使う場面が増えやすいテーマです。支えることと、抱え込みすぎないことのバランスが大切です。",
    diaryHint:
      "誰かのために動いたこと、感謝したこと、頼られたことを書いてみましょう。",
  },
  7: {
    number: 7,
    title: "見つめ直す数字",
    keywords: ["内省", "学び", "立ち止まる時間"],
    description:
      "「7」は、外へ広げるより、少し立ち止まって自分の内側を見つめ直したいテーマです。静かな時間や学びが、次の一歩を支えます。",
    diaryHint:
      "考え込んだこと、気づき、読んだり学んだことがあれば書き留めてみましょう。",
  },
  8: {
    number: 8,
    title: "形にする数字",
    keywords: ["達成", "現実", "力を通す"],
    description:
      "「8」は、積み重ねてきたものが現実の中で形になりやすいテーマです。目標や成果に意識が向きやすく、力を通しやすい日でもあります。",
    diaryHint:
      "うまくいったこと、前に進んだ感覚があったことを振り返ってみましょう。",
  },
  9: {
    number: 9,
    title: "区切りの数字",
    keywords: ["整理", "手放す", "ひとつの流れの完了"],
    description:
      "「9」は、ひとつの流れをまとめたり、区切りをつけたりすることに向いているテーマです。手放すことも、次へ進むための準備になります。",
    diaryHint:
      "終わったこと、整理したこと、これまでの流れを振り返ってみましょう。",
  },
};

/** 画面表示用（1〜9のみ・11/22/33は含めない） */
export const NUMEROLOGY_NUMBER_MEANING_ENTRIES: NumerologyNumberMeaningEntry[] =
  DIARY_NUMBER_VALUES.map((n) => NUMEROLOGY_NUMBER_MEANINGS[n]);

export const NUMEROLOGY_NUMBERS_PAGE_TITLE = "数字の意味を見る";

export const NUMEROLOGY_NUMBERS_PAGE_INTRO =
  "Life Journey Diary では、日記を書く日に「今日のすうじ」として、今日・今月・今年の数字をお伝えしています。ここでは、1〜9 それぞれがどんなテーマを表すのかをまとめています。";

export const NUMEROLOGY_NUMBERS_PAGE_FOOTNOTE =
  "未来を決めるものではなく、日々を振り返るヒントです。";

/** 日記ブック最終付近の早見表タイトル */
export const DIARY_BOOK_NUMEROLOGY_QUICK_REFERENCE_TITLE = "今日のすうじ 早見表";

/** 早見表1行（数字・テーマ名・短いキーワード） */
export function numerologyNumberQuickReferenceLine(entry: NumerologyNumberMeaningEntry): string {
  const keyword = entry.keywords[0] ?? "";
  return `${entry.number}　${entry.title}　─　${keyword}`;
}

export const NUMEROLOGY_NUMBER_QUICK_REFERENCE_LINES: string[] =
  NUMEROLOGY_NUMBER_MEANING_ENTRIES.map(numerologyNumberQuickReferenceLine);
