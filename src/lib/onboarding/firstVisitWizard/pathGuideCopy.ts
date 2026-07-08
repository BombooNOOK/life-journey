/** 看板内の短い説明（進行中） */
export const FIRST_VISIT_PATH_GUIDE_INTRO = "3つの章から、ゆっくり歩いてみましょう。" as const;

/** 看板内の短い説明（全章完了後） */
export const FIRST_VISIT_PATH_GUIDE_COMPLETE_INTRO = "ご案内は完了しました。いつでも見返せます。" as const;

export const FIRST_VISIT_PATH_GUIDE_TITLE = "はじめての道しるべ" as const;

export const FIRST_VISIT_PATH_GUIDE_BACK_LABEL = "もどる" as const;

export const FIRST_VISIT_PATH_GUIDE_START_LABEL = "はじめる" as const;

export const FIRST_VISIT_CHAPTER_STATUS_LABELS = {
  locked: "前の章が終わると進めます",
  available: "ここから進む",
  in_progress: "続きから進む",
  complete: "完了しました",
  review: "見返す",
} as const;
