/**
 * Filesystem media for Local Journal PoC — relative paths only in DB.
 */

import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";

import { sha256HexOfBase64 } from "@/lib/local-first/journal/checksum";
import { LOCAL_JOURNAL_MEDIA_ROOT } from "@/lib/local-first/journal/types";

export { sha256HexOfBase64 };

function assertNative(): void {
  if (!Capacitor.isNativePlatform()) {
    throw new Error("Local Journal media store is native-only.");
  }
}

export async function ensureJournalMediaDir(): Promise<void> {
  assertNative();
  try {
    await Filesystem.mkdir({
      path: LOCAL_JOURNAL_MEDIA_ROOT,
      directory: Directory.Library,
      recursive: true,
    });
  } catch {
    /* exists */
  }
}

export async function writeJournalMediaRelative(
  fileName: string,
  base64Data: string,
): Promise<string> {
  assertNative();
  await ensureJournalMediaDir();
  const relativePath = `${LOCAL_JOURNAL_MEDIA_ROOT}/${fileName}`;
  await Filesystem.writeFile({
    path: relativePath,
    data: base64Data,
    directory: Directory.Library,
  });
  return relativePath;
}

/** Read media bytes back as base64 for post-write integrity checks. */
export async function readJournalMediaBase64(relativePath: string): Promise<string> {
  assertNative();
  const result = await Filesystem.readFile({
    path: relativePath,
    directory: Directory.Library,
  });
  if (typeof result.data !== "string" || !result.data) {
    throw new Error("media read returned empty data");
  }
  return result.data;
}

export async function resolveJournalMediaUri(relativePath: string): Promise<string> {
  assertNative();
  const result = await Filesystem.getUri({
    path: relativePath,
    directory: Directory.Library,
  });
  return Capacitor.convertFileSrc(result.uri);
}

export async function deleteJournalMediaRelative(relativePath: string): Promise<void> {
  assertNative();
  try {
    await Filesystem.deleteFile({
      path: relativePath,
      directory: Directory.Library,
    });
  } catch {
    /* missing */
  }
}

