/**
 * Local-first Security Foundation public surface.
 * Explicit-call only. Not imported by Web あしあと / Neon / 森ログ / album / どんぐり.
 */

export {
  BACKUP_INCLUSION_POLICY,
  ensurePathIncludedInBackup,
  shouldForceBackupInclusion,
} from "@/lib/local-first/security/backupInclusion";
export {
  configurePluginEncryptionSecret,
  ensurePluginEncryptionSecret,
  openNamedEncryptedDatabase,
} from "@/lib/local-first/security/encryptedDatabase";
export {
  applyCompleteFileProtection,
  inspectFileProtection,
  isCompleteProtection,
} from "@/lib/local-first/security/fileProtection";
export {
  protectLifeRecordMediaRelative,
  resolveLibraryRelativeUri,
} from "@/lib/local-first/security/mediaProtection";
export {
  assertNoSecretInText,
  redactSecretLike,
  safeErrorMessage,
} from "@/lib/local-first/security/noSecretLog";
export { inspectPluginDbKeyAccessibility } from "@/lib/local-first/security/pluginKeychain";
export { mapSecurityError } from "@/lib/local-first/security/securityErrorMapping";
export {
  isConfiguredRelativeLocation,
  pluginRelativeLocationForBundleId,
  resolveLjdApplicationSupportDir,
} from "@/lib/local-first/security/storageLocation";
export {
  getVolumeAvailableCapacity,
  readAvailableBytesOrNull,
} from "@/lib/local-first/security/volumeCapacity";
export {
  LJD_FILE_PROTECTION_CANDIDATE,
  LJD_IOS_DATABASE_RELATIVE_LOCATION,
  LJD_PLUGIN_KEYCHAIN_ACCESSIBILITY_MEASURED,
  LJD_PLUGIN_KEYCHAIN_ACCOUNT,
  LJD_PLUGIN_KEYCHAIN_SERVICE,
  LJD_SQLITE_ENCRYPTION_MODE,
  LocalFirstSecurityError,
} from "@/lib/local-first/security/types";
