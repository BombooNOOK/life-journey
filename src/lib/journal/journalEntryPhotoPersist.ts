import {
  deleteJournalEntryPhotoBlobBestEffort,
  journalPhotoBlobWriteEnabled,
  putJournalEntryPhotoToBlob,
} from "@/lib/journal/journalEntryPhotoBlob";

export type JournalEntryPhotoDbFields = {
  photoDataUrl: string | null;
  photoBlobUrl: string | null;
  photoBlobPathname: string | null;
  photoMimeType: string | null;
  photoSizeBytes: number | null;
  photoStorageProvider: string | null;
};

export type JournalEntryPhotoRow = JournalEntryPhotoDbFields;

export function journalEntryHasStoredPhoto(row: JournalEntryPhotoRow): boolean {
  if (row.photoBlobUrl?.trim()) return true;
  return Boolean(row.photoDataUrl?.trim());
}

export type PhotoPatchFromClient =
  | { kind: "unchanged" }
  | { kind: "remove" }
  | { kind: "set"; dataUrl: string };

/** POST/PATCH 本文から写真更新意図を解釈 */
export function parsePhotoPatchFromRequestBody(json: unknown): PhotoPatchFromClient {
  if (typeof json !== "object" || json === null) {
    return { kind: "unchanged" };
  }
  const body = json as Record<string, unknown>;
  if (body.photoUnchanged === true) {
    return { kind: "unchanged" };
  }
  if (body.photoRemoved === true) {
    return { kind: "remove" };
  }
  if ("photoDataUrl" in body) {
    const raw = String(body.photoDataUrl ?? "").trim();
    if (!raw) return { kind: "remove" };
    return { kind: "set", dataUrl: raw };
  }
  return { kind: "unchanged" };
}

const EMPTY_PHOTO_FIELDS: JournalEntryPhotoDbFields = {
  photoDataUrl: null,
  photoBlobUrl: null,
  photoBlobPathname: null,
  photoMimeType: null,
  photoSizeBytes: null,
  photoStorageProvider: null,
};

function existingPhotoFields(row: JournalEntryPhotoRow): JournalEntryPhotoDbFields {
  return {
    photoDataUrl: row.photoDataUrl,
    photoBlobUrl: row.photoBlobUrl,
    photoBlobPathname: row.photoBlobPathname,
    photoMimeType: row.photoMimeType,
    photoSizeBytes: row.photoSizeBytes,
    photoStorageProvider: row.photoStorageProvider,
  };
}

/**
 * 新規・更新時の写真 DB フィールドを組み立てる。
 * Blob 有効時は新規アップロードを Blob のみにし photoDataUrl は null。
 */
export async function resolveJournalEntryPhotoDbFields(params: {
  patch: PhotoPatchFromClient;
  existing: JournalEntryPhotoRow | null;
  profileId: string;
  entryId: string;
}): Promise<JournalEntryPhotoDbFields> {
  const { patch, existing, profileId, entryId } = params;

  if (patch.kind === "unchanged") {
    if (!existing) return { ...EMPTY_PHOTO_FIELDS };
    return existingPhotoFields(existing);
  }

  if (patch.kind === "remove") {
    if (existing) {
      await deleteJournalEntryPhotoBlobBestEffort(
        existing.photoBlobPathname,
        existing.photoBlobUrl,
      );
    }
    return { ...EMPTY_PHOTO_FIELDS };
  }

  // set
  if (existing) {
    await deleteJournalEntryPhotoBlobBestEffort(
      existing.photoBlobPathname,
      existing.photoBlobUrl,
    );
  }

  if (journalPhotoBlobWriteEnabled()) {
    const meta = await putJournalEntryPhotoToBlob({
      profileId,
      entryId,
      dataUrl: patch.dataUrl,
    });
    return {
      photoDataUrl: null,
      ...meta,
    };
  }

  console.warn(
    "[journal-photo] Blob auth unset (need JOURNAL_PHOTO_BLOB_STORE_ID+VERCEL_OIDC_TOKEN or JOURNAL_PHOTO_BLOB_READ_WRITE_TOKEN); saving photoDataUrl (legacy)",
  );
  return {
    ...EMPTY_PHOTO_FIELDS,
    photoDataUrl: patch.dataUrl,
  };
}
