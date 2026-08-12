/**
 * Application Support / LJD directory resolution.
 * Absolute paths come from FileManager at runtime — never hardcode them.
 */

import { Capacitor } from "@capacitor/core";
import {
  LjdLocalSecurity,
  type ApplicationSupportLjdDirResult,
} from "ljd-local-security";

import { mapSecurityError } from "@/lib/local-first/security/securityErrorMapping";
import {
  LJD_IOS_DATABASE_RELATIVE_LOCATION,
  LocalFirstSecurityError,
} from "@/lib/local-first/security/types";

export function pluginRelativeLocationForBundleId(bundleId: string): string {
  return `Library/Application Support/${bundleId}`;
}

export function isConfiguredRelativeLocation(relative: string): boolean {
  return relative === LJD_IOS_DATABASE_RELATIVE_LOCATION;
}

export async function resolveLjdApplicationSupportDir(): Promise<ApplicationSupportLjdDirResult> {
  if (!Capacitor.isNativePlatform()) {
    throw new LocalFirstSecurityError(
      "native_only",
      "Application Support resolve is native-only",
    );
  }
  try {
    return await LjdLocalSecurity.resolveApplicationSupportLjdDir();
  } catch (error) {
    throw mapSecurityError(error);
  }
}
