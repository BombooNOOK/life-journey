/**
 * Plain (non-SQLCipher) SQLite open for metadata registry PoC.
 * Separate from journal encrypted open path.
 */

import { Capacitor } from "@capacitor/core";
import {
  CapacitorSQLite,
  SQLiteConnection,
  type SQLiteDBConnection,
} from "@capacitor-community/sqlite";

import { LOCAL_JOURNAL_DB_NAME } from "@/lib/local-first/journal/types";
import { mapSecurityError } from "@/lib/local-first/security/securityErrorMapping";
import { LocalFirstSecurityError } from "@/lib/local-first/security/types";

function assertNotProductionJournal(name: string): void {
  if (name === LOCAL_JOURNAL_DB_NAME) {
    throw new LocalFirstSecurityError(
      "journal_encryption_forbidden",
      "ljd_local_journal must not be used for registry metadata DB",
    );
  }
}

export async function closeNamedPlainDatabase(name: string): Promise<void> {
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

export async function openNamedPlainDatabase(
  name: string,
  version = 1,
): Promise<SQLiteDBConnection> {
  assertNotProductionJournal(name);
  if (!Capacitor.isNativePlatform()) {
    throw new LocalFirstSecurityError("native_only", "plain registry DB is native-only");
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
      false,
      "no-encryption",
      version,
      false,
    );
    await db.open();
    return db;
  } catch (error) {
    throw mapSecurityError(error);
  }
}
