import { describe, expect, it } from "vitest";

import {
  JOURNAL_BACKUP_FORMAT,
  JOURNAL_BACKUP_FORMAT_VERSION,
  type JournalBackupDocument,
} from "./journalBackupExport";
import { buildRestoreProfileNickname } from "./journalBackupRestore";
import {
  JournalBackupValidationError,
  parseJournalBackupDocument,
  validateBackupJsonDoesNotEmbedPhotos,
  validateJournalBackupDocument,
} from "./journalBackupValidate";

function sampleDocument(overrides?: Partial<JournalBackupDocument>): JournalBackupDocument {
  return {
    format: JOURNAL_BACKUP_FORMAT,
    formatVersion: JOURNAL_BACKUP_FORMAT_VERSION,
    exportedAt: "2026-06-07T12:00:00.000Z",
    app: "Life Journey Diary",
    photoPolicy: {
      exportedPhotoType: "processed",
      descriptionJa: "加工済み写真",
      description: "processed photos",
    },
    profile: {
      id: "old-profile",
      nickname: "もぐ",
      birthDate: null,
      birthMonth: null,
      birthDay: null,
      lifePathNumber: null,
    },
    entries: [
      {
        id: "entry-1",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T01:00:00.000Z",
        content: "hello",
        mood: "calm",
        activity: "record_anyway",
        companionType: "owl",
        designTheme: "simple",
        contentFontMode: "standard",
        generatedComment: "comment",
        includeInBook: true,
        diaryNumbers: { today: 1, month: 1, year: 1, calmness: 1 },
        photos: [{ index: 0, filename: "photos/entry_entry-1.webp", mimeType: "image/webp", sizeBytes: 10, source: "blob" }],
      },
    ],
    diaryBooks: [],
    bookshelfBooks: [],
    ...overrides,
  };
}

describe("journalBackupValidate", () => {
  it("parses a valid backup document", () => {
    const doc = sampleDocument();
    const parsed = parseJournalBackupDocument(JSON.stringify(doc));
    expect(parsed.profile.nickname).toBe("もぐ");
    expect(parsed.entries).toHaveLength(1);
  });

  it("rejects embedded photo data in JSON", () => {
    expect(() => validateBackupJsonDoesNotEmbedPhotos('{"photoDataUrl":"x"}')).toThrow(
      JournalBackupValidationError,
    );
    expect(() => validateBackupJsonDoesNotEmbedPhotos('{"x":"data:image/webp;base64,abc"}')).toThrow(
      JournalBackupValidationError,
    );
  });

  it("validates zip entry references", () => {
    const doc = sampleDocument();
    const ok = validateJournalBackupDocument(doc, ["backup.json", "photos/entry_entry-1.webp"]);
    expect(ok.ok).toBe(true);

    const missingPhoto = validateJournalBackupDocument(doc, ["backup.json"]);
    expect(missingPhoto.ok).toBe(false);
    expect(missingPhoto.issues.some((i) => i.code === "PHOTO_FILE_MISSING")).toBe(true);
  });

  it("rejects unsupported format version", () => {
    const doc = sampleDocument({ formatVersion: 99 as typeof JOURNAL_BACKUP_FORMAT_VERSION });
    expect(() => parseJournalBackupDocument(JSON.stringify(doc))).toThrow(JournalBackupValidationError);
  });
});

describe("buildRestoreProfileNickname", () => {
  it("appends restore suffix when nickname is available", () => {
    expect(buildRestoreProfileNickname("もぐ", [])).toBe("もぐ（復元）");
  });

  it("increments suffix when nickname already exists", () => {
    expect(buildRestoreProfileNickname("もぐ", ["もぐ（復元）"])).toBe("もぐ（復元 2）");
    expect(buildRestoreProfileNickname("もぐ", ["もぐ（復元）", "もぐ（復元 2）"])).toBe("もぐ（復元 3）");
  });

  it("fits nickname within 40 characters", () => {
    const long = "あ".repeat(40);
    const nickname = buildRestoreProfileNickname(long, []);
    expect(nickname.length).toBeLessThanOrEqual(40);
    expect(nickname.endsWith("（復元）")).toBe(true);
  });
});
