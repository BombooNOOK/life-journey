/** /help/ljd — 森の案内所（表示名・案内コピー） */
export const FOREST_GUIDE_STATION_TITLE = "森の案内所" as const;

export const FOREST_GUIDE_STATION_SUBTITLE = "Life Journey Diaryの歩き方" as const;

export const FOREST_GUIDE_STATION_DESCRIPTION =
  "ここは、Life Journey Diaryの森で迷ったときに立ち寄れる案内所です。はじめての方の流れや、日記の書き方、すうじの読み方を確認できます。" as const;

export const FOREST_GUIDE_STATION_FIRST_VISIT_SECTION_TITLE = "はじめての方の流れ" as const;

export const FOREST_GUIDE_STATION_NUMEROLOGY_READING_HREF = "/help/ljd/numerology-reading" as const;

export const FOREST_GUIDE_STATION_NUMEROLOGY_READING_LINK_LABEL =
  "すうじの読み方を詳しく見る" as const;

export type ForestGuideFirstVisitStep = {
  step: number;
  title: string;
  body: string;
  /** 初回専用ルートへの直接リンクは最小限に */
  link?: { href: string; label: string };
};

export const FOREST_GUIDE_FIRST_VISIT_STEPS: ForestGuideFirstVisitStep[] = [
  {
    step: 1,
    title: "森の案内を見る",
    body: "LJDの世界観と、これから進む流れを知ります。",
  },
  {
    step: 2,
    title: "Life Journey Diaryとはを知る",
    body: "写真と言葉で日々を残し、世界に一冊の日記ブックへ育てるサービスです。",
  },
  {
    step: 3,
    title: "フクロウ先生の案内を読む",
    body: "数字は毎日を決めるものではなく、日記を見返すための小さな手がかりです。",
    link: {
      href: FOREST_GUIDE_STATION_NUMEROLOGY_READING_HREF,
      label: FOREST_GUIDE_STATION_NUMEROLOGY_READING_LINK_LABEL,
    },
  },
  {
    step: 4,
    title: "ログハウスを建てる",
    body: "あなたの日記や鑑定書をしまっておく場所を作ります。",
  },
  {
    step: 5,
    title: "鑑定を受ける",
    body: "生年月日とお名前から、あなたが持つ数字を見つけます。",
  },
  {
    step: 6,
    title: "鑑定書を読む",
    body: "どうぶつ鑑定士たちから、あなたの数字にまつわるメッセージが届きます。",
  },
  {
    step: 7,
    title: "どうぶつ鑑定士と日記を書く",
    body: "写真とことばで、今日の1ページを残します。",
  },
  {
    step: 8,
    title: "日記ブックに育てる",
    body: "残した日々は、あとから世界に一冊の日記ブックになります。",
  },
];
