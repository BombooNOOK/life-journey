/** 森の案内所「日記ブック」 */

export const LJD_DIARY_BOOK_GUIDE_SECTION_TITLE = "日記ブック" as const;

export const LJD_DIARY_BOOK_GUIDE_SECTION_SUMMARY =
  "期間やタグでまとめて、1冊の本にする" as const;

export const LJD_DIARY_BOOK_GUIDE_LEAD =
  "日記ブックは、書いた日記をまとめて1冊の本にする機能です。本棚の「本にする」からつくれます。" as const;

export type LjdDiaryBookGuideStep = {
  id: string;
  title: string;
  body: string;
  note?: string;
};

export const LJD_DIARY_BOOK_GUIDE_STEPS: readonly LjdDiaryBookGuideStep[] = [
  {
    id: "open",
    title: "本棚で「本にする」を開く",
    body: "本棚の「日記ブックを作る」から「本にする」を押します。",
  },
  {
    id: "name-cover",
    title: "名前と表紙を選ぶ",
    body: "日記ブック名を付け、表紙の雰囲気（きれいめ／シンプルなど）を選びます。",
  },
  {
    id: "period",
    title: "対象期間を決める",
    body: "開始日と終了日を選び、どの期間の日記を本に入れるか決めます。",
  },
  {
    id: "tags",
    title: "タグでテーマを絞る（任意）",
    body: "「タグで絞り込む」を使うと、たとえば #おでかけ の日記だけを本にまとめられます。「すべて含む」「どれか含む」も選べます。",
    note: "タグを付けた日記ほど、テーマ本がつくりやすくなります。",
  },
  {
    id: "preview",
    title: "掲載する日記を確認する",
    body: "条件に合う日記の件数と、本に入れる日記を確認してから作成します。",
  },
  {
    id: "create",
    title: "日記ブックを作成する",
    body: "作成すると本棚に並びます。「読む」で中身を確認できます。あとから期間やタグ条件、掲載する日記を直せます。",
  },
] as const;

export const LJD_DIARY_BOOK_GUIDE_COVER_PREVIEW_LABEL =
  "表紙の雰囲気イメージ（きれいめ／シンプル）" as const;
