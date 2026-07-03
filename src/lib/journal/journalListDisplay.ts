import { stripTagsFromContent } from "@/lib/journal/diaryTags";
import { entryMonthKeyFromCreatedAt } from "@/lib/journal/journalNav";

export type JournalListEntry = {
  id: string;
  content: string;
  createdAt: string;
  designTheme?: string;
  hasPhoto?: boolean;
};

export type JournalListMonthGroup = {
  monthKey: string;
  monthLabel: string;
  entries: JournalListEntry[];
};

/** 一覧用：本文の先頭1行を短く表示 */
export function journalEntryListPreviewLine(content: string, maxLength = 52): string {
  const firstLine = stripTagsFromContent(content).trim().split(/\r?\n/)[0]?.trim() ?? "";
  if (!firstLine) return "（本文なし）";
  if (firstLine.length <= maxLength) return firstLine;
  return `${firstLine.slice(0, maxLength)}…`;
}

/** 記録日の表示（例: 6月16日） */
export function formatJournalListDayLabel(createdAt: string): string {
  const d = new Date(createdAt);
  return d.toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "long",
    day: "numeric",
  });
}

/** 月見出し（例: 2026年6月） */
export function formatJournalListMonthHeading(monthKey: string): string {
  const parsed = /^(\d{4})-(\d{2})$/.exec(monthKey);
  if (!parsed) return monthKey;
  const year = Number(parsed[1]);
  const month = Number(parsed[2]);
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString("ja-JP", { year: "numeric", month: "long" });
}

export function groupJournalEntriesByMonth(entries: JournalListEntry[]): JournalListMonthGroup[] {
  const byMonth = new Map<string, JournalListEntry[]>();

  for (const entry of entries) {
    const monthKey = entryMonthKeyFromCreatedAt(entry.createdAt);
    const bucket = byMonth.get(monthKey);
    if (bucket) bucket.push(entry);
    else byMonth.set(monthKey, [entry]);
  }

  return [...byMonth.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([monthKey, monthEntries]) => ({
      monthKey,
      monthLabel: formatJournalListMonthHeading(monthKey),
      entries: [...monthEntries].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    }));
}
