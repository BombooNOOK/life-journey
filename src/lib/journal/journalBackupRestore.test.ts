import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  JOURNAL_BACKUP_FORMAT,
  JOURNAL_BACKUP_FORMAT_VERSION,
  type JournalBackupDocument,
} from "./journalBackupExport";
import type { ExtractedJournalBackup } from "./journalBackupValidate";
import {
  buildRestoreProfileNickname,
  JournalBackupRestoreError,
  planJournalBackupRestore,
  restoreJournalBackupToNewProfile,
} from "./journalBackupRestore";

vi.mock("@/lib/db", () => ({
  prisma: {
    profile: {
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    journalEntry: {
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    accountSettings: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/journal/journalEntryPhotoBlob", () => ({
  journalPhotoBlobWriteEnabled: vi.fn(),
  putJournalEntryPhotoBufferToBlob: vi.fn(),
  deleteJournalEntryPhotoBlobBestEffort: vi.fn(),
}));

import { prisma } from "@/lib/db";
import {
  deleteJournalEntryPhotoBlobBestEffort,
  journalPhotoBlobWriteEnabled,
  putJournalEntryPhotoBufferToBlob,
} from "@/lib/journal/journalEntryPhotoBlob";

function extractedFrom(doc: JournalBackupDocument): ExtractedJournalBackup {
  return {
    document: doc,
    zipEntryNames: ["backup.json", ...doc.entries.flatMap((e) => e.photos.map((p) => p.filename))],
    zipPath: "tmp/sample.zip",
    workDir: "tmp/work",
    zipSizeBytes: 1024,
    readFileBytes: () => Buffer.from("webp"),
  };
}

const baseDoc: JournalBackupDocument = {
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
      photos: [],
    },
    {
      id: "entry-2",
      createdAt: "2026-01-02T00:00:00.000Z",
      updatedAt: "2026-01-02T01:00:00.000Z",
      content: "photo entry",
      mood: "calm",
      activity: "record_anyway",
      companionType: "owl",
      designTheme: "simple",
      contentFontMode: "standard",
      generatedComment: null,
      includeInBook: false,
      diaryNumbers: { today: 2, month: 2, year: 2, calmness: 2 },
      photos: [
        {
          index: 0,
          filename: "photos/entry_entry-2.webp",
          mimeType: "image/webp",
          sizeBytes: 12,
          source: "blob",
        },
      ],
    },
  ],
  diaryBooks: [{ id: "book-1", title: "2026", startDate: "2026-01-01", endDate: "2026-12-31", coverTheme: "casual", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" }],
  bookshelfBooks: [],
};

describe("journalBackupRestore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.profile.findMany).mockResolvedValue([]);
    vi.mocked(prisma.accountSettings.findUnique).mockResolvedValue({ profileLimit: 3 });
    vi.mocked(prisma.profile.count).mockResolvedValue(1);
    vi.mocked(journalPhotoBlobWriteEnabled).mockReturnValue(true);
    vi.mocked(putJournalEntryPhotoBufferToBlob).mockResolvedValue({
      photoBlobUrl: "https://blob.example/new.webp",
      photoBlobPathname: "journal-photos/new-profile/new-entry.webp",
      photoMimeType: "image/webp",
      photoSizeBytes: 12,
      photoStorageProvider: "vercel_blob",
    });
    vi.mocked(prisma.profile.create).mockResolvedValue({
      id: "new-profile",
      nickname: "もぐ（復元）",
    });
    vi.mocked(prisma.journalEntry.create)
      .mockResolvedValueOnce({ id: "new-entry-1" })
      .mockResolvedValueOnce({ id: "new-entry-2" });
    vi.mocked(prisma.journalEntry.update).mockResolvedValue({ id: "new-entry-2" });
    vi.mocked(prisma.journalEntry.deleteMany).mockResolvedValue({ count: 2 });
    vi.mocked(prisma.profile.delete).mockResolvedValue({ id: "new-profile" });
    vi.mocked(deleteJournalEntryPhotoBlobBestEffort).mockResolvedValue(undefined);
  });

  it("builds restore plan with skipped book counts", async () => {
    const plan = await planJournalBackupRestore({
      viewerEmail: "user@example.com",
      extracted: extractedFrom(baseDoc),
    });
    expect(plan.restoreProfileNickname).toBe("もぐ（復元）");
    expect(plan.entryCount).toBe(2);
    expect(plan.photoCount).toBe(1);
    expect(plan.skippedDiaryBooks).toBe(1);
  });

  it("restores entries to a new profile", async () => {
    const result = await restoreJournalBackupToNewProfile({
      viewerEmail: "user@example.com",
      extracted: extractedFrom(baseDoc),
    });

    expect(result).toMatchObject({
      profileId: "new-profile",
      profileNickname: "もぐ（復元）",
      entryCount: 2,
      photoCount: 1,
      sourceProfileNickname: "もぐ",
    });
    expect(prisma.profile.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { email: "user@example.com", nickname: "もぐ（復元）" },
      }),
    );
    expect(prisma.journalEntry.create).toHaveBeenCalledTimes(2);
    expect(putJournalEntryPhotoBufferToBlob).toHaveBeenCalledTimes(1);
    expect(prisma.journalEntry.update).toHaveBeenCalledTimes(1);
  });

  it("rolls back on restore failure", async () => {
    vi.mocked(putJournalEntryPhotoBufferToBlob).mockRejectedValueOnce(new Error("blob failed"));

    await expect(
      restoreJournalBackupToNewProfile({
        viewerEmail: "user@example.com",
        extracted: extractedFrom(baseDoc),
      }),
    ).rejects.toThrow(JournalBackupRestoreError);

    expect(prisma.journalEntry.deleteMany).toHaveBeenCalled();
    expect(prisma.profile.delete).toHaveBeenCalled();
  });

  it("fails when profile limit is reached", async () => {
    vi.mocked(prisma.profile.count).mockResolvedValue(3);

    await expect(
      restoreJournalBackupToNewProfile({
        viewerEmail: "user@example.com",
        extracted: extractedFrom(baseDoc),
      }),
    ).rejects.toMatchObject({ code: "PROFILE_LIMIT" });
  });

  it("supports dry-run without writes", async () => {
    const result = await restoreJournalBackupToNewProfile({
      viewerEmail: "user@example.com",
      extracted: extractedFrom(baseDoc),
      dryRun: true,
    });
    expect(result).toMatchObject({ restoreProfileNickname: "もぐ（復元）", entryCount: 2 });
    expect(prisma.profile.create).not.toHaveBeenCalled();
  });
});

describe("buildRestoreProfileNickname (restore module)", () => {
  it("re-exports nickname builder behavior", () => {
    expect(buildRestoreProfileNickname("テスト", ["テスト（復元）"])).toBe("テスト（復元 2）");
  });
});
