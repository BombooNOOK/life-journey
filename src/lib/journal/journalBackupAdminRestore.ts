import { normalizeEmail } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import {
  JOURNAL_BACKUP_FORMAT,
  JOURNAL_BACKUP_FORMAT_VERSION,
} from "@/lib/journal/journalBackupExport";
import {
  checkProfileLimitForRestore,
  planJournalBackupRestore,
  type JournalBackupRestorePlan,
} from "@/lib/journal/journalBackupRestore";
import {
  ADMIN_RESTORE_CONFIRMATION_KEYS,
  type AdminRestoreConfirmations,
  type AdminRestorePreview,
} from "@/lib/journal/journalBackupAdminRestoreTypes";
import { hasKanteiHintsInBackupProfile } from "@/lib/journal/journalBackupZipExtract";
import {
  extractJournalBackupFromBuffer,
  type ExtractedJournalBackup,
} from "@/lib/journal/journalBackupValidate";

export {
  ADMIN_RESTORE_CONFIRMATION_KEYS,
  buildAdminRestoreTempZipPathname,
  type AdminRestoreConfirmationKey,
  type AdminRestoreConfirmations,
  type AdminRestorePreview,
} from "@/lib/journal/journalBackupAdminRestoreTypes";

export function parseAdminRestoreTargetEmail(raw: unknown): string {
  const email = normalizeEmail(typeof raw === "string" ? raw : "");
  if (!email) {
    throw new Error("復元先メールアドレスを入力してください。");
  }
  return email;
}

export function parseAdminRestoreConfirmations(raw: unknown): AdminRestoreConfirmations {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("確認チェックが不正です。");
  }
  const obj = raw as Record<string, unknown>;
  const confirmations = {} as AdminRestoreConfirmations;
  for (const key of ADMIN_RESTORE_CONFIRMATION_KEYS) {
    confirmations[key] = obj[key] === true;
  }
  const missing = ADMIN_RESTORE_CONFIRMATION_KEYS.filter((key) => !confirmations[key]);
  if (missing.length > 0) {
    throw new Error("復元前の確認チェックをすべて入れてください。");
  }
  return confirmations;
}

export async function restoreTargetUserExists(email: string): Promise<boolean> {
  const [settings, profileCount, orderCount, entryCount] = await Promise.all([
    prisma.accountSettings.findUnique({ where: { email }, select: { email: true } }),
    prisma.profile.count({ where: { email, isArchived: false } }),
    prisma.order.count({ where: { email } }),
    prisma.journalEntry.count({ where: { email } }),
  ]);
  return Boolean(settings) || profileCount > 0 || orderCount > 0 || entryCount > 0;
}

export async function loadExtractedAdminRestoreZip(buffer: Buffer): Promise<ExtractedJournalBackup> {
  return extractJournalBackupFromBuffer(buffer, { zipSizeBytes: buffer.byteLength });
}

export async function buildAdminRestorePreview(params: {
  targetEmail: string;
  extracted: ExtractedJournalBackup;
}): Promise<AdminRestorePreview> {
  const targetEmail = parseAdminRestoreTargetEmail(params.targetEmail);
  const validation = await import("@/lib/journal/journalBackupValidate").then((m) =>
    m.validateJournalBackupDocument(params.extracted.document, params.extracted.zipEntryNames),
  );
  const profileLimit = await checkProfileLimitForRestore(targetEmail);
  const targetUserExists = await restoreTargetUserExists(targetEmail);

  let plan: JournalBackupRestorePlan;
  if (validation.ok) {
    plan = await planJournalBackupRestore({
      viewerEmail: targetEmail,
      extracted: params.extracted,
    });
  } else {
    plan = {
      viewerEmail: targetEmail,
      sourceProfileNickname: params.extracted.document.profile.nickname,
      restoreProfileNickname: `${params.extracted.document.profile.nickname}（復元）`,
      entryCount: params.extracted.document.entries.length,
      photoCount: params.extracted.document.entries.reduce(
        (sum, entry) => sum + (entry.photos?.length ?? 0),
        0,
      ),
      skippedDiaryBooks: params.extracted.document.diaryBooks?.length ?? 0,
      skippedBookshelfBooks: params.extracted.document.bookshelfBooks?.length ?? 0,
    };
  }

  return {
    targetEmail,
    targetUserExists,
    sourceProfileId: params.extracted.document.profile.id,
    sourceProfileNickname: plan.sourceProfileNickname,
    restoreProfileNickname: plan.restoreProfileNickname,
    entryCount: plan.entryCount,
    photoCount: plan.photoCount,
    skippedDiaryBooks: plan.skippedDiaryBooks,
    skippedBookshelfBooks: plan.skippedBookshelfBooks,
    format: JOURNAL_BACKUP_FORMAT,
    formatVersion: JOURNAL_BACKUP_FORMAT_VERSION,
    zipSizeBytes: params.extracted.zipSizeBytes,
    validationOk: validation.ok,
    warnings: validation.issues,
    profileLimitOk: profileLimit.ok,
    profileLimit: profileLimit.limit,
    storedProfileLimit: profileLimit.storedLimit,
    isMonitor: profileLimit.isMonitor,
    profileCount: profileLimit.currentCount,
    hasKanteiHints: hasKanteiHintsInBackupProfile(params.extracted.document.profile),
    plan,
  };
}
