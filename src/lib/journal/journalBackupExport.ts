import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { PassThrough, type Readable } from "node:stream";

import { ZipArchive, type Archiver } from "archiver";

import { normalizeEmail } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import { journalProfileIdsForQuery } from "@/lib/profile/activeProfile";
import { buildDiaryNumbers } from "@/lib/journal/numbers";
import { journalEntryHasStoredPhoto } from "@/lib/journal/journalEntryPhotoPersist";
import { loadJournalEntryPhotoPayload } from "@/lib/journal/journalEntryPhotoResolve";
import { normalizeDiaryDesignTheme } from "@/lib/journal/meta";

export const JOURNAL_BACKUP_FORMAT = "life-journey-diary-backup" as const;
export const JOURNAL_BACKUP_FORMAT_VERSION = 1 as const;

export type JournalBackupPhotoEntry = {
  index: number;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  source: "blob" | "legacy_data_url";
};

export type JournalBackupEntry = {
  id: string;
  createdAt: string;
  updatedAt: string;
  content: string;
  mood: string;
  activity: string;
  companionType: string;
  designTheme: string;
  contentFontMode: string;
  generatedComment: string | null;
  includeInBook: boolean;
  diaryNumbers: {
    today: number;
    month: number;
    year: number;
    calmness: number;
  };
  photos: JournalBackupPhotoEntry[];
};

export type JournalBackupDocument = {
  format: typeof JOURNAL_BACKUP_FORMAT;
  formatVersion: typeof JOURNAL_BACKUP_FORMAT_VERSION;
  exportedAt: string;
  app: "Life Journey Diary";
  photoPolicy: {
    exportedPhotoType: "processed";
    descriptionJa: string;
    description: string;
  };
  profile: {
    id: string;
    nickname: string;
    birthDate: string | null;
    birthMonth: number | null;
    birthDay: number | null;
    lifePathNumber: number | null;
  };
  entries: JournalBackupEntry[];
  diaryBooks: Array<{
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    coverTheme: string;
    createdAt: string;
    updatedAt: string;
  }>;
  bookshelfBooks: Array<{
    year: number;
    displayTitle: string | null;
    coverTheme: string;
    periodStartMonth: number;
    periodEndMonth: number;
    createdAt: string;
    updatedAt: string;
  }>;
};

export type JournalBackupPhotoJob = {
  entryId: string;
  zipPath: string;
  row: {
    id: string;
    photoDataUrl: string | null;
    photoBlobUrl: string | null;
    photoBlobPathname: string | null;
    photoMimeType: string | null;
    photoSizeBytes: number | null;
    photoStorageProvider: string | null;
  };
};

export type JournalBackupBuildResult = {
  document: JournalBackupDocument;
  photoJobs: JournalBackupPhotoJob[];
  filename: string;
};

export function photoExtensionFromMimeType(mimeType: string): string {
  const mime = mimeType.toLowerCase();
  if (mime.includes("webp")) return "webp";
  if (mime.includes("png")) return "png";
  return "jpg";
}

export function backupPhotoZipPath(entryId: string, index: number, mimeType: string): string {
  const ext = photoExtensionFromMimeType(mimeType);
  const suffix = index === 0 ? "" : `_${index + 1}`;
  return `photos/entry_${entryId}${suffix}.${ext}`;
}

export function journalBackupZipFilename(profileId: string, exportedAt = new Date()): string {
  const shortId = profileId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8) || "profile";
  const ymd = exportedAt.toISOString().slice(0, 10).replace(/-/g, "");
  return `life-journey-diary-backup_${shortId}_${ymd}.zip`;
}

function parseLifePathNumber(numerologyJson: string | null | undefined): number | null {
  if (!numerologyJson) return null;
  try {
    const parsed = JSON.parse(numerologyJson) as { lifePathNumber?: unknown };
    const value = Number(parsed.lifePathNumber);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

function inferPhotoSource(row: {
  photoBlobUrl: string | null;
  photoDataUrl: string | null;
}): "blob" | "legacy_data_url" {
  return row.photoBlobUrl?.trim() ? "blob" : "legacy_data_url";
}

export async function buildJournalBackupData(params: {
  viewerEmail: string;
  profileId: string;
  profileNickname: string;
  exportedAt?: Date;
}): Promise<JournalBackupBuildResult> {
  const email = normalizeEmail(params.viewerEmail);
  const exportedAt = params.exportedAt ?? new Date();
  const profileIds = journalProfileIdsForQuery(params.profileId, email);

  const [entries, diaryBooks, bookshelfBooks, latestOrder] = await Promise.all([
    prisma.journalEntry.findMany({
      where: {
        email,
        profileId: { in: profileIds },
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        content: true,
        mood: true,
        activity: true,
        companionType: true,
        designTheme: true,
        contentFontMode: true,
        generatedComment: true,
        includeInBook: true,
        photoDataUrl: true,
        photoBlobUrl: true,
        photoBlobPathname: true,
        photoMimeType: true,
        photoSizeBytes: true,
        photoStorageProvider: true,
      },
    }),
    prisma.diaryBook.findMany({
      where: {
        email,
        profileId: { in: profileIds },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.diaryBookshelfBook.findMany({
      where: {
        email,
        profileId: { in: profileIds },
      },
      orderBy: { year: "asc" },
    }),
    prisma.order.findFirst({
      where: {
        email,
        profileId: { in: profileIds },
      },
      orderBy: { createdAt: "desc" },
      select: {
        birthDate: true,
        birthMonth: true,
        birthDay: true,
        numerologyJson: true,
      },
    }),
  ]);

  const birthMonth = latestOrder?.birthMonth ?? null;
  const birthDay = latestOrder?.birthDay ?? null;
  const lifePathNumber = parseLifePathNumber(latestOrder?.numerologyJson);

  const photoJobs: JournalBackupPhotoJob[] = [];
  const backupEntries: JournalBackupEntry[] = entries.map((row) => {
    const photos: JournalBackupPhotoEntry[] = [];
    if (journalEntryHasStoredPhoto(row)) {
      const mimeType = row.photoMimeType?.trim() || "image/webp";
      const zipPath = backupPhotoZipPath(row.id, 0, mimeType);
      photos.push({
        index: 0,
        filename: zipPath,
        mimeType,
        sizeBytes: row.photoSizeBytes ?? 0,
        source: inferPhotoSource(row),
      });
      photoJobs.push({
        entryId: row.id,
        zipPath,
        row: {
          id: row.id,
          photoDataUrl: row.photoDataUrl,
          photoBlobUrl: row.photoBlobUrl,
          photoBlobPathname: row.photoBlobPathname,
          photoMimeType: row.photoMimeType,
          photoSizeBytes: row.photoSizeBytes,
          photoStorageProvider: row.photoStorageProvider,
        },
      });
    }

    return {
      id: row.id,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      content: row.content,
      mood: row.mood,
      activity: row.activity,
      companionType: row.companionType,
      designTheme: normalizeDiaryDesignTheme(row.designTheme ?? "simple_plain"),
      contentFontMode: row.contentFontMode,
      generatedComment: row.generatedComment,
      includeInBook: row.includeInBook,
      diaryNumbers: buildDiaryNumbers({
        birthMonth,
        birthDay,
        lifePathNumber,
        date: row.createdAt,
      }),
      photos,
    };
  });

  const document: JournalBackupDocument = {
    format: JOURNAL_BACKUP_FORMAT,
    formatVersion: JOURNAL_BACKUP_FORMAT_VERSION,
    exportedAt: exportedAt.toISOString(),
    app: "Life Journey Diary",
    photoPolicy: {
      exportedPhotoType: "processed",
      descriptionJa:
        "写真は Life Journey Diary で表示・保存されている加工済み画像です。元画像や切り出し位置（スライダー）は含まれません。",
      description:
        "Photos are exported as processed images used in Life Journey Diary. Original uploads and crop slider positions are not included.",
    },
    profile: {
      id: params.profileId,
      nickname: params.profileNickname,
      birthDate: latestOrder?.birthDate ?? null,
      birthMonth,
      birthDay,
      lifePathNumber,
    },
    entries: backupEntries,
    diaryBooks: diaryBooks.map((book) => ({
      id: book.id,
      title: book.title,
      startDate: book.startDate,
      endDate: book.endDate,
      coverTheme: book.coverTheme,
      createdAt: book.createdAt.toISOString(),
      updatedAt: book.updatedAt.toISOString(),
    })),
    bookshelfBooks: bookshelfBooks.map((book) => ({
      year: book.year,
      displayTitle: book.displayTitle,
      coverTheme: book.coverTheme,
      periodStartMonth: book.periodStartMonth,
      periodEndMonth: book.periodEndMonth,
      createdAt: book.createdAt.toISOString(),
      updatedAt: book.updatedAt.toISOString(),
    })),
  };

  return {
    document,
    photoJobs,
    filename: journalBackupZipFilename(params.profileId, exportedAt),
  };
}

const PHOTO_FETCH_CONCURRENCY = 6;

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const current = nextIndex;
      nextIndex += 1;
      results[current] = await mapper(items[current]!);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

export async function appendJournalBackupPhotosToArchive(
  archive: Archiver,
  photoJobs: JournalBackupPhotoJob[],
): Promise<{ appended: number; skipped: number }> {
  const fetched = await mapWithConcurrency(photoJobs, PHOTO_FETCH_CONCURRENCY, async (job) => {
    const payload = await loadJournalEntryPhotoPayload(job.row);
    if (!payload || payload.kind !== "bytes") {
      console.warn("[journal-backup] photo skipped", { entryId: job.entryId, zipPath: job.zipPath });
      return null;
    }
    return { zipPath: job.zipPath, buffer: payload.buffer };
  });

  let appended = 0;
  for (const item of fetched) {
    if (!item) continue;
    archive.append(item.buffer, { name: item.zipPath });
    appended += 1;
  }

  return { appended, skipped: photoJobs.length - appended };
}

/** レスポンス返却後も ZIP をストリーミングで組み立てる */
export async function startJournalBackupZipStream(params: {
  viewerEmail: string;
  profileId: string;
  profileNickname: string;
}): Promise<{ stream: Readable; filename: string; photoCount: number }> {
  const { buildJournalBackupDataUnderAuthority } = await import(
    "@/lib/lifecycle/identityExportAuthority"
  );
  const under = await buildJournalBackupDataUnderAuthority(params);
  if (!under.ok) {
    throw new Error(`backup_export_denied:${under.state}`);
  }
  const built = "legacy" in under && under.legacy ? under.built : under.built;
  const archive = new ZipArchive({ zlib: { level: 0 } });
  const stream = new PassThrough();

  archive.on("error", (error) => {
    stream.destroy(error);
  });
  archive.pipe(stream);

  void (async () => {
    try {
      archive.append(JSON.stringify(built.document, null, 2), { name: "backup.json" });
      await appendJournalBackupPhotosToArchive(archive, built.photoJobs);
      await archive.finalize();
    } catch (error) {
      archive.abort();
      stream.destroy(error instanceof Error ? error : new Error(String(error)));
    }
  })();

  return {
    stream,
    filename: built.filename,
    photoCount: built.photoJobs.length,
  };
}

/** ローカル検証用: ZIP をファイルに書き出す */
export async function writeJournalBackupZipToPath(
  params: {
    viewerEmail: string;
    profileId: string;
    profileNickname: string;
  },
  outPath: string,
): Promise<{ filename: string; photoCount: number }> {
  const started = await startJournalBackupZipStream(params);
  await pipeline(started.stream, createWriteStream(outPath));
  return { filename: started.filename, photoCount: started.photoCount };
}
