/** あしあとブック本文・製本ページ数の対象か（未設定は ON） */
export function isEntryIncludedInDiaryBook(entry: { includeInBook?: boolean | null }): boolean {
  return entry.includeInBook !== false;
}

export function filterEntriesForDiaryBook<T extends { includeInBook?: boolean | null }>(
  entries: T[],
): T[] {
  return entries.filter(isEntryIncludedInDiaryBook);
}
