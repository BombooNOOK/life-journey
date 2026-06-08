import { del, get } from "@vercel/blob";

import { assertAdminRestoreBlobPathname } from "@/lib/journal/journalBackupValidate";

function resolveRestoreTempBlobToken(): string | null {
  const general = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (general) return general;
  return process.env.JOURNAL_PHOTO_BLOB_READ_WRITE_TOKEN?.trim() || null;
}

export function adminRestoreTempBlobWriteEnabled(): boolean {
  return resolveRestoreTempBlobToken() != null;
}

export async function fetchAdminRestoreZipBuffer(params: {
  blobUrl?: string | null;
  blobPathname?: string | null;
}): Promise<Buffer> {
  const token = resolveRestoreTempBlobToken();
  if (!token) {
    throw new Error("一時ZIPの読み取り設定がありません（BLOB_READ_WRITE_TOKEN）。");
  }

  const pathname = params.blobPathname?.trim();
  const blobUrl = params.blobUrl?.trim();
  if (pathname) {
    assertAdminRestoreBlobPathname(pathname);
  }

  const target = pathname || blobUrl;
  if (!target) {
    throw new Error("一時ZIPの参照先が指定されていません。");
  }

  const result = await get(target, { access: "private", token });
  if (result?.statusCode !== 200 || !result.stream) {
    throw new Error("一時ZIPを読み取れませんでした。");
  }

  const buffer = Buffer.from(await new Response(result.stream).arrayBuffer());
  if (buffer.byteLength <= 0) {
    throw new Error("一時ZIPが空です。");
  }
  return buffer;
}

export async function deleteAdminRestoreZipBlobBestEffort(params: {
  blobUrl?: string | null;
  blobPathname?: string | null;
}): Promise<void> {
  const token = resolveRestoreTempBlobToken();
  if (!token) return;

  const pathname = params.blobPathname?.trim();
  const blobUrl = params.blobUrl?.trim();
  const target = pathname || blobUrl;
  if (!target) return;

  try {
    if (pathname) {
      assertAdminRestoreBlobPathname(pathname);
    }
    await del(target, { token });
  } catch (e) {
    console.warn("[admin-restore-temp-blob] delete failed", {
      pathname: pathname ?? null,
      error: e instanceof Error ? e.message : String(e),
    });
  }
}
