/** 森の案内所「あしあとブック」 */

export const LJD_DIARY_BOOK_GUIDE_SECTION_TITLE = "あしあとブック" as const;

export const LJD_DIARY_BOOK_GUIDE_SECTION_SUMMARY =
  "期間やタグでまとめて、1冊の本にする" as const;

export const LJD_DIARY_BOOK_GUIDE_LEAD =
  "あしあとブックは、書いたあしあとをまとめて1冊の本にする機能です。本棚の「あしあとブックを作る」セットからつくれます。" as const;

export type LjdDiaryBookGuideStep = {
  id: string;
  title: string;
  body: string;
  note?: string;
};

export const LJD_DIARY_BOOK_GUIDE_STEPS: readonly LjdDiaryBookGuideStep[] = [
  {
    id: "open",
    title: "本棚で「あしあとブックを作る」を開く",
    body: "ログハウスの本棚を開き、「あしあとブックを作る」セットをタップして「作る」を押します。",
  },
  {
    id: "name-cover",
    title: "名前と表紙を選ぶ",
    body: "あしあとブック名を付け、表紙の雰囲気（きれいめ／シンプルなど）を選びます。",
  },
  {
    id: "period",
    title: "対象期間を決める",
    body: "開始日と終了日を選び、どの期間のあしあとを本に入れるか決めます。",
  },
  {
    id: "tags",
    title: "タグでテーマを絞る（任意）",
    body: "「タグで絞り込む」を使うと、たとえば #おでかけ のあしあとだけを本にまとめられます。「すべて含む」「どれか含む」も選べます。",
    note: "タグを付けたあしあとほど、テーマ本がつくりやすくなります。",
  },
  {
    id: "preview",
    title: "掲載するあしあとを確認する",
    body: "条件に合うあしあとの件数と、本に入れるあしあとを確認してから作成します。",
  },
  {
    id: "create",
    title: "あしあとブックを作成する",
    body: "作成すると本棚に並びます。いちばん新しい本は表紙枠に、続いて2冊目・3冊目は棚のプレースホルダーに表示されます。本をタップして「選ぶ」で中身を確認できます。あとから期間やタグ条件、掲載するあしあとを直せます。",
  },
] as const;

export const LJD_DIARY_BOOK_GUIDE_COVER_PREVIEW_LABEL =
  "表紙の雰囲気イメージ（きれいめ／シンプル）" as const;
