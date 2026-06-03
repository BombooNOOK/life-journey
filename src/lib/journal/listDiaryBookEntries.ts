import type { DiaryBook } from "@prisma/client";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import type { BoundDiaryEntry } from "@/components/journal/DiaryYearBoundPages";
import { serializeDiaryBook, type DiaryBookDto } from "@/lib/journal/diaryBookDto";
import {
  journalEntryCreatedAtRangeForBookPeriod,
  parseDiaryBookDateRange,
} from "@/lib/journal/diaryBookPeriod";
import {
  diaryBookNeedsContentRefresh,
  entryVisibleInDiaryBookSnapshot,
} from "@/lib/journal/diaryBookSnapshot";
import { buildDiaryNumbers } from "@/lib/journal/numbers";
import {
  profileHasKanteiOrder,
  sanitizeJournalCommentForResponse,
} from "@/lib/journal/kanteiCommentEligibility";
import { normalizeDiaryDesignTheme } from "@/lib/journal/meta";
import { resolveActiveProfileId } from "@/lib/profile/activeProfile";

function isDesignThemeValidationError(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientValidationError)) return false;
  return /designTheme/.test(error.message);
}

type JournalRow = {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  mood: string;
  activity: string;
  companionType: string;
  designTheme?: string;
  contentFontMode: string;
  photoDataUrl?: string | null;
  generatedComment?: string | null;
  includeInBook: boolean;
};

  const entrySelect = {
  id: true,
  content: true,
  createdAt: true,
  updatedAt: true,
  mood: true,
  activity: true,
  companionType: true,
  designTheme: true,
  contentFontMode: true,
  photoDataUrl: true,
  generatedComment: true,
  includeInBook: true,
} as const;

const entrySelectFallback = {
  id: true,
  content: true,
  createdAt: true,
  updatedAt: true,
  mood: true,
  activity: true,
  companionType: true,
  contentFontMode: true,
  photoDataUrl: true,
  generatedComment: true,
  includeInBook: true,
} as const;

export type DiaryBookWithEntries = {
  book: DiaryBookDto;
  profileId: string;
  entries: BoundDiaryEntry[];
};

/** 閲覧中プロフィールに紐づく DiaryBook のみ返す */
export async function getDiaryBookWithEntriesForViewer(params: {
  bookId: string;
  viewerEmail: string;
}): Promise<DiaryBookWithEntries | null> {
  const activeProfileId = await resolveActiveProfileId(params.viewerEmail);
  if (!activeProfileId) return null;

  const trimmedId = params.bookId.trim();
  if (!trimmedId) return null;

  const row = await prisma.diaryBook.findFirst({
    where: {
      id: trimmedId,
      email: params.viewerEmail,
      profileId: activeProfileId,
    },
  });
  if (!row) return null;

  const [entries, needsContentRefresh] = await Promise.all([
    listJournalEntriesForDiaryBookRow({
      book: row,
      viewerEmail: params.viewerEmail,
      respectSnapshot: true,
    }),
    diaryBookNeedsContentRefresh({
      email: row.email,
      profileId: row.profileId,
      startDate: row.startDate,
      endDate: row.endDate,
      bookUpdatedAt: row.updatedAt,
    }),
  ]);

  return {
    book: serializeDiaryBook(row, entries.length, { needsContentRefresh }),
    profileId: row.profileId,
    entries,
  };
}

export async function listJournalEntriesForDiaryBookRow(params: {
  book: Pick<DiaryBook, "email" | "profileId" | "startDate" | "endDate" | "updatedAt">;
  viewerEmail: string;
  /** false のとき製本判定など最新の includeInBook をそのまま使う */
  respectSnapshot?: boolean;
}): Promise<BoundDiaryEntry[]> {
  const respectSnapshot = params.respectSnapshot !== false;
  const range = parseDiaryBookDateRange(params.book.startDate, params.book.endDate);
  if (!range) return [];

  const createdAt = journalEntryCreatedAtRangeForBookPeriod(range);
  const where = {
    email: params.viewerEmail,
    profileId: params.book.profileId,
    createdAt,
  };

  let rows: JournalRow[] = [];
  try {
    rows = (await prisma.journalEntry.findMany({
      where,
      orderBy: { createdAt: "asc" },
      take: 500,
      select: entrySelect,
    })) as JournalRow[];
  } catch (error) {
    if (!isDesignThemeValidationError(error)) throw error;
    rows = (await prisma.journalEntry.findMany({
      where,
      orderBy: { createdAt: "asc" },
      take: 500,
      select: entrySelectFallback,
    })) as JournalRow[];
  }

  let lifePathNumber: number | null = null;
  let birthMonth: number | null = null;
  let birthDay: number | null = null;
  if (rows.length > 0) {
    const latestOrder = await prisma.order.findFirst({
      where: { email: params.viewerEmail, profileId: params.book.profileId },
      orderBy: { createdAt: "desc" },
      select: {
        birthMonth: true,
        birthDay: true,
        numerologyJson: true,
      },
    });
    birthMonth = latestOrder?.birthMonth ?? null;
    birthDay = latestOrder?.birthDay ?? null;
    if (latestOrder?.numerologyJson) {
      try {
        const parsed = JSON.parse(latestOrder.numerologyJson) as { lifePathNumber?: unknown };
        const value = Number(parsed.lifePathNumber);
        if (Number.isFinite(value)) lifePathNumber = value;
      } catch {
        lifePathNumber = null;
      }
    }
  }

  const kanteiOrderExists = await profileHasKanteiOrder(
    params.viewerEmail,
    params.book.profileId,
  );

  const snapshotRows = respectSnapshot
    ? rows.filter((row) =>
        entryVisibleInDiaryBookSnapshot(row, params.book.updatedAt),
      )
    : rows.filter((row) => row.includeInBook !== false);

  return snapshotRows.map((row) => {
    const normalizedComment =
      row.generatedComment != null && row.generatedComment !== ""
        ? sanitizeJournalCommentForResponse(row.generatedComment, kanteiOrderExists)
        : null;
    return {
      id: row.id,
      content: row.content,
      createdAt: row.createdAt.toISOString(),
      mood: row.mood,
      activity: row.activity,
      companionType: row.companionType,
      designTheme: normalizeDiaryDesignTheme(row.designTheme ?? "simple_plain"),
      contentFontMode: row.contentFontMode,
      photoDataUrl: row.photoDataUrl ?? null,
      generatedComment: normalizedComment,
      includeInBook: row.includeInBook,
      diaryNumbers: buildDiaryNumbers({
        birthMonth,
        birthDay,
        lifePathNumber,
        date: row.createdAt,
      }),
    };
  });
}
