import { prisma } from "@/lib/db";

export const NO_ENTRIES_IN_DIARY_BOOK_PERIOD_MESSAGE =
  "この期間には日記がありません。\n期間を変更するか、日記を書いてから日記ブックを作成してください。";

export const NO_INCLUDED_ENTRIES_IN_DIARY_BOOK_PERIOD_MESSAGE =
  "この期間に日記はありますが、本に入れる日記が0件です。\n下の一覧で「この日記を本に入れる」にチェックを入れ、「選択を保存する」を押してから日記ブックを作成してください。";

export type DiaryBookDateRange = {
  startDate: string;
  endDate: string;
};

/** 記録日 input（YYYY-MM-DD）を検証 */
export function parseDiaryBookDateInput(input: string): string | null {
  const trimmed = input.trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!m) return null;
  const y = Number(m[1]);
  const mon = Number(m[2]);
  const d = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mon) || !Number.isFinite(d)) return null;
  if (mon < 1 || mon > 12 || d < 1 || d > 31) return null;
  const probe = new Date(Date.UTC(y, mon - 1, d, 12, 0, 0));
  if (
    probe.getUTCFullYear() !== y ||
    probe.getUTCMonth() !== mon - 1 ||
    probe.getUTCDate() !== d
  ) {
    return null;
  }
  return trimmed;
}

export function parseDiaryBookDateRange(
  startDateRaw: string,
  endDateRaw: string,
): DiaryBookDateRange | null {
  const startDate = parseDiaryBookDateInput(startDateRaw);
  const endDate = parseDiaryBookDateInput(endDateRaw);
  if (!startDate || !endDate) return null;
  if (startDate > endDate) return null;
  return { startDate, endDate };
}

/** JournalEntry.createdAt 用の inclusive 範囲（UTC 正午の記録日） */
export function journalEntryCreatedAtRangeForBookPeriod(range: DiaryBookDateRange): {
  gte: Date;
  lte: Date;
} {
  const [sy, sm, sd] = range.startDate.split("-").map(Number);
  const [ey, em, ed] = range.endDate.split("-").map(Number);
  return {
    gte: new Date(Date.UTC(sy, sm - 1, sd, 12, 0, 0)),
    lte: new Date(Date.UTC(ey, em - 1, ed, 12, 0, 0)),
  };
}

export async function countJournalEntriesInDiaryBookPeriod(params: {
  email: string;
  profileId: string;
  startDate: string;
  endDate: string;
}): Promise<number> {
  const range = parseDiaryBookDateRange(params.startDate, params.endDate);
  if (!range) return 0;
  const createdAt = journalEntryCreatedAtRangeForBookPeriod(range);
  return prisma.journalEntry.count({
    where: {
      email: params.email,
      profileId: params.profileId,
      createdAt,
      includeInBook: true,
    },
  });
}
