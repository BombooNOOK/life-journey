import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { JournalBackupDocument } from "./journalBackupExport";
import {
  buildJournalBackupData,
  writeJournalBackupZipToPath,
} from "./journalBackupExport";

const viewerEmail = "verify-user@example.com";
const profileA = "profile-a-test";
const profileB = "profile-b-test";

const tinyWebpBase64 =
  "UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAQAcJaQAA3AA/vuUAAA=";
const legacyDataUrl = `data:image/webp;base64,${tinyWebpBase64}`;
const blobBytes = Buffer.from(tinyWebpBase64, "base64");

vi.mock("@/lib/db", () => ({
  prisma: {
    journalEntry: { findMany: vi.fn() },
    diaryBook: { findMany: vi.fn() },
    diaryBookshelfBook: { findMany: vi.fn() },
    order: { findFirst: vi.fn() },
  },
}));

vi.mock("@/lib/journal/journalEntryPhotoResolve", () => ({
  loadJournalEntryPhotoPayload: vi.fn(),
}));

import { prisma } from "@/lib/db";
import { loadJournalEntryPhotoPayload } from "@/lib/journal/journalEntryPhotoResolve";

function fixtureDate(iso: string): Date {
  return new Date(iso);
}

describe("journalBackupExport integration", () => {
  const outDir = path.join("tmp", "journal-backup-integration");
  const outZip = path.join(outDir, "integration-sample.zip");
  const workDir = path.join(outDir, "unzipped");

  beforeEach(() => {
    vi.clearAllMocks();
    mkdirSync(outDir, { recursive: true });
    rmSync(workDir, { recursive: true, force: true });
    mkdirSync(workDir, { recursive: true });

    vi.mocked(prisma.journalEntry.findMany).mockResolvedValue([
      {
        id: "entry-blob",
        createdAt: fixtureDate("2026-01-10T03:00:00.000Z"),
        updatedAt: fixtureDate("2026-01-10T04:00:00.000Z"),
        content: "blob entry",
        mood: "calm",
        activity: "record_anyway",
        companionType: "owl",
        designTheme: "simple",
        contentFontMode: "standard",
        generatedComment: "comment-blob",
        includeInBook: true,
        photoDataUrl: null,
        photoBlobUrl: "https://blob.example/entry-blob.webp",
        photoBlobPathname: "journal-photos/profile-a-test/entry-blob.webp",
        photoMimeType: "image/webp",
        photoSizeBytes: blobBytes.byteLength,
        photoStorageProvider: "vercel_blob",
      },
      {
        id: "entry-legacy",
        createdAt: fixtureDate("2026-01-11T03:00:00.000Z"),
        updatedAt: fixtureDate("2026-01-11T04:00:00.000Z"),
        content: "legacy entry",
        mood: "calm",
        activity: "record_anyway",
        companionType: "owl",
        designTheme: "simple",
        contentFontMode: "standard",
        generatedComment: null,
        includeInBook: false,
        photoDataUrl: legacyDataUrl,
        photoBlobUrl: null,
        photoBlobPathname: null,
        photoMimeType: null,
        photoSizeBytes: null,
        photoStorageProvider: null,
      },
      {
        id: "entry-none",
        createdAt: fixtureDate("2026-01-12T03:00:00.000Z"),
        updatedAt: fixtureDate("2026-01-12T04:00:00.000Z"),
        content: "no photo",
        mood: "calm",
        activity: "record_anyway",
        companionType: "owl",
        designTheme: "simple",
        contentFontMode: "standard",
        generatedComment: null,
        includeInBook: true,
        photoDataUrl: null,
        photoBlobUrl: null,
        photoBlobPathname: null,
        photoMimeType: null,
        photoSizeBytes: null,
        photoStorageProvider: null,
      },
    ] as never);

    vi.mocked(prisma.diaryBook.findMany).mockResolvedValue([
      {
        id: "book-a",
        email: viewerEmail,
        profileId: profileA,
        title: "2026 diary book",
        startDate: "2026-01-01",
        endDate: "2026-12-31",
        coverTheme: "casual",
        createdAt: fixtureDate("2026-01-01T00:00:00.000Z"),
        updatedAt: fixtureDate("2026-02-01T00:00:00.000Z"),
      },
    ] as never);

    vi.mocked(prisma.diaryBookshelfBook.findMany).mockResolvedValue([
      {
        id: "shelf-2026",
        email: viewerEmail,
        profileId: profileA,
        year: 2026,
        displayTitle: "2026",
        coverTheme: "simple",
        periodStartMonth: 1,
        periodEndMonth: 12,
        createdAt: fixtureDate("2026-01-01T00:00:00.000Z"),
        updatedAt: fixtureDate("2026-01-01T00:00:00.000Z"),
      },
    ] as never);

    vi.mocked(prisma.order.findFirst).mockResolvedValue({
      birthDate: "1990-03-15",
      birthMonth: 3,
      birthDay: 15,
      numerologyJson: JSON.stringify({ lifePathNumber: 7 }),
    } as never);

    vi.mocked(loadJournalEntryPhotoPayload).mockImplementation(async (row) => {
      if (row.id === "entry-blob") {
        return { kind: "bytes", buffer: blobBytes, mimeType: "image/webp" };
      }
      if (row.id === "entry-legacy") {
        return { kind: "bytes", buffer: blobBytes, mimeType: "image/webp" };
      }
      return null;
    });
  });

  afterEach(() => {
    rmSync(outZip, { force: true });
    rmSync(workDir, { recursive: true, force: true });
  });

  it("scopes queries to viewer email and active profile ids only", async () => {
    await buildJournalBackupData({
      viewerEmail,
      profileId: profileA,
      profileNickname: "Profile A",
    });

    expect(prisma.journalEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          email: viewerEmail,
          profileId: { in: [profileA] },
        },
      }),
    );
    expect(prisma.diaryBook.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          email: viewerEmail,
          profileId: { in: [profileA] },
        },
      }),
    );
    expect(prisma.order.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          email: viewerEmail,
          profileId: { in: [profileA] },
        },
      }),
    );
  });

  it("does not include other profile entries in backup document", async () => {
    const built = await buildJournalBackupData({
      viewerEmail,
      profileId: profileA,
      profileNickname: "Profile A",
    });

    expect(built.document.profile.id).toBe(profileA);
    expect(built.document.entries.map((e) => e.id)).toEqual([
      "entry-blob",
      "entry-legacy",
      "entry-none",
    ]);
    expect(built.document.entries.find((e) => e.id.includes("profile-b"))).toBeUndefined();
  });

  it("generates a zip with backup.json, photos, and correct linkage", async () => {
    const { filename, photoCount } = await writeJournalBackupZipToPath(
      {
        viewerEmail,
        profileId: profileA,
        profileNickname: "Profile A",
      },
      outZip,
    );

    expect(photoCount).toBe(2);
    expect(filename).toMatch(/^life-journey-diary-backup_profilea_\d{8}\.zip$/);
    expect(existsSync(outZip)).toBe(true);

    const names = execSync(`unzip -Z1 ${JSON.stringify(outZip)}`, { encoding: "utf8" })
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    expect(names).toContain("backup.json");
    expect(names).toContain("photos/entry_entry-blob.webp");
    expect(names).toContain("photos/entry_entry-legacy.webp");
    expect(names).not.toContain("photos/entry_entry-none.webp");

    execSync(`unzip -oq ${JSON.stringify(outZip)} -d ${JSON.stringify(workDir)}`);
    const doc = JSON.parse(
      readFileSync(path.join(workDir, "backup.json"), "utf8"),
    ) as JournalBackupDocument;

    expect(doc.photoPolicy.exportedPhotoType).toBe("processed");
    expect(doc.entries.find((e) => e.id === "entry-none")?.photos).toEqual([]);
    expect(doc.entries.find((e) => e.id === "entry-blob")?.photos[0]?.source).toBe("blob");
    expect(doc.entries.find((e) => e.id === "entry-legacy")?.photos[0]?.source).toBe(
      "legacy_data_url",
    );

    for (const entry of doc.entries) {
      for (const photo of entry.photos) {
        expect(names).toContain(photo.filename);
      }
    }
  });
});
