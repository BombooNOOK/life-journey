/** /help/ljd — 森の案内所（表示名・案内コピー） */
export const FOREST_GUIDE_STATION_TITLE = "森の案内所" as const;

export const FOREST_GUIDE_STATION_SUBTITLE = "Life Journey Diaryの歩き方" as const;

export const FOREST_GUIDE_STATION_DESCRIPTION =
  "ここは、Life Journey Diaryの森で迷ったときに立ち寄れる案内所です。森の案内図や、はじめての方の流れ、日記の書き方、すうじの読み方を確認できます。" as const;

export const FOREST_GUIDE_STATION_MAP_SECTION_TITLE = "BambooNOOKの森の案内図" as const;

export const FOREST_GUIDE_STATION_FIRST_VISIT_SECTION_TITLE = "はじめての方の流れ" as const;

export const FOREST_GUIDE_STATION_FIRST_VISIT_CARD_BODY =
  "森の住民登録から、\nはじめての日記を書くまでの流れを確認できます。" as const;

export const FOREST_GUIDE_STATION_FIRST_VISIT_CARD_BUTTON = "確認する" as const;

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
    title: "森へようこそ",
    body: "BambooNOOKの森へようこそ。これから進む流れを、案内図で確認できます。",
  },
  {
    step: 2,
    title: "Life Journey Diaryとは",
    body: "写真と言葉で日々を残し、世界に一冊の日記ブックへ育てるサービスです。",
  },
  {
    step: 3,
    title: "フクロウ先生の案内",
    body: "数字は毎日を決めるものではなく、日記を見返すための小さな手がかりです。",
    link: {
      href: FOREST_GUIDE_STATION_NUMEROLOGY_READING_HREF,
      label: FOREST_GUIDE_STATION_NUMEROLOGY_READING_LINK_LABEL,
    },
  },
  {
    step: 4,
    title: "森の案内所へ",
    body: "迷ったときに戻ってこられる場所があることを、先に少しだけご案内します。",
  },
  {
    step: 5,
    title: "森の住民登録",
    body: "森で過ごす準備として、アカウントを作成します。",
  },
  {
    step: 6,
    title: "住民票カード発行",
    body: "あなた専用の住民票カードを受け取ります。",
  },
  {
    step: 7,
    title: "ログハウス建築",
    body: "日記や鑑定書をしまっておく、あなたの拠点を建てます。",
  },
  {
    step: 8,
    title: "ログハウス完成",
    body: "ログハウスが完成し、これからの森の暮らしの拠点ができました。",
  },
  {
    step: 9,
    title: "鑑定のへや",
    body: "あなたが持つ数字を見つける場所へ、フクロウ先生がご案内します。",
  },
  {
    step: 10,
    title: "鑑定を受ける",
    body: "生年月日とお名前から、あなたが持つ数字を見つけます。",
  },
  {
    step: 11,
    title: "ログハウスの本棚に鑑定書が届く",
    body: "どうぶつ鑑定士たちから、あなたの数字にまつわるメッセージが届きます。",
  },
  {
    step: 12,
    title: "日記を書く / 今日はここまで",
    body: "写真とことばで今日の1ページを残すか、また明日に続けます。",
  },
];
