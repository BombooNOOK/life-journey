/** 初回導線の区切りページ：森の入口へ戻る（続きは再開時に復帰） */
export const FIRST_VISIT_MILESTONE_HOME_BUTTON =
  "森の入口（トップページ）に戻って次回は続きから" as const;

/** @see firstVisitCheckpoints.ts — 区切りは最大3回（建築後・鑑定後・初回あしあと後） */

/** 区切りで森の入口に戻ったあと、続きから再開する案内 */
export const FIRST_VISIT_RESUME_HINT =
  "続きは、森の入口の「はじめての方」から「はじめての道しるべ」で確認できます。" as const;
