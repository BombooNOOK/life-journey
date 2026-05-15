/**
 * PATCH 時にフクロウ先生の読み解き（generatedComment）をそのまま残すか。
 * 記録日・気分・活動・おとものいずれかが変われば false（再生成）。
 */
export function shouldPreserveJournalGeneratedComment(input: {
  /** 検証用に true のときは常に再生成 */
  regenerateOwlComment: boolean;
  moodUnchanged: boolean;
  activityUnchanged: boolean;
  companionUnchanged: boolean;
  /** 記録日: クライアント送信の entryDate を parse した UTC 瞬間と DB createdAt が同一 */
  entryDateUnchanged: boolean;
  hasExistingComment: boolean;
}): boolean {
  if (input.regenerateOwlComment) return false;
  return (
    input.moodUnchanged &&
    input.activityUnchanged &&
    input.companionUnchanged &&
    input.entryDateUnchanged &&
    input.hasExistingComment
  );
}
