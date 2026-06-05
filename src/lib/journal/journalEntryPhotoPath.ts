/** 認証付き日記写真 GET（Blob / legacy 両対応） */
export function journalEntryPhotoApiPath(entryId: string): string {
  return `/api/journal/entries/${encodeURIComponent(entryId)}/photo`;
}
