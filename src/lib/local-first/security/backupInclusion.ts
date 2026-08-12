/**
 * Backup inclusion policy for Local-first life-record files.
 *
 * Verified (PoC): community sqlite createDatabaseLocation can set the parent
 * directory isExcludedFromBackup=true on first create. LJD then set excluded=false
 * and measured false after reopen.
 *
 * Designed: force inclusion only when currently excluded. Do not rewrite every launch.
 * Existing user/journal paths are not auto-touched in 4B-3E.
 */

import { Capacitor } from "@capacitor/core";
import { LjdLocalSecurity, type PathAttributes } from "ljd-local-security";

import { mapSecurityError } from "@/lib/local-first/security/securityErrorMapping";
import {
  LocalFirstSecurityError,
  type BackupInclusionTiming,
  type TriStateBool,
} from "@/lib/local-first/security/types";

export const BACKUP_INCLUSION_POLICY = {
  recommendedTiming: "after_directory_create" as BackupInclusionTiming,
  applyEveryLaunch: false,
  note: "Inspect after first directory/DB create; set excluded=false only if currently true. on_db_init is an equivalent safe hook. on_every_launch is unnecessary write traffic.",
} as const;

export function shouldForceBackupInclusion(current: TriStateBool): boolean {
  return current === true;
}

export async function ensurePathIncludedInBackup(
  path: string,
): Promise<PathAttributes> {
  if (!Capacitor.isNativePlatform()) {
    throw new LocalFirstSecurityError(
      "native_only",
      "backup inclusion helper is native-only",
    );
  }
  if (!path) {
    throw new LocalFirstSecurityError("path_required", "path required");
  }
  try {
    const current = await LjdLocalSecurity.inspectPath({ path });
    if (!shouldForceBackupInclusion(current.isExcludedFromBackup)) {
      return current;
    }
    return await LjdLocalSecurity.setExcludedFromBackup({
      path,
      excluded: false,
    });
  } catch (error) {
    throw mapSecurityError(error);
  }
}
