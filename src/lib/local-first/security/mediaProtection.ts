/**
 * Life-record media protection helper (iOS Data Protection centered).
 * No custom media encryption in 4B-3E.
 * Not wired into journal write paths — explicit call only.
 */

import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import type { PathAttributes } from "ljd-local-security";

import { ensurePathIncludedInBackup } from "@/lib/local-first/security/backupInclusion";
import { applyCompleteFileProtection } from "@/lib/local-first/security/fileProtection";
import { mapSecurityError } from "@/lib/local-first/security/securityErrorMapping";
import { LocalFirstSecurityError } from "@/lib/local-first/security/types";

export async function resolveLibraryRelativeUri(
  relativePath: string,
): Promise<string> {
  if (!Capacitor.isNativePlatform()) {
    throw new LocalFirstSecurityError(
      "native_only",
      "media protection helper is native-only",
    );
  }
  const uri = await Filesystem.getUri({
    path: relativePath,
    directory: Directory.Library,
  });
  return uri.uri;
}

export async function protectLifeRecordMediaRelative(
  relativePath: string,
): Promise<{
  relativePath: string;
  uri: string;
  backup: PathAttributes;
  protection: PathAttributes;
}> {
  try {
    const uri = await resolveLibraryRelativeUri(relativePath);
    const backup = await ensurePathIncludedInBackup(uri);
    const protection = await applyCompleteFileProtection(uri);
    return { relativePath, uri, backup, protection };
  } catch (error) {
    throw mapSecurityError(error);
  }
}
