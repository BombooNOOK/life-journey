import type { FirstVisitProgressStage } from "@/lib/onboarding/firstVisitWizard/progress";

/**
 * 初回導線で「森の入口へ戻る」を出す区切り（最大3回）。
 * ログハウス建築前はぶっ通し。区切りはここだけ。
 */
export const FIRST_VISIT_PAUSE_CHECKPOINT_STAGES = [
  "kantei", // ① アカウント作成〜ログハウス建築完了後
  "bookshelf-kantei", // ② 鑑定書作成・本棚到着後（別コンポーネントでも表示）
  // ③ 初回あしあと後 — companion 完了画面で別管理
] as const satisfies readonly FirstVisitProgressStage[];

export type FirstVisitPauseCheckpointStage = (typeof FIRST_VISIT_PAUSE_CHECKPOINT_STAGES)[number];

export function isFirstVisitPauseCheckpointStage(stage: FirstVisitProgressStage): boolean {
  return (FIRST_VISIT_PAUSE_CHECKPOINT_STAGES as readonly FirstVisitProgressStage[]).includes(stage);
}

/** ログハウス建築が終わるまで、森の入口への導線を出さない */
export const FIRST_VISIT_NO_PAUSE_BEFORE_LOGHOUSE_BUILD_STAGES = [
  "resident-card",
  "loghouse-sign",
  "loghouse",
] as const satisfies readonly FirstVisitProgressStage[];
