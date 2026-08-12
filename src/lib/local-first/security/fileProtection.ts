/**
 * File Protection helper.
 *
 * Designed: NSFileProtectionComplete for DB + life-record media.
 * Verified: attribute set + reopen hold (Simulator + company SE).
 * Release Gate: lock-while-locked access denial is NOT demonstrated.
 */

import { Capacitor } from "@capacitor/core";
import { LjdLocalSecurity, type PathAttributes } from "ljd-local-security";

import { mapSecurityError } from "@/lib/local-first/security/securityErrorMapping";
import {
  LJD_FILE_PROTECTION_CANDIDATE,
  LocalFirstSecurityError,
} from "@/lib/local-first/security/types";

export function isCompleteProtection(label: string): boolean {
  return label === LJD_FILE_PROTECTION_CANDIDATE;
}

export async function applyCompleteFileProtection(
  path: string,
): Promise<PathAttributes> {
  if (!Capacitor.isNativePlatform()) {
    throw new LocalFirstSecurityError(
      "native_only",
      "file protection helper is native-only",
    );
  }
  if (!path) {
    throw new LocalFirstSecurityError("path_required", "path required");
  }
  try {
    return await LjdLocalSecurity.setCompleteProtection({ path });
  } catch (error) {
    throw mapSecurityError(error);
  }
}

export async function inspectFileProtection(path: string): Promise<PathAttributes> {
  if (!Capacitor.isNativePlatform()) {
    throw new LocalFirstSecurityError(
      "native_only",
      "file protection inspect is native-only",
    );
  }
  try {
    return await LjdLocalSecurity.inspectPath({ path });
  } catch (error) {
    throw mapSecurityError(error);
  }
}
