import { isAdminEmail } from "@/lib/admin/access";
import { prisma } from "@/lib/db";
import type { JournalEntryPhotoRow } from "@/lib/journal/journalEntryPhotoPersist";

const photoSelect = {
  id: true,
  photoDataUrl: true,
  photoBlobUrl: true,
  photoBlobPathname: true,
  photoMimeType: true,
  photoSizeBytes: true,
  photoStorageProvider: true,
} as const;

export type JournalEntryPhotoRecord = JournalEntryPhotoRow & { id: string };

/** 閲覧権限のある日記行（写真フィールドのみ） */
export async function getJournalEntryPhotoRecordForViewer(params: {
  entryId: string;
  viewerEmail: string;
}): Promise<JournalEntryPhotoRecord | null> {
  const trimmedId = params.entryId.trim();
  if (!trimmedId) return null;

  const admin = await isAdminEmail(params.viewerEmail);
  if (admin) {
    return prisma.journalEntry.findFirst({
      where: { id: trimmedId },
      select: photoSelect,
    });
  }

  // 日記ブック閲覧など、アクティブプロフィール以外の記事写真も email 一致で許可する
  return prisma.journalEntry.findFirst({
    where: {
      id: trimmedId,
      email: params.viewerEmail,
    },
    select: photoSelect,
  });
}
