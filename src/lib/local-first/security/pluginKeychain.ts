/**
 * Read-only inspection of Capacitor SQLite built-in Keychain item.
 * Does not read secret bytes. DB key path is setEncryptionSecret → plugin Keychain.
 */

import { Capacitor } from "@capacitor/core";
import { LjdLocalSecurity } from "ljd-local-security";

import { mapSecurityError } from "@/lib/local-first/security/securityErrorMapping";
import {
  LJD_PLUGIN_KEYCHAIN_ACCESSIBILITY_MEASURED,
  LJD_PLUGIN_KEYCHAIN_ACCOUNT,
  LJD_PLUGIN_KEYCHAIN_SERVICE,
  LocalFirstSecurityError,
} from "@/lib/local-first/security/types";

export async function inspectPluginDbKeyAccessibility(): Promise<{
  found: boolean;
  accessibility: string | null;
  matchesWhenUnlocked: boolean;
  returnedSecretData: false;
}> {
  if (!Capacitor.isNativePlatform()) {
    throw new LocalFirstSecurityError(
      "native_only",
      "plugin Keychain inspect is native-only",
    );
  }
  try {
    const result = await LjdLocalSecurity.inspectGenericPasswordAccessibility({
      service: LJD_PLUGIN_KEYCHAIN_SERVICE,
      account: LJD_PLUGIN_KEYCHAIN_ACCOUNT,
    });
    return {
      found: result.found,
      accessibility: result.accessibility,
      matchesWhenUnlocked:
        result.found &&
        result.accessibility === LJD_PLUGIN_KEYCHAIN_ACCESSIBILITY_MEASURED,
      returnedSecretData: false,
    };
  } catch (error) {
    throw mapSecurityError(error);
  }
}
