/**
 * 森ログメディア本体（PNG / MP4）の端末内 Blob 保存。
 * メタデータは localStorage（moriLogMediaStore）、本体は IndexedDB。
 */

const DB_NAME = "ljd.moriLogMediaBlobs.v1";
const STORE_NAME = "blobs";
const DB_VERSION = 1;

/** MoriLogMedia.localUri に書くマーカー（本体は IDB） */
export const MORI_LOG_MEDIA_BLOB_URI = "idb:moriLogMediaBlob.v1" as const;

type BlobRecord = {
  id: string;
  mimeType: string;
  buffer: ArrayBuffer;
  updatedAt: string;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error ?? new Error("Failed to open IndexedDB"));
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

function idbRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

export async function putMoriLogMediaBlob(mediaId: string, blob: Blob): Promise<void> {
  const id = mediaId.trim();
  if (!id) throw new Error("mediaId is required");
  const buffer = await blob.arrayBuffer();
  const db = await openDb();
  try {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const record: BlobRecord = {
      id,
      mimeType: blob.type || "application/octet-stream",
      buffer,
      updatedAt: new Date().toISOString(),
    };
    await idbRequest(store.put(record));
  } finally {
    db.close();
  }
}

export async function getMoriLogMediaBlob(mediaId: string): Promise<Blob | null> {
  const id = mediaId.trim();
  if (!id) return null;
  try {
    const db = await openDb();
    try {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const record = await idbRequest(store.get(id) as IDBRequest<BlobRecord | undefined>);
      if (!record?.buffer) return null;
      return new Blob([new Uint8Array(record.buffer)], {
        type: record.mimeType || "application/octet-stream",
      });
    } finally {
      db.close();
    }
  } catch {
    return null;
  }
}

export async function removeMoriLogMediaBlob(mediaId: string): Promise<void> {
  const id = mediaId.trim();
  if (!id) return;
  try {
    const db = await openDb();
    try {
      const tx = db.transaction(STORE_NAME, "readwrite");
      await idbRequest(tx.objectStore(STORE_NAME).delete(id));
    } finally {
      db.close();
    }
  } catch {
    /* ignore */
  }
}

export function hasMoriLogMediaBlobUri(localUri: string | null | undefined): boolean {
  return (localUri ?? "").startsWith("idb:moriLogMediaBlob");
}
