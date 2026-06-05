import { serializeJournalEntryPhotoForApi } from "@/lib/journal/journalEntryPhotoResolve";

type EntryWithPhotoFields = {
  id: string;
  photoDataUrl?: string | null;
  photoBlobUrl?: string | null;
  photoBlobPathname?: string | null;
  photoMimeType?: string | null;
  photoSizeBytes?: number | null;
  photoStorageProvider?: string | null;
};

export type JournalEntryApiPhotoFields = {
  hasPhoto: boolean;
  photoSrc: string | null;
  photoDataUrl: string | null;
};

/** API レスポンス用: Blob 内部メタを除き hasPhoto / photoSrc を付与 */
export function formatJournalEntryForApiResponse(
  entry: EntryWithPhotoFields & Record<string, unknown>,
): Record<string, unknown> & JournalEntryApiPhotoFields {
  const photo = serializeJournalEntryPhotoForApi(entry);
  const {
    photoBlobUrl: _bu,
    photoBlobPathname: _bp,
    photoMimeType: _bm,
    photoSizeBytes: _bs,
    photoStorageProvider: _sp,
    photoDataUrl: _legacy,
    ...rest
  } = entry;
  return {
    ...rest,
    hasPhoto: photo.hasPhoto,
    photoSrc: photo.photoSrc,
    photoDataUrl: photo.photoDataUrl,
  };
}
