/**
 * Encrypted SQLite open capability (SQLCipher via community plugin).
 *
 * Designed path: setEncryptionSecret → plugin Keychain (WhenUnlocked measured)
 * → createConnection(encrypted, mode "secret").
 *
 * 4B-3E does NOT:
 * - call this from app boot
 * - encrypt ljd_local_journal
 * - auto-migrate plaintext → encrypted
 */

import { Capacitor } from "@capacitor/core";
import {
  CapacitorSQLite,
  SQLiteConnection,
  type SQLiteDBConnection,
} from "@capacitor-community/sqlite";

import { LOCAL_JOURNAL_DB_NAME } from "@/lib/local-first/journal/types";
import { mapSecurityError } from "@/lib/local-first/security/securityErrorMapping";
import {
  LJD_SQLITE_ENCRYPTION_MODE,
  LocalFirstSecurityError,
} from "@/lib/local-first/security/types";

export type PluginSecretConfigurationFailure =
  | "api_unavailable"
  | "encryption_not_configured"
  | "database_location_unavailable"
  | "keychain_write_failed"
  | "unknown";

/** Safe classification only; the native error text and secret never escape. */
export class PluginSecretConfigurationError extends Error {
  readonly reason: PluginSecretConfigurationFailure;
  constructor(reason: PluginSecretConfigurationFailure) {
    super(`plugin_secret_configuration_${reason}`);
    this.name = "PluginSecretConfigurationError";
    this.reason = reason;
  }
}

function classifyPluginSecretConfigurationFailure(
  error: unknown,
): PluginSecretConfigurationFailure {
  const message = error instanceof Error ? error.message : String(error);
  if (/not implemented|unimplemented|method.*not.*found/i.test(message)) {
    return "api_unavailable";
  }
  if (/no encryption set/i.test(message)) return "encryption_not_configured";
  if (/no database folder|getdatabasesurl|database location/i.test(message)) {
    return "database_location_unavailable";
  }
  if (/keychain|secitem|security service|errsec/i.test(message)) {
    return "keychain_write_failed";
  }
  return "unknown";
}

function assertNotProductionJournal(name: string): void {
  if (name === LOCAL_JOURNAL_DB_NAME) {
    throw new LocalFirstSecurityError(
      "journal_encryption_forbidden",
      "ljd_local_journal must not be opened encrypted in 4B-3E; plaintext→encrypted migration is a later phase",
    );
  }
}

/**
 * Explicit opt-in. Never call from general user / Web paths.
 * Passphrase is not logged.
 */
export async function configurePluginEncryptionSecret(
  passphrase: string,
): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    throw new LocalFirstSecurityError(
      "native_only",
      "encryption secret configure is native-only",
    );
  }
  if (!passphrase) {
    throw new LocalFirstSecurityError("unknown", "passphrase required");
  }
  try {
    await CapacitorSQLite.setEncryptionSecret({ passphrase });
  } catch (error) {
    throw new PluginSecretConfigurationError(classifyPluginSecretConfigurationFailure(error));
  }
}

/** Checks the plugin's own Keychain state without returning the secret. */
export async function isPluginEncryptionSecretStored(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    throw new LocalFirstSecurityError(
      "native_only",
      "encryption secret inspection is native-only",
    );
  }
  try {
    return (await CapacitorSQLite.isSecretStored()).result === true;
  } catch (error) {
    throw mapSecurityError(error);
  }
}

/**
 * Native diagnostic only: asks the plugin to compare an in-memory candidate.
 * It does not write, replace, or return any Keychain material.
 */
export async function pluginRejectsDifferentEncryptionSecret(
  candidate: string,
): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    throw new LocalFirstSecurityError(
      "native_only",
      "encryption secret comparison is native-only",
    );
  }
  if (!candidate) {
    throw new LocalFirstSecurityError("unknown", "candidate required");
  }
  try {
    return (await CapacitorSQLite.checkEncryptionSecret({ passphrase: candidate })).result !== true;
  } catch (error) {
    throw mapSecurityError(error);
  }
}

export async function openNamedEncryptedDatabase(
  name: string,
  version = 1,
): Promise<SQLiteDBConnection> {
  assertNotProductionJournal(name);
  if (!Capacitor.isNativePlatform()) {
    throw new LocalFirstSecurityError(
      "native_only",
      "encrypted DB open is native-only",
    );
  }
  try {
    const sqlite = new SQLiteConnection(CapacitorSQLite);
    try {
      await sqlite.checkConnectionsConsistency();
    } catch {
      /* */
    }
    if ((await sqlite.isConnection(name, false)).result) {
      await sqlite.closeConnection(name, false);
    }
    const db = await sqlite.createConnection(
      name,
      true,
      LJD_SQLITE_ENCRYPTION_MODE,
      version,
      false,
    );
    await db.open();
    return db;
  } catch (error) {
    throw mapSecurityError(error);
  }
}
