/**
 * Local-first storage-security types.
 * No secrets, no PoC dummy payloads.
 */

export type TriStateBool = boolean | "unset" | "api_unavailable";

export type FileProtectionLabel =
  | "NSFileProtectionComplete"
  | "NSFileProtectionCompleteUnlessOpen"
  | "NSFileProtectionCompleteUntilFirstUserAuthentication"
  | "NSFileProtectionNone"
  | "unset"
  | "api_unavailable"
  | string;

export type SecurityErrorCode =
  | "native_only"
  | "path_required"
  | "journal_encryption_forbidden"
  | "secret_in_log"
  | "bridge_unimplemented"
  | "unknown";

export class LocalFirstSecurityError extends Error {
  readonly code: SecurityErrorCode;
  constructor(code: SecurityErrorCode, message: string) {
    super(message);
    this.name = "LocalFirstSecurityError";
    this.code = code;
  }
}

export type BackupInclusionTiming =
  | "after_directory_create"
  | "on_db_init"
  | "on_every_launch";

export const LJD_FILE_PROTECTION_CANDIDATE = "NSFileProtectionComplete" as const;

export const LJD_PLUGIN_KEYCHAIN_SERVICE = "unlockSecret" as const;
export const LJD_PLUGIN_KEYCHAIN_ACCOUNT = "ljd_CapacitorSQLitePlugin" as const;
export const LJD_PLUGIN_KEYCHAIN_ACCESSIBILITY_MEASURED =
  "kSecAttrAccessibleWhenUnlocked" as const;

export const LJD_SQLITE_ENCRYPTION_MODE = "secret" as const;

/** Relative sqlite location matching FileManager Application Support / bundleId. */
export const LJD_IOS_DATABASE_RELATIVE_LOCATION =
  "Library/Application Support/app.bamboonook.ljd" as const;
