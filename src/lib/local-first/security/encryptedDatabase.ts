/**
 * Encrypted SQLite open capability (SQLCipher via community plugin).
 *
 * Designed path: setEncryptionSecret → plugin Keychain (WhenUnlocked measured)
 * → createConnection(encrypted, mode "secret").
 *
 * Must not:
 * - call this from app boot
 * - encrypt ljd_local_journal (active production name)
 * - auto-migrate plaintext production journal
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

function assertNotProductionJournal(name: string): void {
  if (name === LOCAL_JOURNAL_DB_NAME) {
    throw new LocalFirstSecurityError(
      "journal_encryption_forbidden",
      "ljd_local_journal must not be opened encrypted; use a non-active candidate name",
    );
  }
}

export function shouldSetPluginEncryptionSecret(alreadyStored: boolean): boolean {
  return !alreadyStored;
}

export async function isPluginEncryptionSecretStored(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    return Boolean((await CapacitorSQLite.isSecretStored()).result);
  } catch {
    return false;
  }
}

/**
 * Explicit opt-in. Never call from general user / Web paths.
 * Passphrase is not logged. Does not create a second Keychain secret.
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
    throw mapSecurityError(error);
  }
}

export async function ensurePluginEncryptionSecret(
  passphrase: string,
): Promise<"set" | "reused_existing"> {
  const stored = await isPluginEncryptionSecretStored();
  if (!shouldSetPluginEncryptionSecret(stored)) return "reused_existing";
  await configurePluginEncryptionSecret(passphrase);
  return "set";
}

export async function closeNamedEncryptedDatabase(name: string): Promise<void> {
  assertNotProductionJournal(name);
  try {
    const sqlite = new SQLiteConnection(CapacitorSQLite);
    if ((await sqlite.isConnection(name, false)).result) {
      await sqlite.closeConnection(name, false);
    }
  } catch {
    try {
      await CapacitorSQLite.closeConnection({ database: name, readonly: false });
    } catch {
      /* */
    }
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
