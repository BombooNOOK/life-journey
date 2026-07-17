import { normalizeEmail } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import { deleteJournalEntryPhotoBlobBestEffort } from "@/lib/journal/journalEntryPhotoBlob";
import {
  journalEntryHasStoredPhoto,
  parsePhotoPatchFromRequestBody,
  resolveJournalEntryPhotoDbFields,
  type PhotoPatchFromClient,
} from "@/lib/journal/journalEntryPhotoPersist";

export type JournalDraftView = {
  id: string;
  email: string;
  profileId: string;
  dateKey: string;
  content: string;
  mood: string;
  activity: string;
  companionType: string;
  designTheme: string;
  contentFontMode: string;
  hasPhoto: boolean;
  photoSrc: string | null;
  writingMode: string;
  createdAt: string;
  updatedAt: string;
};

type DraftRow = {
  id: string;
  email: string;
  profileId: string;
  dateKey: string;
  content: string;
  mood: string;
  activity: string;
  companionType: string;
  designTheme: string;
  contentFontMode: string;
  photoBlobUrl: string | null;
  photoBlobPathname: string | null;
  photoMimeType: string | null;
  photoSizeBytes: number | null;
  photoDataUrl?: string | null;
  writingMode: string;
  createdAt: Date;
  updatedAt: Date;
};

export function journalDraftPhotoApiPath(dateKey: string, profileId: string): string {
  const qs = new URLSearchParams({
    dateKey: dateKey.trim(),
    profileId: profileId.trim(),
  });
  return `/api/journal/drafts/photo?${qs.toString()}`;
}

function toView(row: DraftRow): JournalDraftView {
  const hasPhoto = journalEntryHasStoredPhoto({
    photoDataUrl: row.photoDataUrl ?? null,
    photoBlobUrl: row.photoBlobUrl,
    photoBlobPathname: row.photoBlobPathname,
    photoMimeType: row.photoMimeType,
    photoSizeBytes: row.photoSizeBytes,
    photoStorageProvider: null,
  });
  return {
    id: row.id,
    email: row.email,
    profileId: row.profileId,
    dateKey: row.dateKey,
    content: row.content,
    mood: row.mood,
    activity: row.activity,
    companionType: row.companionType,
    designTheme: row.designTheme,
    contentFontMode: row.contentFontMode,
    hasPhoto,
    photoSrc: hasPhoto ? journalDraftPhotoApiPath(row.dateKey, row.profileId) : null,
    writingMode: row.writingMode,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getJournalDraft(params: {
  email: string;
  profileId: string;
  dateKey: string;
}): Promise<JournalDraftView | null> {
  const email = normalizeEmail(params.email);
  const profileId = params.profileId.trim();
  const dateKey = params.dateKey.trim();
  if (!email || !profileId || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return null;

  const row = await prisma.journalDraft.findUnique({
    where: {
      email_profileId_dateKey: { email, profileId, dateKey },
    },
  });
  return row ? toView(row) : null;
}

/** カレンダー用：その月にある下書きの dateKey 一覧 */
export async function listJournalDraftDateKeysInMonth(params: {
  email: string;
  profileId: string;
  /** YYYY-MM */
  monthKey: string;
}): Promise<string[]> {
  const email = normalizeEmail(params.email);
  const profileId = params.profileId.trim();
  const monthKey = params.monthKey.trim();
  if (!email || !profileId || !/^\d{4}-\d{2}$/.test(monthKey)) return [];

  const prefix = `${monthKey}-`;
  const rows = await prisma.journalDraft.findMany({
    where: {
      email,
      profileId,
      dateKey: { startsWith: prefix },
    },
    select: { dateKey: true, content: true, photoBlobUrl: true, photoDataUrl: true },
  });

  return rows
    .filter(
      (row) =>
        row.content.trim().length > 0 ||
        Boolean(row.photoBlobUrl?.trim()) ||
        Boolean(row.photoDataUrl?.trim()),
    )
    .map((row) => row.dateKey)
    .sort();
}

export type UpsertJournalDraftInput = {
  email: string;
  profileId: string;
  dateKey: string;
  content: string;
  mood?: string;
  activity?: string;
  companionType?: string;
  designTheme?: string;
  contentFontMode?: string;
  writingMode?: string;
  photoPatch?: PhotoPatchFromClient;
};

export async function upsertJournalDraft(
  input: UpsertJournalDraftInput,
): Promise<JournalDraftView> {
  const email = normalizeEmail(input.email);
  const profileId = input.profileId.trim();
  const dateKey = input.dateKey.trim();
  if (!email || !profileId) throw new Error("email / profileId が必要です");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) throw new Error("日付が不正です");

  const baseData = {
    content: input.content,
    mood: input.mood?.trim() || "calm",
    activity: input.activity?.trim() || "record_anyway",
    companionType: input.companionType?.trim() || "owl",
    designTheme: input.designTheme?.trim() || "simple",
    contentFontMode: input.contentFontMode?.trim() || "standard",
    writingMode: input.writingMode?.trim() || "alone",
  };

  const existing = await prisma.journalDraft.findUnique({
    where: {
      email_profileId_dateKey: { email, profileId, dateKey },
    },
  });

  const draftId = existing?.id ?? `draft_${profileId}_${dateKey}`;
  const photoPatch = input.photoPatch ?? { kind: "unchanged" as const };
  const photoFields = await resolveJournalEntryPhotoDbFields({
    patch: photoPatch,
    existing: existing
      ? {
          photoDataUrl: existing.photoDataUrl,
          photoBlobUrl: existing.photoBlobUrl,
          photoBlobPathname: existing.photoBlobPathname,
          photoMimeType: existing.photoMimeType,
          photoSizeBytes: existing.photoSizeBytes,
          photoStorageProvider: null,
        }
      : null,
    profileId,
    entryId: draftId,
  });

  const photoData = {
    photoBlobUrl: photoFields.photoBlobUrl,
    photoBlobPathname: photoFields.photoBlobPathname,
    photoMimeType: photoFields.photoMimeType,
    photoSizeBytes: photoFields.photoSizeBytes,
    photoDataUrl: photoFields.photoDataUrl,
  };

  const row = existing
    ? await prisma.journalDraft.update({
        where: { id: existing.id },
        data: { ...baseData, ...photoData },
      })
    : await prisma.journalDraft.create({
        data: {
          id: draftId,
          email,
          profileId,
          dateKey,
          ...baseData,
          ...photoData,
        },
      });

  return toView(row);
}

export async function deleteJournalDraft(params: {
  email: string;
  profileId: string;
  dateKey: string;
  /** true のとき写真 Blob も削除（既定 true） */
  deletePhotoBlob?: boolean;
}): Promise<boolean> {
  const email = normalizeEmail(params.email);
  const profileId = params.profileId.trim();
  const dateKey = params.dateKey.trim();
  if (!email || !profileId || !dateKey) return false;

  const existing = await prisma.journalDraft.findUnique({
    where: {
      email_profileId_dateKey: { email, profileId, dateKey },
    },
    select: {
      id: true,
      photoBlobPathname: true,
      photoBlobUrl: true,
    },
  });
  if (!existing) return false;

  try {
    await prisma.journalDraft.delete({ where: { id: existing.id } });
  } catch {
    return false;
  }

  if (params.deletePhotoBlob !== false) {
    await deleteJournalEntryPhotoBlobBestEffort(
      existing.photoBlobPathname,
      existing.photoBlobUrl,
    );
  }
  return true;
}

/** 正式保存時：下書き写真を日記へ移し、下書き行だけ消す（Blob は残す） */
export async function transferJournalDraftPhotoToEntry(params: {
  email: string;
  profileId: string;
  dateKey: string;
  entryId: string;
}): Promise<boolean> {
  const email = normalizeEmail(params.email);
  const profileId = params.profileId.trim();
  const dateKey = params.dateKey.trim();
  const entryId = params.entryId.trim();
  if (!email || !profileId || !dateKey || !entryId) return false;

  const draft = await prisma.journalDraft.findUnique({
    where: {
      email_profileId_dateKey: { email, profileId, dateKey },
    },
  });
  if (!draft) return false;

  const hasPhoto = journalEntryHasStoredPhoto({
    photoDataUrl: draft.photoDataUrl,
    photoBlobUrl: draft.photoBlobUrl,
    photoBlobPathname: draft.photoBlobPathname,
    photoMimeType: draft.photoMimeType,
    photoSizeBytes: draft.photoSizeBytes,
    photoStorageProvider: null,
  });
  if (!hasPhoto) {
    await deleteJournalDraft({ email, profileId, dateKey, deletePhotoBlob: true });
    return false;
  }

  await prisma.journalEntry.update({
    where: { id: entryId },
    data: {
      photoBlobUrl: draft.photoBlobUrl,
      photoBlobPathname: draft.photoBlobPathname,
      photoMimeType: draft.photoMimeType,
      photoSizeBytes: draft.photoSizeBytes,
      photoDataUrl: draft.photoDataUrl,
      photoStorageProvider: draft.photoBlobUrl ? "vercel_blob" : null,
    },
  });

  await prisma.journalDraft.update({
    where: { id: draft.id },
    data: {
      photoBlobUrl: null,
      photoBlobPathname: null,
      photoMimeType: null,
      photoSizeBytes: null,
      photoDataUrl: null,
    },
  });
  await deleteJournalDraft({ email, profileId, dateKey, deletePhotoBlob: false });
  return true;
}

export { parsePhotoPatchFromRequestBody };
