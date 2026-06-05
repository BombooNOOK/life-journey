import { del, get, put } from "@vercel/blob";

export const JOURNAL_PHOTO_STORAGE_PROVIDER = "vercel_blob";

/** put / get / del に渡す認証オプション（@vercel/blob 2.4+ OIDC） */
type JournalPhotoBlobSdkAuthOptions = {
  access: "private";
  token?: string;
  storeId?: string;
  oidcToken?: string;
};

const DATA_URL_RE = /^data:(image\/[a-z0-9+.-]+);base64,([a-z0-9+/=\s]+)$/i;

type JournalPhotoBlobOidcAuth = {
  mode: "oidc";
  storeId: string;
  oidcToken?: string;
};

type JournalPhotoBlobTokenAuth = {
  mode: "token";
  token: string;
};

export type JournalPhotoBlobAuth = JournalPhotoBlobOidcAuth | JournalPhotoBlobTokenAuth;

/** 日記写真 Store ID（プロジェクト既定の BLOB_STORE_ID は使わない） */
export function journalPhotoBlobStoreId(): string | null {
  const id = process.env.JOURNAL_PHOTO_BLOB_STORE_ID?.trim();
  return id || null;
}

function journalPhotoBlobOidcToken(): string | null {
  return process.env.VERCEL_OIDC_TOKEN?.trim() || null;
}

function journalPhotoBlobReadWriteToken(): string | null {
  return process.env.JOURNAL_PHOTO_BLOB_READ_WRITE_TOKEN?.trim() || null;
}

/**
 * 認証: (1) JOURNAL_PHOTO_BLOB_STORE_ID + VERCEL_OIDC_TOKEN
 *       (2) JOURNAL_PHOTO_BLOB_READ_WRITE_TOKEN
 */
export function resolveJournalPhotoBlobAuth(): JournalPhotoBlobAuth | null {
  const storeId = journalPhotoBlobStoreId();
  const oidcToken = journalPhotoBlobOidcToken();
  if (storeId && oidcToken) {
    return { mode: "oidc", storeId, oidcToken };
  }

  const token = journalPhotoBlobReadWriteToken();
  if (token) {
    return { mode: "token", token };
  }

  return null;
}

/** OIDC または Read/Write Token のどちらかがあれば Blob 保存可能 */
export function journalPhotoBlobWriteEnabled(): boolean {
  return resolveJournalPhotoBlobAuth() != null;
}

function blobAccessOptions(auth: JournalPhotoBlobAuth): JournalPhotoBlobSdkAuthOptions {
  if (auth.mode === "oidc") {
    return {
      access: "private",
      storeId: auth.storeId,
      ...(auth.oidcToken ? { oidcToken: auth.oidcToken } : {}),
    };
  }
  return {
    access: "private",
    token: auth.token,
  };
}

export function journalEntryPhotoBlobPathname(profileId: string, entryId: string, mimeType: string): string {
  const ext = mimeType.includes("webp") ? "webp" : mimeType.includes("png") ? "png" : "jpg";
  const safeProfile = profileId.trim() || "default";
  return `journal-photos/${safeProfile}/${entryId}.${ext}`;
}

export function parseJournalPhotoDataUrl(
  dataUrl: string,
): { buffer: Buffer; mimeType: string } | null {
  const trimmed = dataUrl.trim();
  const m = DATA_URL_RE.exec(trimmed);
  if (!m) return null;
  const mimeType = m[1]!.toLowerCase();
  const base64 = m[2]!.replace(/\s/g, "");
  try {
    const buffer = Buffer.from(base64, "base64");
    if (buffer.byteLength === 0) return null;
    return { buffer, mimeType };
  } catch {
    return null;
  }
}

export type JournalEntryPhotoBlobMeta = {
  photoBlobUrl: string;
  photoBlobPathname: string;
  photoMimeType: string;
  photoSizeBytes: number;
  photoStorageProvider: string;
};

export async function putJournalEntryPhotoToBlob(params: {
  profileId: string;
  entryId: string;
  dataUrl: string;
}): Promise<JournalEntryPhotoBlobMeta> {
  const auth = resolveJournalPhotoBlobAuth();
  if (!auth) {
    throw new Error(
      "日記写真 Blob の認証が未設定です（JOURNAL_PHOTO_BLOB_STORE_ID + VERCEL_OIDC_TOKEN、または JOURNAL_PHOTO_BLOB_READ_WRITE_TOKEN）。",
    );
  }

  const parsed = parseJournalPhotoDataUrl(params.dataUrl);
  if (!parsed) {
    throw new Error("写真データの形式が不正です。");
  }

  const pathname = journalEntryPhotoBlobPathname(
    params.profileId,
    params.entryId,
    parsed.mimeType,
  );
  const result = await put(pathname, parsed.buffer, {
    ...blobAccessOptions(auth),
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: parsed.mimeType,
  });
  return {
    photoBlobUrl: result.url,
    photoBlobPathname: result.pathname,
    photoMimeType: parsed.mimeType,
    photoSizeBytes: parsed.buffer.byteLength,
    photoStorageProvider: JOURNAL_PHOTO_STORAGE_PROVIDER,
  };
}

export async function fetchJournalEntryPhotoBytesFromBlob(
  blobUrl: string,
): Promise<{ buffer: Buffer; mimeType: string } | null> {
  const auth = resolveJournalPhotoBlobAuth();
  if (!auth) return null;

  try {
    const result = await get(blobUrl, blobAccessOptions(auth));
    if (result?.statusCode === 200 && result.stream) {
      const buffer = Buffer.from(await new Response(result.stream).arrayBuffer());
      if (buffer.byteLength > 0) {
        const mimeType = result.blob.contentType?.trim() || "image/webp";
        return { buffer, mimeType };
      }
    }
  } catch (e) {
    console.warn("[journal-photo-blob] private get failed", { mode: auth.mode, error: e });
  }
  return null;
}

/** DB 削除後もベストエフォートで Blob を削除（失敗はログのみ） */
export async function deleteJournalEntryPhotoBlobBestEffort(
  pathname: string | null | undefined,
  blobUrl?: string | null,
): Promise<void> {
  const auth = resolveJournalPhotoBlobAuth();
  if (!auth) return;

  const target = pathname?.trim() || blobUrl?.trim();
  if (!target) return;

  try {
    await del(target, blobAccessOptions(auth));
  } catch (e) {
    console.warn("[journal-photo-blob] del failed", {
      mode: auth.mode,
      pathname,
      blobUrl,
      error: e,
    });
  }
}
