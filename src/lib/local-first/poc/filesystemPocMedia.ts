/**
 * Thin Filesystem media adapter for Phase 4B-2A PoC.
 * Directory.Library (not Cache / not LibraryNoBackup) — aligns with Phase 3 SoT.
 * Images are never stored as SQLite BLOBs; only media paths are recorded in DB.
 */

import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";

import { LOCAL_POC_MEDIA_DIR } from "@/lib/local-first/poc/types";

function assertNative(): void {
  if (!Capacitor.isNativePlatform()) {
    throw new Error(
      "Local-first Filesystem PoC is native-only (Capacitor.isNativePlatform() required).",
    );
  }
}

export async function ensurePocMediaDir(): Promise<void> {
  assertNative();
  try {
    await Filesystem.mkdir({
      path: LOCAL_POC_MEDIA_DIR,
      directory: Directory.Library,
      recursive: true,
    });
  } catch {
    /* may already exist */
  }
}

/**
 * Write binary-ish data as base64 into Library/ljd-poc/media/{fileName}.
 * Returns relative path stored in SQLite media_path (not a blob).
 */
export async function writePocMediaFile(
  fileName: string,
  base64Data: string,
): Promise<string> {
  assertNative();
  await ensurePocMediaDir();
  const relativePath = `${LOCAL_POC_MEDIA_DIR}/${fileName}`;
  await Filesystem.writeFile({
    path: relativePath,
    data: base64Data,
    directory: Directory.Library,
  });
  return relativePath;
}

export async function readPocMediaAsUri(relativePath: string): Promise<string> {
  assertNative();
  const result = await Filesystem.getUri({
    path: relativePath,
    directory: Directory.Library,
  });
  return Capacitor.convertFileSrc(result.uri);
}

export async function deletePocMediaFile(relativePath: string): Promise<void> {
  assertNative();
  try {
    await Filesystem.deleteFile({
      path: relativePath,
      directory: Directory.Library,
    });
  } catch {
    /* ignore missing */
  }
}

export async function clearAllPocMedia(): Promise<void> {
  assertNative();
  try {
    const listing = await Filesystem.readdir({
      path: LOCAL_POC_MEDIA_DIR,
      directory: Directory.Library,
    });
    for (const entry of listing.files) {
      const name = typeof entry === "string" ? entry : entry.name;
      if (!name) continue;
      await deletePocMediaFile(`${LOCAL_POC_MEDIA_DIR}/${name}`);
    }
  } catch {
    /* dir missing */
  }
}
