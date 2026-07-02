/** ログハウス（/orders）の初回向け案内の出し分け */
export type FirstVisitGuideState =
  | "needs_kantei"
  | "ready_first_journal"
  | "returning";

export function resolveFirstVisitGuideState(input: {
  hasKanteiOrder: boolean;
  journalEntryCount: number;
}): FirstVisitGuideState {
  if (!input.hasKanteiOrder) return "needs_kantei";
  if (input.journalEntryCount <= 0) return "ready_first_journal";
  return "returning";
}
