/**
 * Encrypted SQLite open capability (SQLCipher via community plugin).
 *
 * Designed path: setEncryptionSecret → plugin Keychain (WhenUnlocked measured)
 * → createConnection(encrypted, mode "secret").
 *
 * Must not:
 * - call this from app boot
 * - encrypt ljd_local_journal (4B-3F fixture names only)
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
      "ljd_local_journal must not be opened encrypted; 4B-3F fixture names only",
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

/** Reuse plugin Keychain secret when already present (no secret proliferation). */
export async function ensurePluginEncryptionSecret(
  passphrase: string,
): Promise<"set" | "reused_existing"> {
  const stored = await isPluginEncryptionSecretStored();
  if (!shouldSetPluginEncryptionSecret(stored)) return "reused_existing";
  await configurePluginEncryptionSecret(passphrase);
  return "set";
}

/**
 * Wrong-key / wrong-mode probe: plaintext open of an encrypted DB must fail.
 * Does not log body or passphrase.
 */
export async function plaintextOpenMustFail(name: string): Promise<boolean> {
  assertNotProductionJournal(name);
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
      false,
      "no-encryption",
      1,
      false,
    );
    await db.open();
    await sqlite.closeConnection(name, false);
    return false;
  } catch {
    return true;
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
