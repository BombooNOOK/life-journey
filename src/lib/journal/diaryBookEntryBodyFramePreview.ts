/** 本文枠スタイル比較プレビュー用（製本確定前の見比べ） */
export const DIARY_BOOK_ENTRY_BODY_FRAME_PREVIEW_VARIANTS = [
  { id: "border", label: "A. 現状（角丸の線枠）" },
  { id: "none", label: "B. 枠なし（タイトル＋本文のみ）" },
  { id: "branch", label: "C. 枠なし＋タイトル下に枝装飾" },
  { id: "fill", label: "D. フクロウ欄と同じベージュ塗り" },
  { id: "fill-subtle", label: "E. ごく薄いベージュ塗り" },
  { id: "none-pawprint", label: "F. 枠なし＋足跡スタンプ（確定）" },
] as const;

export type DiaryBookEntryBodyFramePreviewVariant =
  (typeof DIARY_BOOK_ENTRY_BODY_FRAME_PREVIEW_VARIANTS)[number]["id"];

/** 製本・本棚プレビューの既定（枠なし＋足跡） */
export const DIARY_BOOK_ENTRY_V2_BODY_FRAME_VARIANT: DiaryBookEntryBodyFramePreviewVariant =
  "none-pawprint";

export function diaryBookEntryBodyFramePreviewLabel(
  variant: DiaryBookEntryBodyFramePreviewVariant,
): string {
  return (
    DIARY_BOOK_ENTRY_BODY_FRAME_PREVIEW_VARIANTS.find((item) => item.id === variant)?.label ??
    variant
  );
}

/** タイトル直下の枝装飾（比較プレビュー C 用） */
export const DIARY_BOOK_ENTRY_V2_BODY_BRANCH_UNDER_TITLE = {
  topPx: 418,
  widthPx: 148,
  heightPx: 36,
  leftPx: 40,
} as const;

export const DIARY_BOOK_ENTRY_BODY_FRAME_FILL_SUBTLE = "#F7F3EC" as const;
