/**
 * 森ログメディア本体（PNG / MP4）の端末内 Blob 保存。
 * メタデータは localStorage（moriLogMediaStore）、本体は IndexedDB。
 */

const DB_NAME = "ljd.moriLogMediaBlobs.v1";
const STORE_NAME = "blobs";
const DB_VERSION = 1;

/** MoriLogMedia.localUri に書くマーカー（本体は IDB） */
export const MORI_LOG_MEDIA_BLOB_URI = "idb:moriLogMediaBlob.v1" as const;

/** ムービー一覧用の静止画ポスター（本体 id とは別キー） */
export function moriLogMediaPosterBlobId(mediaId: string): string {
  return `${mediaId.trim()}:poster`;
}

type BlobRecord = {
  id: string;
  mimeType: string;
  /** 現行：Blob をそのまま格納（iOS の大容量 ArrayBuffer 失敗を避ける） */
  blob?: Blob;
  /** 旧形式互換 */
  buffer?: ArrayBuffer;
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

function waitForTransaction(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB transaction failed"));
    tx.onabort = () => reject(tx.error ?? new Error("IndexedDB transaction aborted"));
  });
}

export async function putMoriLogMediaBlob(mediaId: string, blob: Blob): Promise<void> {
  const id = mediaId.trim();
  if (!id) throw new Error("mediaId is required");
  if (blob.size <= 0) throw new Error("blob is empty");

  const db = await openDb();
  try {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const done = waitForTransaction(tx);
    const store = tx.objectStore(STORE_NAME);
    const record: BlobRecord = {
      id,
      mimeType: blob.type || "application/octet-stream",
      blob,
      updatedAt: new Date().toISOString(),
    };
    store.put(record);
    await done;
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
      if (!record) return null;
      if (record.blob instanceof Blob && record.blob.size > 0) {
        return record.blob;
      }
      if (record.buffer) {
        return new Blob([new Uint8Array(record.buffer)], {
          type: record.mimeType || "application/octet-stream",
        });
      }
      return null;
    } finally {
      db.close();
    }
  } catch {
    return null;
  }
}

export async function putMoriLogMediaPosterBlob(mediaId: string, blob: Blob): Promise<void> {
  await putMoriLogMediaBlob(moriLogMediaPosterBlobId(mediaId), blob);
}

export async function getMoriLogMediaPosterBlob(mediaId: string): Promise<Blob | null> {
  return getMoriLogMediaBlob(moriLogMediaPosterBlobId(mediaId));
}

export async function removeMoriLogMediaBlob(mediaId: string): Promise<void> {
  const id = mediaId.trim();
  if (!id) return;
  try {
    const db = await openDb();
    try {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const done = waitForTransaction(tx);
      const store = tx.objectStore(STORE_NAME);
      store.delete(id);
      store.delete(moriLogMediaPosterBlobId(id));
      await done;
    } finally {
      db.close();
    }
  } catch {
    /* ignore */
  }
}

/** 任意キー削除（下書きの movie/poster など。poster 自動削除なし） */
export async function deleteMoriLogMediaBlobExactIds(ids: readonly string[]): Promise<void> {
  const cleaned = ids.map((id) => id.trim()).filter(Boolean);
  if (cleaned.length === 0) return;
  try {
    const db = await openDb();
    try {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const done = waitForTransaction(tx);
      const store = tx.objectStore(STORE_NAME);
      for (const id of cleaned) store.delete(id);
      await done;
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
