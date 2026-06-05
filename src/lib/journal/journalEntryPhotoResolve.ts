import {
  fetchJournalEntryPhotoBytesFromBlob,
  parseJournalPhotoDataUrl,
} from "@/lib/journal/journalEntryPhotoBlob";
import { journalEntryHasStoredPhoto, type JournalEntryPhotoRow } from "@/lib/journal/journalEntryPhotoPersist";
import { journalEntryPhotoApiPath } from "@/lib/journal/journalEntryPhotoPath";

export type JournalEntryPhotoPayload =
  | { kind: "bytes"; buffer: Buffer; mimeType: string }
  | { kind: "legacy_json"; photoDataUrl: string };

export async function loadJournalEntryPhotoPayload(
  row: JournalEntryPhotoRow & { id: string },
): Promise<JournalEntryPhotoPayload | null> {
  if (!journalEntryHasStoredPhoto(row)) return null;

  const blobUrl = row.photoBlobUrl?.trim();
  if (blobUrl) {
    const fromBlob = await fetchJournalEntryPhotoBytesFromBlob(blobUrl);
    if (fromBlob) {
      return { kind: "bytes", buffer: fromBlob.buffer, mimeType: fromBlob.mimeType };
    }
    console.warn("[journal-photo] blob fetch failed, trying legacy", { entryId: row.id });
  }

  const legacy = row.photoDataUrl?.trim() ?? "";
  if (!legacy) return null;

  const parsed = parseJournalPhotoDataUrl(legacy);
  if (parsed) {
    return { kind: "bytes", buffer: parsed.buffer, mimeType: parsed.mimeType };
  }

  return { kind: "legacy_json", photoDataUrl: legacy };
}

export function serializeJournalEntryPhotoForApi(entry: {
  id: string;
  photoDataUrl?: string | null;
  photoBlobUrl?: string | null;
}): { hasPhoto: boolean; photoSrc: string | null; photoDataUrl: string | null } {
  const row: JournalEntryPhotoRow = {
    photoDataUrl: entry.photoDataUrl ?? null,
    photoBlobUrl: entry.photoBlobUrl ?? null,
    photoBlobPathname: null,
    photoMimeType: null,
    photoSizeBytes: null,
    photoStorageProvider: null,
  };
  const hasPhoto = journalEntryHasStoredPhoto(row);
  if (!hasPhoto) {
    return { hasPhoto: false, photoSrc: null, photoDataUrl: null };
  }
  const photoSrc = journalEntryPhotoApiPath(entry.id);
  const legacyOnly = !entry.photoBlobUrl?.trim() && Boolean(entry.photoDataUrl?.trim());
  return {
    hasPhoto: true,
    photoSrc,
    photoDataUrl: legacyOnly ? entry.photoDataUrl!.trim() : null,
  };
}
