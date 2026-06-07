import { describe, expect, it } from "vitest";

import {
  backupPhotoZipPath,
  JOURNAL_BACKUP_FORMAT,
  JOURNAL_BACKUP_FORMAT_VERSION,
  journalBackupZipFilename,
  photoExtensionFromMimeType,
} from "./journalBackupExport";

describe("journalBackupExport helpers", () => {
  it("builds photo zip paths with future multi-photo suffix", () => {
    expect(backupPhotoZipPath("entry123", 0, "image/webp")).toBe("photos/entry_entry123.webp");
    expect(backupPhotoZipPath("entry123", 1, "image/jpeg")).toBe("photos/entry_entry123_2.jpg");
  });

  it("maps mime types to extensions", () => {
    expect(photoExtensionFromMimeType("image/webp")).toBe("webp");
    expect(photoExtensionFromMimeType("image/png")).toBe("png");
    expect(photoExtensionFromMimeType("image/jpeg")).toBe("jpg");
  });

  it("builds safe zip filenames from profile id", () => {
    const exportedAt = new Date("2026-06-07T12:00:00.000Z");
    expect(journalBackupZipFilename("legacy:abc123def456", exportedAt)).toBe(
      "life-journey-diary-backup_legacyab_20260607.zip",
    );
  });

  it("exposes stable backup format constants", () => {
    expect(JOURNAL_BACKUP_FORMAT).toBe("life-journey-diary-backup");
    expect(JOURNAL_BACKUP_FORMAT_VERSION).toBe(1);
  });
});
