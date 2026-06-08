/**
 * ローカル Postgres + Blob モックで復元フローを検証。
 *
 * 実行:
 *   DATABASE_URL=postgresql://ljd:ljd_local_dev@127.0.0.1:5433/ljd_dev?schema=public \
 *     RUN_LOCAL_DB_INTEGRATION=1 npm test -- src/lib/journal/journalBackupRestore.local.integration.test.ts
 */
import { mkdirSync, rmSync } from "node:fs";
import path from "node:path";

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/db";
import { extractJournalBackupZip } from "@/lib/journal/journalBackupValidate";
import {
  JournalBackupRestoreError,
  restoreJournalBackupToNewProfile,
  type JournalBackupRestoreResult,
} from "@/lib/journal/journalBackupRestore";

const ZIP_PATH = path.join("tmp", "backup-profile-mogu.zip");
const isLocalDb = (process.env.DATABASE_URL ?? "").includes("127.0.0.1");
const runIntegration = process.env.RUN_LOCAL_DB_INTEGRATION === "1" && isLocalDb;

vi.mock("@/lib/journal/journalEntryPhotoBlob", () => ({
  journalPhotoBlobWriteEnabled: vi.fn(() => true),
  putJournalEntryPhotoBufferToBlob: vi.fn(
    async (params: { profileId: string; entryId: string; mimeType: string }) => ({
      photoBlobUrl: `https://mock.blob.example/${params.profileId}/${params.entryId}.webp`,
      photoBlobPathname: `journal-photos/${params.profileId}/${params.entryId}.webp`,
      photoMimeType: params.mimeType,
      photoSizeBytes: 128,
      photoStorageProvider: "vercel_blob",
    }),
  ),
  deleteJournalEntryPhotoBlobBestEffort: vi.fn(async () => undefined),
}));

import {
  deleteJournalEntryPhotoBlobBestEffort,
  putJournalEntryPhotoBufferToBlob,
} from "@/lib/journal/journalEntryPhotoBlob";

type BaselineSnapshot = {
  viewerEmail: string;
  sourceProfileId: string;
  sourceProfileNickname: string;
  profileCount: number;
  sourceEntryIds: string[];
  sourceEntrySnapshot: Array<{
    id: string;
    content: string;
    mood: string;
    activity: string;
    generatedComment: string | null;
    includeInBook: boolean;
  }>;
  originalProfileLimit: number;
};

const restoredProfileIds: string[] = [];

async function loadBaseline(): Promise<BaselineSnapshot> {
  const workDir = path.join("tmp", `restore-baseline-${Date.now()}`);
  mkdirSync(workDir, { recursive: true });
  const extracted = extractJournalBackupZip(ZIP_PATH, workDir);
  rmSync(workDir, { recursive: true, force: true });

  const sourceProfileId = extracted.document.profile.id;
  const sourceProfile = await prisma.profile.findFirst({
    where: { id: sourceProfileId, isArchived: false },
    select: { email: true, nickname: true },
  });
  const viewerEmail = sourceProfile?.email;
  if (!viewerEmail) {
    throw new Error(`バックアップ元プロフィール ${sourceProfileId} がローカル DB にありません。`);
  }

  const sourceEntries = await prisma.journalEntry.findMany({
    where: { profileId: sourceProfileId },
    select: {
      id: true,
      content: true,
      mood: true,
      activity: true,
      generatedComment: true,
      includeInBook: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const settings = await prisma.accountSettings.findUnique({
    where: { email: viewerEmail },
    select: { profileLimit: true },
  });

  return {
    viewerEmail,
    sourceProfileId,
    sourceProfileNickname: sourceProfile.nickname ?? extracted.document.profile.nickname,
    profileCount: await prisma.profile.count({ where: { email: viewerEmail, isArchived: false } }),
    sourceEntryIds: sourceEntries.map((e) => e.id),
    sourceEntrySnapshot: sourceEntries,
    originalProfileLimit: settings?.profileLimit ?? 1,
  };
}

function extractZip(viewerEmail: string) {
  const workDir = path.join("tmp", `restore-test-${Date.now()}`);
  mkdirSync(workDir, { recursive: true });
  const extracted = extractJournalBackupZip(ZIP_PATH, workDir);
  return { extracted, workDir };
}

async function cleanupRestoredProfiles(viewerEmail: string) {
  const restoredProfiles = await prisma.profile.findMany({
    where: {
      email: viewerEmail,
      isArchived: false,
      nickname: { contains: "（復元" },
    },
    select: { id: true },
  });
  const ids = [...restoredProfileIds, ...restoredProfiles.map((p) => p.id)];
  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length === 0) return;
  await prisma.journalEntry.deleteMany({ where: { profileId: { in: uniqueIds } } });
  await prisma.profile.deleteMany({ where: { id: { in: uniqueIds } } });
}

describe.skipIf(!runIntegration)("journalBackupRestore local DB integration", () => {
  let baseline: BaselineSnapshot;

  beforeAll(async () => {
    baseline = await loadBaseline();
    await cleanupRestoredProfiles(baseline.viewerEmail);
    await prisma.accountSettings.upsert({
      where: { email: baseline.viewerEmail },
      update: { profileLimit: 10 },
      create: { email: baseline.viewerEmail, profileLimit: 10 },
    });
    vi.mocked(putJournalEntryPhotoBufferToBlob).mockClear();
    vi.mocked(deleteJournalEntryPhotoBlobBestEffort).mockClear();
  });

  afterAll(async () => {
    await prisma.accountSettings.upsert({
      where: { email: baseline.viewerEmail },
      update: { profileLimit: baseline.originalProfileLimit },
      create: { email: baseline.viewerEmail, profileLimit: baseline.originalProfileLimit },
    });
    await cleanupRestoredProfiles(baseline.viewerEmail);
    await prisma.$disconnect();
  });

  it("1. dry-run does not write to DB", async () => {
    const beforeCount = await prisma.profile.count({
      where: { email: baseline.viewerEmail, isArchived: false },
    });
    const { extracted, workDir } = extractZip(baseline.viewerEmail);
    try {
      await restoreJournalBackupToNewProfile({
        viewerEmail: baseline.viewerEmail,
        extracted,
        dryRun: true,
      });
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
    const afterCount = await prisma.profile.count({
      where: { email: baseline.viewerEmail, isArchived: false },
    });
    expect(afterCount).toBe(beforeCount);
  });

  it("2–8. restores to a new profile with entries, comments, includeInBook, and blob meta", async () => {
    const { extracted, workDir } = extractZip(baseline.viewerEmail);
    let result: JournalBackupRestoreResult;
    try {
      const out = await restoreJournalBackupToNewProfile({
        viewerEmail: baseline.viewerEmail,
        extracted,
      });
      result = out as JournalBackupRestoreResult;
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }

    restoredProfileIds.push(result.profileId);

    expect(result.profileNickname).toBe(`${baseline.sourceProfileNickname}（復元）`);
    expect(result.entryCount).toBe(3);
    expect(result.photoCount).toBe(2);

    const restoredEntries = await prisma.journalEntry.findMany({
      where: { profileId: result.profileId },
      orderBy: { createdAt: "asc" },
    });
    expect(restoredEntries).toHaveLength(3);

    for (const backupEntry of extracted.document.entries) {
      const restored = restoredEntries.find((row) => row.content === backupEntry.content);
      expect(restored, `content: ${backupEntry.content}`).toBeTruthy();
      expect(restored!.mood).toBe(backupEntry.mood);
      expect(restored!.activity).toBe(backupEntry.activity);
      expect(restored!.generatedComment).toBe(backupEntry.generatedComment);
      expect(restored!.includeInBook).toBe(backupEntry.includeInBook);
      if (backupEntry.photos.length > 0) {
        expect(restored!.photoBlobUrl).toContain("mock.blob.example");
        expect(restored!.photoBlobPathname).toContain(result.profileId);
        expect(restored!.photoMimeType).toBe("image/webp");
        expect(restored!.photoSizeBytes).toBe(128);
        expect(restored!.photoStorageProvider).toBe("vercel_blob");
      }
    }

    const sourceAfter = await prisma.journalEntry.findMany({
      where: { profileId: baseline.sourceProfileId },
      select: {
        id: true,
        content: true,
        mood: true,
        activity: true,
        generatedComment: true,
        includeInBook: true,
      },
      orderBy: { createdAt: "asc" },
    });
    expect(sourceAfter.map((e) => e.id)).toEqual(baseline.sourceEntryIds);
    expect(sourceAfter).toEqual(baseline.sourceEntrySnapshot);
  });

  it("5. uses （復元 2） when （復元） already exists", async () => {
    const { extracted, workDir } = extractZip(baseline.viewerEmail);
    let result: JournalBackupRestoreResult;
    try {
      const out = await restoreJournalBackupToNewProfile({
        viewerEmail: baseline.viewerEmail,
        extracted,
      });
      result = out as JournalBackupRestoreResult;
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
    restoredProfileIds.push(result.profileId);
    expect(result.profileNickname).toBe(`${baseline.sourceProfileNickname}（復元 2）`);
    expect(result.profileId).not.toBe(restoredProfileIds[0]);
  });

  it("10. same ZIP restore creates another distinct profile", async () => {
    const before = await prisma.profile.count({
      where: { email: baseline.viewerEmail, nickname: { contains: "（復元" }, isArchived: false },
    });
    expect(before).toBeGreaterThanOrEqual(2);

    const { extracted, workDir } = extractZip(baseline.viewerEmail);
    let result: JournalBackupRestoreResult;
    try {
      const out = await restoreJournalBackupToNewProfile({
        viewerEmail: baseline.viewerEmail,
        extracted,
      });
      result = out as JournalBackupRestoreResult;
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
    restoredProfileIds.push(result.profileId);

    const after = await prisma.profile.findMany({
      where: { email: baseline.viewerEmail, nickname: { contains: "（復元" }, isArchived: false },
      select: { id: true, nickname: true },
    });
    expect(after.length).toBe(before + 1);
    expect(new Set(after.map((p) => p.id)).size).toBe(after.length);
    expect(result.profileNickname).toBe(`${baseline.sourceProfileNickname}（復元 3）`);
  });

  it("9. rolls back profile and entries when photo upload fails", async () => {
    const profileCountBefore = await prisma.profile.count({
      where: { email: baseline.viewerEmail, isArchived: false },
    });
    const entryCountBefore = await prisma.journalEntry.count({
      where: { email: baseline.viewerEmail },
    });

    vi.mocked(putJournalEntryPhotoBufferToBlob)
      .mockResolvedValueOnce({
        photoBlobUrl: "https://mock.blob.example/rollback/entry-1.webp",
        photoBlobPathname: "journal-photos/rollback/entry-1.webp",
        photoMimeType: "image/webp",
        photoSizeBytes: 128,
        photoStorageProvider: "vercel_blob",
      })
      .mockRejectedValueOnce(new Error("mock blob failure"));

    const { extracted, workDir } = extractZip(baseline.viewerEmail);
    try {
      await expect(
        restoreJournalBackupToNewProfile({
          viewerEmail: baseline.viewerEmail,
          extracted,
        }),
      ).rejects.toThrow(JournalBackupRestoreError);
    } finally {
      rmSync(workDir, { recursive: true, force: true });
      vi.mocked(putJournalEntryPhotoBufferToBlob).mockImplementation(async (params) => ({
        photoBlobUrl: `https://mock.blob.example/${params.profileId}/${params.entryId}.webp`,
        photoBlobPathname: `journal-photos/${params.profileId}/${params.entryId}.webp`,
        photoMimeType: params.mimeType,
        photoSizeBytes: 128,
        photoStorageProvider: "vercel_blob",
      }));
    }

    const profileCountAfter = await prisma.profile.count({
      where: { email: baseline.viewerEmail, isArchived: false },
    });
    const entryCountAfter = await prisma.journalEntry.count({
      where: { email: baseline.viewerEmail },
    });
    expect(profileCountAfter).toBe(profileCountBefore);
    expect(entryCountAfter).toBe(entryCountBefore);
    expect(vi.mocked(deleteJournalEntryPhotoBlobBestEffort)).toHaveBeenCalled();
  });

  it("11. stops safely when profile limit is reached", async () => {
    const currentCount = await prisma.profile.count({
      where: { email: baseline.viewerEmail, isArchived: false },
    });
    await prisma.accountSettings.upsert({
      where: { email: baseline.viewerEmail },
      update: { profileLimit: currentCount },
      create: { email: baseline.viewerEmail, profileLimit: currentCount },
    });

    const { extracted, workDir } = extractZip(baseline.viewerEmail);
    try {
      await expect(
        restoreJournalBackupToNewProfile({
          viewerEmail: baseline.viewerEmail,
          extracted,
        }),
      ).rejects.toMatchObject({ code: "PROFILE_LIMIT" });
    } finally {
      rmSync(workDir, { recursive: true, force: true });
      await prisma.accountSettings.upsert({
        where: { email: baseline.viewerEmail },
        update: { profileLimit: baseline.originalProfileLimit },
        create: { email: baseline.viewerEmail, profileLimit: baseline.originalProfileLimit },
      });
    }
  });
});
