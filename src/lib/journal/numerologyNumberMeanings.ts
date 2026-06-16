/** 数字の意味ページ用データ（今後テーマ文を追加していく） */

export type NumerologyNumberMeaningEntry = {
  value: number;
  display: string;
  /** null のときは掲載準備中 */
  theme: string | null;
};

/** 掲載予定の数字一覧（順序はページ表示順） */
export const NUMEROLOGY_NUMBER_MEANING_ENTRIES: NumerologyNumberMeaningEntry[] = [
  { value: 1, display: "1", theme: null },
  { value: 2, display: "2", theme: null },
  { value: 3, display: "3", theme: null },
  { value: 4, display: "4", theme: null },
  { value: 5, display: "5", theme: null },
  { value: 6, display: "6", theme: null },
  { value: 7, display: "7", theme: null },
  { value: 8, display: "8", theme: null },
  { value: 9, display: "9", theme: null },
  { value: 11, display: "11", theme: null },
  { value: 22, display: "22", theme: null },
  { value: 33, display: "33", theme: null },
];

export const NUMEROLOGY_NUMBERS_PAGE_TITLE = "数字の意味";

export const NUMEROLOGY_NUMBERS_PAGE_INTRO =
  "Life Journey Diary では、日記を振り返るヒントとして、今日・今月・今年の数字をお伝えしています。ここでは、1〜9、11、22、33 それぞれのテーマを順次掲載していきます。";

export const NUMEROLOGY_NUMBERS_PAGE_COMING_SOON =
  "1〜9、11、22、33 の数字のテーマを今後掲載予定です。";

export const NUMEROLOGY_NUMBERS_PAGE_FOOTNOTE =
  "数字は未来を決めるものではなく、日記を振り返るための小さな手がかりとしてお楽しみください。";

export const NUMEROLOGY_NUMBER_PLACEHOLDER_LABEL = "掲載準備中";
