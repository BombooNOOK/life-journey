import type { BoundDiaryEntry } from "@/components/journal/DiaryYearBoundPages";
import { prisma } from "@/lib/db";
import { buildBoundDiaryBookPages, type DiaryBookPageKind } from "@/lib/journal/diaryBookPages";
import { journalEntryPhotoPayloadToDataUriForPdf } from "@/lib/journal/journalEntryPhotoForPdf";
import { loadJournalEntryPhotoPayload } from "@/lib/journal/journalEntryPhotoResolve";
import { diaryBookPrintPdfFilename } from "@/lib/journal/diaryBookPrintPdfFilename";
import { listJournalEntriesForDiaryBookRow } from "@/lib/journal/listDiaryBookEntries";

export { diaryBookPrintPdfFilename };

export class DiaryBookPrintPdfError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "DiaryBookPrintPdfError";
  }
}

export type DiaryBookPrintPdfPayload = {
  bindingCode: string;
  bookTitle: string;
  startDate: string;
  endDate: string;
  coverTheme: string;
  pageTemplate: string;
  pages: DiaryBookPageKind[];
  entries: BoundDiaryEntry[];
  photoDataUriByEntryId: Record<string, string>;
};

async function resolveEntryPhotoDataUri(entry: BoundDiaryEntry): Promise<string> {
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
    throw new DiaryBookPrintPdfError(
      `日記（ID: ${entry.id}）が見つかりません。`,
      "ENTRY_NOT_FOUND",
      500,
    );
  }

  const payload = await loadJournalEntryPhotoPayload(row);
  if (!payload) {
    const created = entry.createdAt.slice(0, 10);
    throw new DiaryBookPrintPdfError(
      `日記（記録日: ${created}、ID: ${entry.id}）の写真を取得できませんでした。写真の保存状態を確認してから再度お試しください。`,
      "PHOTO_LOAD_FAILED",
      500,
    );
  }

  return journalEntryPhotoPayloadToDataUriForPdf(payload);
}

export async function loadDiaryBookPrintPdfPayload(
  requestId: string,
): Promise<DiaryBookPrintPdfPayload> {
  const request = await prisma.diaryBookBindingRequest.findUnique({
    where: { id: requestId.trim() },
  });
  if (!request) {
    throw new DiaryBookPrintPdfError(
      "製本申込が見つかりません。",
      "REQUEST_NOT_FOUND",
      404,
    );
  }

  const bookId = request.diaryBookId?.trim() ?? "";
  if (!bookId) {
    throw new DiaryBookPrintPdfError(
      "この申込は旧年本棚形式のため、あしあとブックPDFを生成できません。",
      "LEGACY_REQUEST",
      400,
    );
  }

  const book = await prisma.diaryBook.findUnique({ where: { id: bookId } });
  if (!book) {
    throw new DiaryBookPrintPdfError(
      "あしあとブックが見つかりません。",
      "BOOK_NOT_FOUND",
      404,
    );
  }

  const entries = await listJournalEntriesForDiaryBookRow({
    book,
    viewerEmail: book.email,
    respectSnapshot: true,
  });

  const photoEntries = entries.filter((e) => e.hasPhoto === true);
  const photoPairs = await Promise.all(
    photoEntries.map(async (entry) => [entry.id, await resolveEntryPhotoDataUri(entry)] as const),
  );
  const photoDataUriByEntryId = Object.fromEntries(photoPairs);

  const pages = buildBoundDiaryBookPages(entries, book.startDate, book.endDate);

  return {
    bindingCode: request.diaryBindingCode,
    bookTitle: book.title.trim() || request.displayTitle?.trim() || "あしあとブック",
    startDate: book.startDate,
    endDate: book.endDate,
    coverTheme: book.coverTheme,
    pageTemplate: book.pageTemplate ?? "suuji_ashiato_irodori",
    pages,
    entries,
    photoDataUriByEntryId,
  };
}
