/**
 * 復元プロフィールの日記ブック表示検証（読み取り + 日記ブック作成）。
 *
 * 使い方:
 *   ALLOW_PROD_DB=1 ALLOW_PROD_DB_MUTATION=1 npx tsx scripts/verify-restored-diary-book-display.ts
 */
import { requireSafeDatabaseUrl } from "./lib/safe-database-url";
import { getJournalEntryPhotoRecordForViewer } from "../src/lib/journal/journalEntryPhoto";
import { loadJournalEntryPhotoPayload } from "../src/lib/journal/journalEntryPhotoResolve";
import { listJournalEntriesForDiaryBookRow } from "../src/lib/journal/listDiaryBookEntries";
import { prisma } from "../src/lib/db";

const VIEWER_EMAIL = "heartfresh4119@gmail.com";

async function main() {
  requireSafeDatabaseUrl({
    scriptName: "verify-restored-diary-book-display.ts",
    mutatesDatabase: true,
  });

  const restored = await prisma.profile.findFirst({
    where: { email: VIEWER_EMAIL, nickname: "サンプル（復元）", isArchived: false },
    select: { id: true, nickname: true },
  });
  if (!restored) {
    console.error(JSON.stringify({ ok: false, error: "サンプル（復元）が見つかりません。先に復元してください。" }));
    process.exit(1);
  }

  const entries = await prisma.journalEntry.findMany({
    where: { profileId: restored.id },
    select: {
      id: true,
      generatedComment: true,
      photoBlobUrl: true,
      photoBlobPathname: true,
      photoMimeType: true,
      photoSizeBytes: true,
      photoStorageProvider: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const withBlob = entries.filter((e) => e.photoBlobUrl);
  const withComment = entries.filter((e) => e.generatedComment?.trim());

  const photoEntry = withBlob[0];
  let photoRecordOk = false;
  let photoPayloadOk = false;
  if (photoEntry) {
    const record = await getJournalEntryPhotoRecordForViewer({
      entryId: photoEntry.id,
      viewerEmail: VIEWER_EMAIL,
    });
    photoRecordOk = record != null;
    if (record) {
      const payload = await loadJournalEntryPhotoPayload(record);
      photoPayloadOk = payload != null;
    }
  }

  const dates = entries.map((e) => e.createdAt.toISOString().slice(0, 10));
  const startDate = dates[0]!;
  const endDate = dates[dates.length - 1]!;

  let book = await prisma.diaryBook.findFirst({
    where: { email: VIEWER_EMAIL, profileId: restored.id, title: "サンプル（復元）検証用" },
  });
  if (!book) {
    book = await prisma.diaryBook.create({
      data: {
        email: VIEWER_EMAIL,
        profileId: restored.id,
        title: "サンプル（復元）検証用",
        startDate,
        endDate,
        coverTheme: "casual",
      },
    });
    book = await prisma.diaryBook.update({
      where: { id: book.id },
      data: { updatedAt: new Date() },
    });
  }

  const boundEntries = await listJournalEntriesForDiaryBookRow({
    book,
    viewerEmail: VIEWER_EMAIL,
    respectSnapshot: true,
  });

  const boundWithPhoto = boundEntries.filter((e) => e.hasPhoto);
  const boundWithComment = boundEntries.filter((e) => e.generatedComment?.trim());

  let pdfPhotoLoadOk = 0;
  let pdfPhotoLoadFailed = 0;
  for (const entry of boundWithPhoto) {
    const row = await prisma.journalEntry.findUnique({
      where: { id: entry.id },
      select: {
        id: true,
        photoDataUrl: true,
        photoBlobUrl: true,
        photoBlobPathname: true,
        photoMimeType: true,
        photoSizeBytes: true,
        photoStorageProvider: true,
      },
    });
    if (!row) {
      pdfPhotoLoadFailed += 1;
      continue;
    }
    const payload = await loadJournalEntryPhotoPayload(row);
    if (payload) pdfPhotoLoadOk += 1;
    else pdfPhotoLoadFailed += 1;
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        restoredProfile: restored,
        db: {
          entryCount: entries.length,
          blobMetaCount: withBlob.length,
          generatedCommentCount: withComment.length,
        },
        photoApi: {
          sampleEntryId: photoEntry?.id ?? null,
          photoRecordOk,
          photoPayloadOk,
        },
        diaryBook: {
          id: book.id,
          title: book.title,
          boundEntryCount: boundEntries.length,
          boundWithPhoto: boundWithPhoto.length,
          boundWithComment: boundWithComment.length,
          sampleBoundCommentLength: boundWithComment[0]?.generatedComment?.length ?? 0,
        },
        pdfPhotoPayload: {
          ok: pdfPhotoLoadOk,
          failed: pdfPhotoLoadFailed,
        },
      },
      null,
      2,
    ),
  );
}

void main()
  .then(() => prisma.$disconnect())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
