import { readFileSync } from "node:fs";

import {
  JOURNAL_BACKUP_FORMAT,
  JOURNAL_BACKUP_FORMAT_VERSION,
  type JournalBackupDocument,
  type JournalBackupEntry,
} from "@/lib/journal/journalBackupExport";
import { listZipEntryNamesFromBuffer, unzipBufferToFileMap } from "@/lib/journal/journalBackupZipExtract";
import { isActivityId, isCompanionType, isMoodId, normalizeDiaryDesignTheme } from "@/lib/journal/meta";

export const JOURNAL_BACKUP_MAX_ZIP_BYTES = 100 * 1024 * 1024;
export const JOURNAL_BACKUP_MAX_ENTRIES = 2000;
export const JOURNAL_BACKUP_MAX_PHOTOS = 2000;
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
  zipSizeBytes: number;
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

function countPhotosInDocument(document: JournalBackupDocument): number {
  return document.entries.reduce((sum, entry) => sum + (entry.photos?.length ?? 0), 0);
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

  const photoCount = countPhotosInDocument(document);
  if (photoCount > JOURNAL_BACKUP_MAX_PHOTOS) {
    issues.push({
      code: "PHOTOS_TOO_MANY",
      message: `写真が多すぎます（上限 ${JOURNAL_BACKUP_MAX_PHOTOS}）。`,
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

function buildExtractedJournalBackupFromFileMap(params: {
  fileMap: Map<string, Buffer>;
  zipPath?: string;
  workDir?: string;
  zipSizeBytes?: number;
}): ExtractedJournalBackup {
  const zipEntryNames = [...params.fileMap.keys()].sort();
  const backupBytes = params.fileMap.get("backup.json");
  if (!backupBytes) {
    throw new JournalBackupValidationError("ZIP 内に backup.json がありません。", "BACKUP_JSON_MISSING");
  }

  const raw = backupBytes.toString("utf8");
  validateBackupJsonDoesNotEmbedPhotos(raw);
  const document = parseJournalBackupDocument(raw);
  const validation = validateJournalBackupDocument(document, zipEntryNames);
  if (!validation.ok) {
    const summary = validation.issues.map((i) => i.message).join(" ");
    throw new JournalBackupValidationError(summary, "VALIDATION_FAILED");
  }

  return {
    document: validation.document,
    zipEntryNames,
    zipPath: params.zipPath ?? "",
    workDir: params.workDir ?? "",
    zipSizeBytes: params.zipSizeBytes ?? 0,
    readFileBytes(innerPath: string) {
      const file = params.fileMap.get(innerPath);
      if (!file) {
        throw new JournalBackupValidationError(
          `ZIP 内ファイルが見つかりません: ${innerPath}`,
          "PHOTO_FILE_MISSING",
        );
      }
      return file;
    },
  };
}

export function extractJournalBackupFromBuffer(
  buffer: Buffer,
  options?: { zipPath?: string; workDir?: string; zipSizeBytes?: number },
): ExtractedJournalBackup {
  if (buffer.byteLength > JOURNAL_BACKUP_MAX_ZIP_BYTES) {
    throw new JournalBackupValidationError(
      `ZIP が大きすぎます（上限 ${JOURNAL_BACKUP_MAX_ZIP_BYTES} bytes）。`,
      "ZIP_TOO_LARGE",
    );
  }
  const fileMap = unzipBufferToFileMap(buffer);
  return buildExtractedJournalBackupFromFileMap({
    fileMap,
    zipPath: options?.zipPath,
    workDir: options?.workDir,
    zipSizeBytes: options?.zipSizeBytes ?? buffer.byteLength,
  });
}

export function validateJournalBackupZipBuffer(
  buffer: Buffer,
  zipSizeBytes?: number,
): JournalBackupValidationResult {
  if (buffer.byteLength <= 0) {
    throw new JournalBackupValidationError("ZIP ファイルが空です。", "ZIP_EMPTY");
  }

  const zipEntryNames = listZipEntryNamesFromBuffer(buffer);
  const fileMap = unzipBufferToFileMap(buffer);
  const backupBytes = fileMap.get("backup.json");
  if (!backupBytes) {
    throw new JournalBackupValidationError("ZIP 内に backup.json がありません。", "BACKUP_JSON_MISSING");
  }

  const raw = backupBytes.toString("utf8");
  validateBackupJsonDoesNotEmbedPhotos(raw);
  const document = parseJournalBackupDocument(raw);
  const validation = validateJournalBackupDocument(document, zipEntryNames);
  return { ...validation, document, zipEntryNames };
}

export function validateJournalBackupZipBufferWithSizeLimit(buffer: Buffer): JournalBackupValidationResult {
  if (buffer.byteLength > JOURNAL_BACKUP_MAX_ZIP_BYTES) {
    throw new JournalBackupValidationError(
      `ZIP が大きすぎます（上限 ${JOURNAL_BACKUP_MAX_ZIP_BYTES} bytes）。`,
      "ZIP_TOO_LARGE",
    );
  }
  return validateJournalBackupZipBuffer(buffer, buffer.byteLength);
}

function readZipFileBuffer(zipPath: string): Buffer {
  const buffer = readFileSync(zipPath);
  if (buffer.byteLength <= 0) {
    throw new JournalBackupValidationError("ZIP ファイルが空です。", "ZIP_EMPTY");
  }
  if (buffer.byteLength > JOURNAL_BACKUP_MAX_ZIP_BYTES) {
    throw new JournalBackupValidationError(
      `ZIP が大きすぎます（上限 ${JOURNAL_BACKUP_MAX_ZIP_BYTES} bytes）。`,
      "ZIP_TOO_LARGE",
    );
  }
  return buffer;
}

export function validateJournalBackupZipFile(zipPath: string): JournalBackupValidationResult {
  const buffer = readZipFileBuffer(zipPath);
  return validateJournalBackupZipBuffer(buffer, buffer.byteLength);
}

export function extractJournalBackupZip(zipPath: string, workDir: string): ExtractedJournalBackup {
  const buffer = readZipFileBuffer(zipPath);
  return extractJournalBackupFromBuffer(buffer, {
    zipPath,
    workDir,
    zipSizeBytes: buffer.byteLength,
  });
}

/** 復元用に entry フィールドを正規化 */
export function normalizeBackupEntryForRestore(entry: JournalBackupEntry) {
  return {
    ...entry,
    designTheme: normalizeDiaryDesignTheme(entry.designTheme ?? "simple_plain"),
  };
}

export function assertAdminRestoreBlobPathname(pathname: string): void {
  const normalized = pathname.trim().replace(/^\/+/, "");
  if (!normalized.startsWith("admin-restore-temp/")) {
    throw new JournalBackupValidationError("一時ZIPの保存先が不正です。", "INVALID_TEMP_BLOB_PATH");
  }
  if (!normalized.endsWith(".zip")) {
    throw new JournalBackupValidationError("一時ZIPの拡張子が不正です。", "INVALID_TEMP_BLOB_EXT");
  }
}
