/** 森の本棚：？ヘルプ／初回案内の文言・保存キー */

export const FOREST_BOOKSHELF_HELP_BUTTON_LABEL = "本棚の見方";

export const FOREST_BOOKSHELF_HELP_MODAL_TITLE = "本棚の見方";

export const FOREST_BOOKSHELF_HELP_MODAL_LINES = [
  "表紙の本をタップすると、中身を選べます。",
  "背表紙が並んだ本は、一覧につながっています。",
  "「日記ブックを作る」から、新しい日記ブックを作れます。",
] as const;

export const FOREST_BOOKSHELF_HELP_MODAL_DISMISS = "わかりました";

export const FOREST_BOOKSHELF_FIRST_VISIT_TIP = [
  "本をタップすると、しまってあるものを選べます。",
  "迷ったら、右上の「？」を押してみてくださいね。",
].join("\n");

export const FOREST_BOOKSHELF_FIRST_VISIT_TIP_DISMISS = "わかった";

/** localStorage: 初回吹き出しを閉じたら "1" */
export const FOREST_BOOKSHELF_FIRST_VISIT_TIP_STORAGE_KEY =
  "ljd.forestBookshelf.tapHintIntroSeen.v1";
