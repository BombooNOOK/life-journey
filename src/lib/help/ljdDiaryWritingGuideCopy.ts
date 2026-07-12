/** 森の案内所④「日記の書き方」— 辞書トーンの原稿（はじめて導線とは別） */

export const LJD_DIARY_WRITING_GUIDE_SECTION_SUMMARY =
  "ログハウスからカレンダーで日付を選び、1ページを残す" as const;

export const LJD_DIARY_WRITING_GUIDE_LEAD =
  "日記は、ログハウスから書きます。通常の執筆では、カレンダーで日付を選んで1日1ページを残します。プロフィールを選び、「やりたいこと」から始めます。" as const;

export type LjdDiaryWritingGuideStep = {
  id: string;
  title: string;
  body: string;
  note?: string;
};

/** ログハウスまでの共通手順 */
export const LJD_DIARY_WRITING_GUIDE_COMMON_STEPS: readonly LjdDiaryWritingGuideStep[] = [
  {
    id: "loghouse",
    title: "ログハウスを開く",
    body: "上部のメニュー、または森の入口から入ります。",
  },
  {
    id: "profile",
    title: "プロフィールを選ぶ（①）",
    body: "日記を書きたいプロフィールを選びます。",
    note: "プロフィールは、すべてご自身に関する内容として書く想定です。はじめての方は1つだけのことが多く、そのまま次へ進めます。",
  },
] as const;

export const LJD_DIARY_WRITING_GUIDE_CHOOSE_ACTION: LjdDiaryWritingGuideStep = {
  id: "choose",
  title: "②で書き方を選ぶ",
  body: "ログハウスの「やりたいことを選ぶ」から、次のどちらかを選びます。",
};

export const LJD_DIARY_WRITING_GUIDE_CHOOSE_COMPANION =
  "どうぶつ鑑定士に伴走してもらいながら書く場合は、「どうぶつ鑑定士といっしょに書く」を選びます。" as const;

export const LJD_DIARY_WRITING_GUIDE_CHOOSE_SOLO =
  "通常の日記執筆モードでは、「日記を書く」を選びます。カレンダーが開き、今日か別の日かで書き始め方が少し変わります。" as const;

export const LJD_DIARY_WRITING_GUIDE_COMPANION_SECTION_TITLE =
  "どうぶつ鑑定士といっしょに書く場合" as const;

export const LJD_DIARY_WRITING_GUIDE_COMPANION_TODAY_NOTE =
  "このモードは、基本的に「今日」の1ページを書く入口です（日付は自動で今日になります）。保存後はカレンダーに戻り、今日のしるしを確認できます。" as const;

/** 伴走ウィザードの流れ（画面の順） */
export const LJD_DIARY_WRITING_GUIDE_COMPANION_FLOW: readonly LjdDiaryWritingGuideStep[] = [
  {
    id: "companion-pick",
    title: "どうぶつ鑑定士を選ぶ",
    body: "いっしょに書いてくれる鑑定士を選びます。",
  },
  {
    id: "mood",
    title: "今日の気分を選ぶ",
    body: "いまの気持ちに近いものを選びます。",
  },
  {
    id: "activity",
    title: "今日はどんな1日だったか選ぶ",
    body: "今日の過ごし方に近いものを選びます。",
  },
  {
    id: "questions",
    title: "質問に答えながら書く",
    body: "フクロウ先生の質問に、短い言葉で答えていきます。",
  },
  {
    id: "confirm",
    title: "内容を確認して保存",
    body: "できあがった文章を確認し、「今日のあしあとを残す」で保存します。",
  },
] as const;

export const LJD_DIARY_WRITING_GUIDE_NORMAL_SECTION_TITLE =
  "日記を書く場合（通常の執筆モード）" as const;

/** カレンダー中心の説明（通常モードの前提） */
export const LJD_DIARY_WRITING_GUIDE_CALENDAR_HUB =
  "Life Journey Diary の日記は、カレンダーを中心に記録します。月ごとに日付を見渡し、書きたい日を選んで1ページを残します。記録がある日は、カレンダー上でわかります。" as const;

export const LJD_DIARY_WRITING_GUIDE_NORMAL_CALENDAR_NOTE =
  "いったんカレンダーに慣れると、あとから「画面下のカレンダー」タブからも同じ画面を開けます。" as const;

export const LJD_DIARY_WRITING_GUIDE_CALENDAR_PREVIEW_LABEL =
  "カレンダー画面のイメージ（今日と、選んだ日）" as const;

export const LJD_DIARY_WRITING_GUIDE_WRITE_TODAY_BUTTON = "今日の日記を書く" as const;

export const LJD_DIARY_WRITING_GUIDE_WRITE_SELECTED_BUTTON = "選択した日の日記を書く" as const;

/** 通常執筆の流れ */
export const LJD_DIARY_WRITING_GUIDE_NORMAL_FLOW: readonly LjdDiaryWritingGuideStep[] = [
  {
    id: "open-calendar",
    title: "カレンダーを開く",
    body: "ログハウス②の「日記を書く」を選ぶと、カレンダーが開きます。月を切り替えながら、書きたい日を見渡せます。",
  },
  {
    id: "write-today",
    title: "今日のページを書く（黄色）",
    body: `カレンダーでは、本日の日付が黄色くハイライトされ、「今日」と表示されます。そのまま黄色い「${LJD_DIARY_WRITING_GUIDE_WRITE_TODAY_BUTTON}」ボタンを押すと、今日の入力画面が開きます。`,
  },
  {
    id: "write-other-day",
    title: "今日以外の日を書く（緑）",
    body: `今日以外の出来事や気持ちを残したいときは、まずカレンダーで書きたい日付をタップします。選んだ日は緑色にハイライトされ、下に緑の「${LJD_DIARY_WRITING_GUIDE_WRITE_SELECTED_BUTTON}」ボタンが現れます。そこから入力画面へ進みます。`,
    note: "日付をタップすると、その日の日記一覧も下に表示されます。すでに記録がある日を選ぶと、続きの編集や読み返しにも進めます。",
  },
  {
    id: "body",
    title: "本文を書く",
    body: "選んだ日の入力画面で、出来事や思ったことを自分の言葉で書きます。",
  },
  {
    id: "photo",
    title: "写真を添える（任意）",
    body: "1日1枚まで添えられます。なくても保存できます。",
  },
  {
    id: "meta",
    title: "気分・活動を選ぶ",
    body: "その日の気持ちや、何をしたかを選びます。",
  },
  {
    id: "save",
    title: "保存する",
    body: "保存するとプレビュー画面に進みます。カレンダーには、その日のしるしが残ります（「読み解きコメント」の項目も参照）。",
  },
] as const;

export const LJD_DIARY_WRITING_GUIDE_LOGHOUSE_PREVIEW_LABEL =
  "ログハウス②の画面イメージ" as const;

export const LJD_DIARY_WRITING_GUIDE_DETAILS_TITLE =
  "入力のくわしい内容" as const;

export const LJD_DIARY_WRITING_GUIDE_DETAILS_ITEMS: readonly { title: string; body: string }[] = [
  {
    title: "カレンダー",
    body: "日記の起点です。本日は黄色、タップして選んだ日は緑色でハイライトされます。月を切り替えて日付を選び、記録のある日を見渡せます。",
  },
  {
    title: "1日1ページ",
    body: "通常の執筆モードでは、1日につき1枚のページとして残します。",
  },
  {
    title: "気分・活動",
    body: "あとから見返す手がかりになります。伴走モード・通常モードのどちらでも選べます。",
  },
  {
    title: "本文",
    body: "特別な文章である必要はありません。短くても大丈夫です。",
  },
  {
    title: "写真",
    body: "通常の執筆モードでは、1日1枚まで添えられます。",
  },
] as const;

/** 案内所⑤から④へ誘導する短い文 */
export const LJD_DIARY_WRITING_GUIDE_COMPANION_CROSSREF =
  "手順の全体像は、上の「日記の書き方」をご覧ください。" as const;

/** @deprecated 旧ステップ配列。表示は COMMON + 各フローへ移行済み */
export const LJD_DIARY_WRITING_GUIDE_STEPS = LJD_DIARY_WRITING_GUIDE_COMMON_STEPS;
