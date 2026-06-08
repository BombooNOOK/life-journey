import { normalizeEmail } from "@/lib/auth/viewer";
import { normalizeContentFontMode } from "@/lib/journal/contentFontMode";
import type { JournalBackupDocument, JournalBackupEntry } from "@/lib/journal/journalBackupExport";
import {
  deleteJournalEntryPhotoBlobBestEffort,
  journalPhotoBlobWriteEnabled,
  putJournalEntryPhotoBufferToBlob,
} from "@/lib/journal/journalEntryPhotoBlob";
import {
  normalizeBackupEntryForRestore,
  type ExtractedJournalBackup,
  type JournalBackupValidationResult,
  validateJournalBackupDocument,
} from "@/lib/journal/journalBackupValidate";
import { prisma } from "@/lib/db";

const PHOTO_UPLOAD_CONCURRENCY = 6;
const PROFILE_NICKNAME_MAX = 40;

export class JournalBackupRestoreError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = "JournalBackupRestoreError";
  }
}

export type JournalBackupRestorePlan = {
  viewerEmail: string;
  sourceProfileNickname: string;
  restoreProfileNickname: string;
  entryCount: number;
  photoCount: number;
  skippedDiaryBooks: number;
  skippedBookshelfBooks: number;
};

export type JournalBackupRestoreResult = {
  profileId: string;
  profileNickname: string;
  entryCount: number;
  photoCount: number;
  sourceProfileNickname: string;
};

type RestoreRollbackState = {
  profileId: string | null;
  entryIds: string[];
  blobPathnames: string[];
};

function restoreSuffixForIndex(index: number): string {
  return index === 0 ? "（復元）" : `（復元 ${index + 1}）`;
}

export function buildRestoreProfileNickname(
  baseNickname: string,
  existingNicknames: readonly string[],
): string {
  const trimmed = baseNickname.trim() || "プロフィール";
  const existing = new Set(existingNicknames);
  for (let i = 0; i < 100; i++) {
    const suffix = restoreSuffixForIndex(i);
    const maxBaseLen = PROFILE_NICKNAME_MAX - suffix.length;
    const base = trimmed.slice(0, Math.max(1, maxBaseLen));
    const candidate = `${base}${suffix}`;
    if (!existing.has(candidate)) {
      return candidate;
    }
  }
  throw new JournalBackupRestoreError(
    "復元用ニックネームを生成できませんでした。",
    "NICKNAME_COLLISION",
  );
}

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

async function rollbackRestore(state: RestoreRollbackState): Promise<void> {
  if (state.entryIds.length > 0) {
    await prisma.journalEntry.deleteMany({ where: { id: { in: state.entryIds } } });
  }
  if (state.profileId) {
    await prisma.profile.delete({ where: { id: state.profileId } }).catch(() => undefined);
  }
  await Promise.all(
    state.blobPathnames.map((pathname) => deleteJournalEntryPhotoBlobBestEffort(pathname)),
  );
}

async function assertProfileLimit(email: string): Promise<void> {
  const settings = await prisma.accountSettings.findUnique({
    where: { email },
    select: { profileLimit: true },
  });
  const limit = settings?.profileLimit ?? 1;
  const currentCount = await prisma.profile.count({ where: { email, isArchived: false } });
  if (currentCount >= limit) {
    throw new JournalBackupRestoreError(
      `プロフィール上限（${limit}）に達しているため、新規プロフィールとして復元できません。`,
      "PROFILE_LIMIT",
    );
  }
}

function countPhotos(document: JournalBackupDocument): number {
  return document.entries.reduce((sum, entry) => sum + (entry.photos?.length ?? 0), 0);
}

export async function planJournalBackupRestore(params: {
  viewerEmail: string;
  extracted: ExtractedJournalBackup;
}): Promise<JournalBackupRestorePlan> {
  const email = normalizeEmail(params.viewerEmail);
  if (!email) {
    throw new JournalBackupRestoreError("viewerEmail が空です。", "EMAIL_MISSING");
  }

  const validation = validateJournalBackupDocument(
    params.extracted.document,
    params.extracted.zipEntryNames,
  );
  if (!validation.ok) {
    const summary = validation.issues.map((i) => i.message).join(" ");
    throw new JournalBackupRestoreError(summary, "VALIDATION_FAILED");
  }

  const existingProfiles = await prisma.profile.findMany({
    where: { email, isArchived: false },
    select: { nickname: true },
  });
  const restoreProfileNickname = buildRestoreProfileNickname(
    validation.document.profile.nickname,
    existingProfiles.map((p) => p.nickname),
  );

  return {
    viewerEmail: email,
    sourceProfileNickname: validation.document.profile.nickname,
    restoreProfileNickname,
    entryCount: validation.document.entries.length,
    photoCount: countPhotos(validation.document),
    skippedDiaryBooks: validation.document.diaryBooks?.length ?? 0,
    skippedBookshelfBooks: validation.document.bookshelfBooks?.length ?? 0,
  };
}

async function restoreEntryPhoto(params: {
  profileId: string;
  entryId: string;
  backupEntry: JournalBackupEntry;
  readFileBytes: ExtractedJournalBackup["readFileBytes"];
  rollback: RestoreRollbackState;
}): Promise<Awaited<ReturnType<typeof putJournalEntryPhotoBufferToBlob>> | null> {
  const primaryPhoto = params.backupEntry.photos?.[0];
  if (!primaryPhoto) return null;

  const buffer = params.readFileBytes(primaryPhoto.filename);
  const photoMeta = await putJournalEntryPhotoBufferToBlob({
    profileId: params.profileId,
    entryId: params.entryId,
    buffer,
    mimeType: primaryPhoto.mimeType,
  });
  params.rollback.blobPathnames.push(photoMeta.photoBlobPathname);
  return photoMeta;
}

export async function restoreJournalBackupToNewProfile(params: {
  viewerEmail: string;
  extracted: ExtractedJournalBackup;
  dryRun?: boolean;
}): Promise<JournalBackupRestoreResult | JournalBackupRestorePlan> {
  const plan = await planJournalBackupRestore(params);
  if (params.dryRun) {
    return plan;
  }

  const photoCount = plan.photoCount;
  if (photoCount > 0 && !journalPhotoBlobWriteEnabled()) {
    throw new JournalBackupRestoreError(
      "写真付きバックアップの復元には Blob 書き込み設定が必要です（JOURNAL_PHOTO_BLOB_STORE_ID + VERCEL_OIDC_TOKEN または JOURNAL_PHOTO_BLOB_READ_WRITE_TOKEN）。",
      "BLOB_WRITE_DISABLED",
    );
  }

  await assertProfileLimit(plan.viewerEmail);

  const rollback: RestoreRollbackState = {
    profileId: null,
    entryIds: [],
    blobPathnames: [],
  };

  try {
    const profile = await prisma.profile.create({
      data: {
        email: plan.viewerEmail,
        nickname: plan.restoreProfileNickname,
      },
      select: { id: true, nickname: true },
    });
    rollback.profileId = profile.id;

    const entries = params.extracted.document.entries;
    const entryIds = await mapWithConcurrency(entries, PHOTO_UPLOAD_CONCURRENCY, async (backupEntry) => {
      const created = await prisma.journalEntry.create({
        data: {
          email: plan.viewerEmail,
          profileId: profile.id,
          content: backupEntry.content,
          mood: backupEntry.mood,
          activity: backupEntry.activity,
          companionType: backupEntry.companionType,
          designTheme: normalizeBackupEntryForRestore(backupEntry).designTheme,
          contentFontMode: normalizeContentFontMode(backupEntry.contentFontMode),
          generatedComment: backupEntry.generatedComment,
          includeInBook: backupEntry.includeInBook,
          createdAt: new Date(backupEntry.createdAt),
          updatedAt: new Date(backupEntry.updatedAt),
        },
        select: { id: true },
      });
      rollback.entryIds.push(created.id);
      return { backupEntry, entryId: created.id };
    });

    let restoredPhotoCount = 0;
    await mapWithConcurrency(entryIds, PHOTO_UPLOAD_CONCURRENCY, async ({ backupEntry, entryId }) => {
      const photoMeta = await restoreEntryPhoto({
        profileId: profile.id,
        entryId,
        backupEntry,
        readFileBytes: params.extracted.readFileBytes,
        rollback,
      });
      if (!photoMeta) return;

      restoredPhotoCount += 1;
      await prisma.journalEntry.update({
        where: { id: entryId },
        data: {
          photoBlobUrl: photoMeta.photoBlobUrl,
          photoBlobPathname: photoMeta.photoBlobPathname,
          photoMimeType: photoMeta.photoMimeType,
          photoSizeBytes: photoMeta.photoSizeBytes,
          photoStorageProvider: photoMeta.photoStorageProvider,
        },
      });
    });

    return {
      profileId: profile.id,
      profileNickname: profile.nickname,
      entryCount: entries.length,
      photoCount: restoredPhotoCount,
      sourceProfileNickname: plan.sourceProfileNickname,
    };
  } catch (error) {
    await rollbackRestore(rollback);
    if (error instanceof JournalBackupRestoreError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new JournalBackupRestoreError(`復元に失敗しました: ${message}`, "RESTORE_FAILED");
  }
}

export function formatJournalBackupValidationFailure(
  validation: JournalBackupValidationResult,
): string {
  return validation.issues.map((issue) => `- [${issue.code}] ${issue.message}`).join("\n");
}
