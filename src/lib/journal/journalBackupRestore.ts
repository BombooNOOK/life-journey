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
import { effectiveProfileLimit } from "@/lib/profile/effectiveProfileLimit";

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

export type RestoreStage =
  | "validation"
  | "profile_limit"
  | "blob_write"
  | "profile"
  | "entries"
  | "photos";

export type ProfileLimitCheckResult = {
  ok: boolean;
  /** 実効上限（モニター時は最上位プラン相当） */
  limit: number;
  /** DB保存値（モニター解除後に戻る上限） */
  storedLimit: number;
  isMonitor: boolean;
  currentCount: number;
};

export class JournalBackupRestoreFailure extends JournalBackupRestoreError {
  constructor(
    message: string,
    code: string,
    readonly stage: RestoreStage,
    readonly rollbackOk: boolean,
    readonly retryable: boolean,
  ) {
    super(message, code);
    this.name = "JournalBackupRestoreFailure";
  }
}

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

async function rollbackRestore(state: RestoreRollbackState): Promise<boolean> {
  let ok = true;
  try {
    if (state.entryIds.length > 0) {
      await prisma.journalEntry.deleteMany({ where: { id: { in: state.entryIds } } });
    }
    if (state.profileId) {
      await prisma.profile.delete({ where: { id: state.profileId } }).catch(() => undefined);
    }
    await Promise.all(
      state.blobPathnames.map((pathname) => deleteJournalEntryPhotoBlobBestEffort(pathname)),
    );
  } catch (e) {
    ok = false;
    console.warn("[journal-backup-restore] rollback failed", {
      profileId: state.profileId,
      entryCount: state.entryIds.length,
      blobCount: state.blobPathnames.length,
      error: e instanceof Error ? e.message : String(e),
    });
  }
  return ok;
}

export async function checkProfileLimitForRestore(email: string): Promise<ProfileLimitCheckResult> {
  const settings = await prisma.accountSettings.findUnique({
    where: { email },
    select: { profileLimit: true, isMonitor: true },
  });
  const storedLimit = settings?.profileLimit ?? 1;
  const isMonitor = settings?.isMonitor === true;
  const limit = effectiveProfileLimit(settings);
  const currentCount = await prisma.profile.count({ where: { email, isArchived: false } });
  return {
    ok: currentCount < limit,
    limit,
    storedLimit,
    isMonitor,
    currentCount,
  };
}

async function assertProfileLimit(email: string): Promise<void> {
  const check = await checkProfileLimitForRestore(email);
  if (!check.ok) {
    throw new JournalBackupRestoreFailure(
      `プロフィール上限（${check.limit}）に達しているため、新規プロフィールとして復元できません。`,
      "PROFILE_LIMIT",
      "profile_limit",
      true,
      true,
    );
  }
}

function asRestoreFailure(
  error: unknown,
  stage: RestoreStage,
  rollbackOk: boolean,
): JournalBackupRestoreFailure {
  if (error instanceof JournalBackupRestoreFailure) {
    return error;
  }
  if (error instanceof JournalBackupRestoreError) {
    return new JournalBackupRestoreFailure(
      error.message,
      error.code,
      stage,
      rollbackOk,
      error.code !== "PROFILE_LIMIT",
    );
  }
  const message = error instanceof Error ? error.message : String(error);
  return new JournalBackupRestoreFailure(
    `復元に失敗しました: ${message}`,
    "RESTORE_FAILED",
    stage,
    rollbackOk,
    true,
  );
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
  let stage: RestoreStage = "validation";
  const plan = await planJournalBackupRestore(params);
  if (params.dryRun) {
    return plan;
  }

  const photoCount = plan.photoCount;
  stage = "blob_write";
  if (photoCount > 0 && !journalPhotoBlobWriteEnabled()) {
    throw new JournalBackupRestoreFailure(
      "写真付きバックアップの復元には Blob 書き込み設定が必要です（JOURNAL_PHOTO_BLOB_STORE_ID + VERCEL_OIDC_TOKEN または JOURNAL_PHOTO_BLOB_READ_WRITE_TOKEN）。",
      "BLOB_WRITE_DISABLED",
      stage,
      true,
      true,
    );
  }

  stage = "profile_limit";
  await assertProfileLimit(plan.viewerEmail);

  const rollback: RestoreRollbackState = {
    profileId: null,
    entryIds: [],
    blobPathnames: [],
  };

  try {
    stage = "profile";
    const profile = await prisma.profile.create({
      data: {
        email: plan.viewerEmail,
        nickname: plan.restoreProfileNickname,
      },
      select: { id: true, nickname: true },
    });
    rollback.profileId = profile.id;

    const entries = params.extracted.document.entries;
    stage = "entries";
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
    stage = "photos";
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
    const rollbackOk = await rollbackRestore(rollback);
    throw asRestoreFailure(error, stage, rollbackOk);
  }
}

export function formatJournalBackupValidationFailure(
  validation: JournalBackupValidationResult,
): string {
  return validation.issues.map((issue) => `- [${issue.code}] ${issue.message}`).join("\n");
}
