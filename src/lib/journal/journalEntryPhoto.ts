import { prisma } from "@/lib/db";
import { resolveActiveProfileId } from "@/lib/profile/activeProfile";

export type JournalEntryPhotoForViewer = {
  entryId: string;
  photoDataUrl: string | null;
};

/** 閲覧中プロフィールに紐づく日記の写真 data URL のみ返す */
export async function getJournalEntryPhotoForViewer(params: {
  entryId: string;
  viewerEmail: string;
}): Promise<JournalEntryPhotoForViewer | null> {
  const activeProfileId = await resolveActiveProfileId(params.viewerEmail);
  const trimmedId = params.entryId.trim();
  if (!trimmedId) return null;

  const row = await prisma.journalEntry.findFirst({
    where: {
      id: trimmedId,
      email: params.viewerEmail,
      profileId: activeProfileId,
    },
    select: { id: true, photoDataUrl: true },
  });
  if (!row) return null;

  const raw = row.photoDataUrl?.trim() ?? "";
  return {
    entryId: row.id,
    photoDataUrl: raw.length > 0 ? raw : null,
  };
}
