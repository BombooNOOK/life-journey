/** あしあと入力画面の表示用（保存ロジックは変更しない） */

export function isValidJournalDateInput(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const probe = new Date(y, m - 1, d);
  return (
    probe.getFullYear() === y &&
    probe.getMonth() === m - 1 &&
    probe.getDate() === d
  );
}

/** ローカル暦日の YYYY-MM-DD（entryDate との比較用） */
export function localTodayDateInputValue(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isJournalEntryDateToday(entryDate: string): boolean {
  if (!isValidJournalDateInput(entryDate)) return true;
  return entryDate === localTodayDateInputValue();
}

/** 例: 2026年5月26日のあしあと */
export function formatJournalRecordPageTitle(entryDate: string): string {
  if (!isValidJournalDateInput(entryDate)) return "あしあと";
  const [y, m, d] = entryDate.split("-").map(Number);
  return `${y}年${m}月${d}日のあしあと`;
}

/** あしあとプレビュー見出し用（例: 2026年6月16日） */
export function formatJournalPreviewDateHeading(value: string | number | Date): string {
  const d =
    typeof value === "string" || typeof value === "number" ? new Date(value) : value;
  return d.toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function journalBodyInputHeading(entryDate: string): string {
  return isJournalEntryDateToday(entryDate)
    ? "今日のことを書いてみる"
    : "この日のことを書いてみる";
}
