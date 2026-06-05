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
  countDiaryBookSnapshotEntries,
  diaryBookNeedsContentRefresh,
  entryVisibleInDiaryBookSnapshot,
} from "@/lib/journal/diaryBookSnapshot";
import { buildDiaryNumbers } from "@/lib/journal/numbers";
import {
  profileHasKanteiOrder,
  sanitizeJournalCommentForResponse,
} from "@/lib/journal/kanteiCommentEligibility";
import { normalizeDiaryDesignTheme } from "@/lib/journal/meta";
import { findDiaryBookRowForViewerOrAdmin } from "@/lib/journal/diaryBookAdminAccess";

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
  generatedComment: true,
  includeInBook: true,
} as const;

/** photoDataUrl 本文を Neon から読まず hasPhoto のみ取得 */
async function loadJournalEntryHasPhotoFlags(where: {
  email: string;
  profileId: string;
  createdAt: { gte: Date; lte: Date };
}): Promise<Map<string, boolean>> {
  const rows = await prisma.$queryRaw<Array<{ id: string; hasPhoto: boolean }>>(Prisma.sql`
    SELECT
      id,
      (
        ("photoBlobUrl" IS NOT NULL AND btrim("photoBlobUrl") <> '')
        OR ("photoDataUrl" IS NOT NULL AND btrim("photoDataUrl") <> '')
      ) AS "hasPhoto"
    FROM "JournalEntry"
    WHERE email = ${where.email}
      AND "profileId" = ${where.profileId}
      AND "createdAt" >= ${where.createdAt.gte}
      AND "createdAt" <= ${where.createdAt.lte}
  `);
  return new Map(rows.map((row) => [row.id, row.hasPhoto === true]));
}

export type DiaryBookWithEntries = {
  book: DiaryBookDto;
  profileId: string;
  entries: BoundDiaryEntry[];
};

export type DiaryBookMetaForViewer = {
  book: DiaryBookDto;
  profileId: string;
};

/** 閲覧ページ SSR 用（entries なし・件数と更新要否のみ） */
export async function getDiaryBookMetaForViewer(params: {
  bookId: string;
  viewerEmail: string;
}): Promise<DiaryBookMetaForViewer | null> {
  const row = await findDiaryBookRowForViewerOrAdmin(params);
  if (!row) return null;

  const [entryCount, needsContentRefresh] = await Promise.all([
    countDiaryBookSnapshotEntries({
      email: row.email,
      profileId: row.profileId,
      startDate: row.startDate,
      endDate: row.endDate,
      bookUpdatedAt: row.updatedAt,
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
    book: serializeDiaryBook(row, entryCount, { needsContentRefresh }),
    profileId: row.profileId,
  };
}

/** 閲覧中プロフィールに紐づく DiaryBook のみ返す */
export async function getDiaryBookWithEntriesForViewer(params: {
  bookId: string;
  viewerEmail: string;
}): Promise<DiaryBookWithEntries | null> {
  const row = await findDiaryBookRowForViewerOrAdmin(params);
  if (!row) return null;

  const ownerEmail = row.email;

  const [entries, entryCount, needsContentRefresh] = await Promise.all([
    listJournalEntriesForDiaryBookRow({
      book: row,
      viewerEmail: ownerEmail,
      respectSnapshot: true,
    }),
    countDiaryBookSnapshotEntries({
      email: row.email,
      profileId: row.profileId,
      startDate: row.startDate,
      endDate: row.endDate,
      bookUpdatedAt: row.updatedAt,
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
    book: serializeDiaryBook(row, entryCount, { needsContentRefresh }),
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

  const [rowsResult, hasPhotoById] = await Promise.all([
    (async (): Promise<JournalRow[]> => {
      try {
        return (await prisma.journalEntry.findMany({
          where,
          orderBy: { createdAt: "asc" },
          take: 500,
          select: entrySelect,
        })) as JournalRow[];
      } catch (error) {
        if (!isDesignThemeValidationError(error)) throw error;
        return (await prisma.journalEntry.findMany({
          where,
          orderBy: { createdAt: "asc" },
          take: 500,
          select: entrySelectFallback,
        })) as JournalRow[];
      }
    })(),
    loadJournalEntryHasPhotoFlags(where),
  ]);
  const rows = rowsResult;

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
      hasPhoto: hasPhotoById.get(row.id) === true,
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
