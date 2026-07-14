/** 森の案内所「日記の書き方」— 辞書トーンの原稿（はじめて導線とは別） */

export const LJD_DIARY_WRITING_GUIDE_SECTION_SUMMARY =
  "ログハウスの机から、ひとりで書くか・いっしょに書くかを選ぶ" as const;

export const LJD_DIARY_WRITING_GUIDE_LEAD =
  "日記は、ログハウスの机から書きます。机をタップすると、今日の書き方を選べます。" as const;

export type LjdDiaryWritingGuideStep = {
  id: string;
  title: string;
  body: string;
  note?: string;
};

/** ログハウス〜机までの共通手順 */
export const LJD_DIARY_WRITING_GUIDE_COMMON_STEPS: readonly LjdDiaryWritingGuideStep[] = [
  {
    id: "loghouse",
    title: "ログハウスを開く",
    body: "上部のメニュー、または森の入口から入ります。",
  },
  {
    id: "profile",
    title: "プロフィールを確認する",
    body: "どのプロフィールの日記として残すか、はじめに確認します。",
    note: "プロフィールが複数あるときは、机のあとの「今日はどうしますか？」画面の上部で切り替えられます。日記は、すべてご自身に関する内容として書く想定です。",
  },
  {
    id: "desk",
    title: "机をタップする",
    body: "ログハウスの室内で、机をタップします。ここが日記のはじまりです。",
  },
] as const;

export const LJD_DIARY_WRITING_GUIDE_CHOOSE_ACTION: LjdDiaryWritingGuideStep = {
  id: "choose",
  title: "今日はどうしますか？",
  body: "机のあとに、書き方を選ぶ画面が開きます。次のどちらかを選べます。",
};

export const LJD_DIARY_WRITING_GUIDE_CHOOSE_COMPANION =
  "どうぶつ鑑定士といっしょに書く場合は、「鑑定士といっしょに書く」を選びます。" as const;

export const LJD_DIARY_WRITING_GUIDE_CHOOSE_SOLO =
  "ひとりで書く場合は、「ひとりで書く」を選びます。カレンダーが開き、今日か別の日かで書き始め方が少し変わります。" as const;

export const LJD_DIARY_WRITING_GUIDE_CHOOSE_FIRST_NOTE =
  "はじめての日記（まだ1件も書いていないとき）は、この選択を挟まず、鑑定士といっしょに書く流れへ進みます。" as const;

export const LJD_DIARY_WRITING_GUIDE_COMPANION_SECTION_TITLE =
  "鑑定士といっしょに書く場合" as const;

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
    title: "内容を確認する",
    body: "できあがった文章を確認します。",
  },
  {
    id: "tags",
    title: "タグをつける（任意）",
    body: "確認画面の「タグをつける」から、あとで探しやすいしるしを付けられます。例）#おでかけ #家族。なくても保存できます。",
  },
  {
    id: "save",
    title: "あしあとを残す",
    body: "「今日のあしあとを残す」で保存します。カレンダーには、その日のしるしが残ります。",
  },
] as const;

export const LJD_DIARY_WRITING_GUIDE_NORMAL_SECTION_TITLE =
  "ひとりで書く場合" as const;

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
    body: "「ひとりで書く」を選ぶと、カレンダーが開きます。月を切り替えながら、書きたい日を見渡せます。",
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
    id: "tags",
    title: "タグをつける（任意）",
    body: "「タグをつける」から、あとで探しやすいしるしを付けられます。例）#おでかけ #家族。日記一覧からの検索や、日記ブックのテーマ絞り込みに使えます。なくても保存できます。",
  },
  {
    id: "save",
    title: "保存する",
    body: "保存するとプレビュー画面に進みます。カレンダーには、その日のしるしが残ります（「読み解きコメント」の項目も参照）。",
  },
] as const;

export const LJD_DIARY_WRITING_GUIDE_LOGHOUSE_PREVIEW_LABEL =
  "机のあと：書き方を選ぶ画面イメージ" as const;

export const LJD_DIARY_WRITING_GUIDE_DETAILS_TITLE =
  "入力のくわしい内容" as const;

export const LJD_DIARY_WRITING_GUIDE_DETAILS_ITEMS: readonly { title: string; body: string }[] = [
  {
    title: "カレンダー",
    body: "日記の起点です。本日は黄色、タップして選んだ日は緑色でハイライトされます。月を切り替えて日付を選び、記録のある日を見渡せます。",
  },
  {
    title: "1日1ページ",
    body: "ひとりで書く場合は、1日につき1枚のページとして残します。",
  },
  {
    title: "気分・活動",
    body: "あとから見返す手がかりになります。いっしょに書く場合・ひとりで書く場合のどちらでも選べます。",
  },
  {
    title: "本文",
    body: "特別な文章である必要はありません。短くても大丈夫です。",
  },
  {
    title: "写真",
    body: "ひとりで書く場合は、1日1枚まで添えられます。",
  },
  {
    title: "タグ",
    body: "任意のしるしです。「タグをつける」で付けられます。日記一覧の「日記を探す」からタグで探したり、日記ブックを作るときにテーマで絞り込んだりできます。ひとりで書く場合も、鑑定士といっしょに書く場合も同じように付けられます。",
  },
] as const;

/** 案内所から「日記の書き方」への誘導用の短い文 */
export const LJD_DIARY_WRITING_GUIDE_COMPANION_CROSSREF =
  "手順の全体像は、上の「日記の書き方」をご覧ください。" as const;

/** @deprecated 旧ステップ配列。表示は COMMON + 各フローへ移行済み */
export const LJD_DIARY_WRITING_GUIDE_STEPS = LJD_DIARY_WRITING_GUIDE_COMMON_STEPS;
