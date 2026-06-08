import { mkdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { writeJournalBackupZipToPath } from "@/lib/journal/journalBackupExport";
import { extractJournalBackupFromBuffer } from "@/lib/journal/journalBackupValidate";
import { listZipEntryNamesFromBuffer } from "@/lib/journal/journalBackupZipExtract";

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

const viewerEmail = "zip-extract-test@example.com";
const profileId = "profile-zip-extract";
const tinyWebpBase64 =
  "UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAQAcJaQAA3AA/vuUAAA=";
const blobBytes = Buffer.from(tinyWebpBase64, "base64");

describe("journalBackupZipExtract", () => {
  const outDir = path.join("tmp", "journal-backup-zip-extract");
  const outZip = path.join(outDir, "sample.zip");

  beforeEach(async () => {
    vi.clearAllMocks();
    mkdirSync(outDir, { recursive: true });

    vi.mocked(prisma.journalEntry.findMany).mockResolvedValue([
      {
        id: "entry-blob",
        createdAt: new Date("2026-01-10T03:00:00.000Z"),
        updatedAt: new Date("2026-01-10T04:00:00.000Z"),
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
        photoBlobPathname: "journal-photos/profile/entry-blob.webp",
        photoMimeType: "image/webp",
        photoSizeBytes: blobBytes.byteLength,
        photoStorageProvider: "vercel_blob",
      },
    ] as never);
    vi.mocked(prisma.diaryBook.findMany).mockResolvedValue([]);
    vi.mocked(prisma.diaryBookshelfBook.findMany).mockResolvedValue([]);
    vi.mocked(prisma.order.findFirst).mockResolvedValue(null);
    vi.mocked(loadJournalEntryPhotoPayload).mockResolvedValue({
      kind: "bytes",
      buffer: blobBytes,
      mimeType: "image/webp",
    });

    await writeJournalBackupZipToPath(
      {
        viewerEmail,
        profileId,
        profileNickname: "ZIP検証",
      },
      outZip,
    );
  });

  afterEach(() => {
    rmSync(outDir, { recursive: true, force: true });
  });

  it("lists zip entries from buffer without unzip command", () => {
    const buffer = readFileSync(outZip);
    const names = listZipEntryNamesFromBuffer(buffer);
    expect(names).toContain("backup.json");
    expect(names).toContain("photos/entry_entry-blob.webp");
  });

  it("extracts backup document and photo bytes from buffer", () => {
    const buffer = readFileSync(outZip);
    const extracted = extractJournalBackupFromBuffer(buffer);
    expect(extracted.document.profile.nickname).toBe("ZIP検証");
    const photoEntry = extracted.document.entries.find((entry) => entry.photos.length > 0);
    expect(photoEntry?.id).toBe("entry-blob");
    const bytes = extracted.readFileBytes(photoEntry!.photos[0]!.filename);
    expect(bytes.byteLength).toBeGreaterThan(0);
  });
});
