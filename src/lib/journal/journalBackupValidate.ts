import { execSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import {
  JOURNAL_BACKUP_FORMAT,
  JOURNAL_BACKUP_FORMAT_VERSION,
  type JournalBackupDocument,
  type JournalBackupEntry,
} from "@/lib/journal/journalBackupExport";
import { isActivityId, isCompanionType, isMoodId, normalizeDiaryDesignTheme } from "@/lib/journal/meta";

export const JOURNAL_BACKUP_MAX_ZIP_BYTES = 100 * 1024 * 1024;
export const JOURNAL_BACKUP_MAX_ENTRIES = 2000;
export const JOURNAL_BACKUP_MAX_CONTENT_LENGTH = 2000;

export class JournalBackupValidationError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = "JournalBackupValidationError";
  }
}

export type JournalBackupValidationIssue = {
  code: string;
  message: string;
};

export type JournalBackupValidationResult = {
  ok: boolean;
  document: JournalBackupDocument;
  zipEntryNames: string[];
  issues: JournalBackupValidationIssue[];
};

export type ExtractedJournalBackup = {
  document: JournalBackupDocument;
  zipEntryNames: string[];
  zipPath: string;
  workDir: string;
  readFileBytes: (innerPath: string) => Buffer;
};

function assertObject(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new JournalBackupValidationError(`${label} が不正です。`, "INVALID_SHAPE");
  }
  return value as Record<string, unknown>;
}

export function parseJournalBackupDocument(raw: string): JournalBackupDocument {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new JournalBackupValidationError("backup.json の JSON が不正です。", "INVALID_JSON");
  }

  const root = assertObject(parsed, "backup.json");
  if (root.format !== JOURNAL_BACKUP_FORMAT) {
    throw new JournalBackupValidationError(
      `format が不正です（期待: ${JOURNAL_BACKUP_FORMAT}）。`,
      "INVALID_FORMAT",
    );
  }
  if (root.formatVersion !== JOURNAL_BACKUP_FORMAT_VERSION) {
    throw new JournalBackupValidationError(
      `formatVersion ${String(root.formatVersion)} は未対応です（対応: ${JOURNAL_BACKUP_FORMAT_VERSION}）。`,
      "UNSUPPORTED_VERSION",
    );
  }

  return parsed as JournalBackupDocument;
}

export function validateBackupJsonDoesNotEmbedPhotos(raw: string): void {
  if (raw.includes("photoDataUrl")) {
    throw new JournalBackupValidationError(
      "backup.json に photoDataUrl が含まれています。",
      "EMBEDDED_PHOTO_DATA_URL",
    );
  }
  if (raw.includes("data:image")) {
    throw new JournalBackupValidationError(
      "backup.json に data:image が含まれています。",
      "EMBEDDED_DATA_IMAGE",
    );
  }
}

function validateEntry(entry: JournalBackupEntry, index: number, issues: JournalBackupValidationIssue[]) {
  if (!entry.id?.trim()) {
    issues.push({ code: "ENTRY_ID_MISSING", message: `entries[${index}].id が空です。` });
  }
  if (!entry.content || entry.content.length > JOURNAL_BACKUP_MAX_CONTENT_LENGTH) {
    issues.push({
      code: "ENTRY_CONTENT_INVALID",
      message: `entries[${index}].content が空、または ${JOURNAL_BACKUP_MAX_CONTENT_LENGTH} 文字を超えています。`,
    });
  }
  if (!isMoodId(entry.mood)) {
    issues.push({ code: "ENTRY_MOOD_INVALID", message: `entries[${index}].mood が不正です。` });
  }
  if (!isActivityId(entry.activity)) {
    issues.push({ code: "ENTRY_ACTIVITY_INVALID", message: `entries[${index}].activity が不正です。` });
  }
  if (!isCompanionType(entry.companionType)) {
    issues.push({
      code: "ENTRY_COMPANION_INVALID",
      message: `entries[${index}].companionType が不正です。`,
    });
  }
  if (!Array.isArray(entry.photos)) {
    issues.push({ code: "ENTRY_PHOTOS_INVALID", message: `entries[${index}].photos が配列ではありません。` });
    return;
  }
  for (const photo of entry.photos) {
    if (!photo.filename?.startsWith("photos/")) {
      issues.push({
        code: "ENTRY_PHOTO_FILENAME_INVALID",
        message: `entries[${index}] の写真 filename が不正です。`,
      });
    }
  }
}

export function validateJournalBackupDocument(
  document: JournalBackupDocument,
  zipEntryNames: readonly string[],
): JournalBackupValidationResult {
  const issues: JournalBackupValidationIssue[] = [];
  const zipSet = new Set(zipEntryNames);

  if (!zipEntryNames.includes("backup.json")) {
    issues.push({ code: "BACKUP_JSON_MISSING", message: "ZIP 内に backup.json がありません。" });
  }

  if (!document.profile?.nickname?.trim()) {
    issues.push({ code: "PROFILE_NICKNAME_MISSING", message: "profile.nickname が空です。" });
  }
  if ("email" in (document as object)) {
    issues.push({ code: "PROFILE_EMAIL_PRESENT", message: "backup.json に email が含まれています。" });
  }

  if (!Array.isArray(document.entries)) {
    issues.push({ code: "ENTRIES_NOT_ARRAY", message: "entries が配列ではありません。" });
    return { ok: false, document, zipEntryNames: [...zipEntryNames], issues };
  }

  if (document.entries.length > JOURNAL_BACKUP_MAX_ENTRIES) {
    issues.push({
      code: "ENTRIES_TOO_MANY",
      message: `entries が多すぎます（上限 ${JOURNAL_BACKUP_MAX_ENTRIES}）。`,
    });
  }

  for (let i = 0; i < document.entries.length; i++) {
    validateEntry(document.entries[i]!, i, issues);
    const entry = document.entries[i]!;
    for (const photo of entry.photos ?? []) {
      if (!zipSet.has(photo.filename)) {
        issues.push({
          code: "PHOTO_FILE_MISSING",
          message: `ZIP 内に写真ファイルがありません: ${photo.filename}`,
        });
      }
    }
  }

  return {
    ok: issues.length === 0,
    document,
    zipEntryNames: [...zipEntryNames],
    issues,
  };
}

export function listZipEntries(zipPath: string): string[] {
  const out = execSync(`unzip -Z1 ${JSON.stringify(zipPath)}`, { encoding: "utf8" });
  return out
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function validateJournalBackupZipFile(zipPath: string): JournalBackupValidationResult {
  if (!existsSync(zipPath)) {
    throw new JournalBackupValidationError("ZIP ファイルが見つかりません。", "ZIP_NOT_FOUND");
  }

  const size = statSync(zipPath).size;
  if (size <= 0) {
    throw new JournalBackupValidationError("ZIP ファイルが空です。", "ZIP_EMPTY");
  }
  if (size > JOURNAL_BACKUP_MAX_ZIP_BYTES) {
    throw new JournalBackupValidationError(
      `ZIP が大きすぎます（上限 ${JOURNAL_BACKUP_MAX_ZIP_BYTES} bytes）。`,
      "ZIP_TOO_LARGE",
    );
  }

  const zipEntryNames = listZipEntries(zipPath);
  if (!zipEntryNames.includes("backup.json")) {
    throw new JournalBackupValidationError("ZIP 内に backup.json がありません。", "BACKUP_JSON_MISSING");
  }

  execSync(
    `unzip -p ${JSON.stringify(zipPath)} ${JSON.stringify("backup.json")}`,
    { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 },
  );
  const raw = execSync(`unzip -p ${JSON.stringify(zipPath)} backup.json`, {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });

  validateBackupJsonDoesNotEmbedPhotos(raw);
  const document = parseJournalBackupDocument(raw);
  return validateJournalBackupDocument(document, zipEntryNames);
}

export function extractJournalBackupZip(zipPath: string, workDir: string): ExtractedJournalBackup {
  const validation = validateJournalBackupZipFile(zipPath);
  if (!validation.ok) {
    const summary = validation.issues.map((i) => i.message).join(" ");
    throw new JournalBackupValidationError(summary, "VALIDATION_FAILED");
  }

  execSync(`unzip -oq ${JSON.stringify(zipPath)} -d ${JSON.stringify(workDir)}`, {
    encoding: "utf8",
  });

  return {
    document: validation.document,
    zipEntryNames: validation.zipEntryNames,
    zipPath,
    workDir,
    readFileBytes(innerPath: string) {
      const fullPath = path.join(workDir, innerPath);
      if (!existsSync(fullPath)) {
        throw new JournalBackupValidationError(
          `ZIP 内ファイルが見つかりません: ${innerPath}`,
          "PHOTO_FILE_MISSING",
        );
      }
      return readFileSync(fullPath);
    },
  };
}

/** 復元用に entry フィールドを正規化 */
export function normalizeBackupEntryForRestore(entry: JournalBackupEntry) {
  return {
    ...entry,
    designTheme: normalizeDiaryDesignTheme(entry.designTheme ?? "simple_plain"),
  };
}
