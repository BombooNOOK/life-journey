/**
 * Filesystem media for Local Journal PoC — relative paths only in DB.
 */

import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";

import { LOCAL_JOURNAL_MEDIA_ROOT } from "@/lib/local-first/journal/types";

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

/** Simple checksum for PoC (not cryptographic authenticity) */
export async function sha256HexOfBase64(base64Data: string): Promise<string> {
  const binary = atob(base64Data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
