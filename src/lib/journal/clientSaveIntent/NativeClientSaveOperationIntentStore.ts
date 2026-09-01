/**
 * Native-only SQLCipher storage for client save intent metadata.
 *
 * The app must explicitly configure the existing Keychain-backed encryption
 * secret before opening this store. Web deliberately has no localStorage or
 * sessionStorage fallback because that would violate the durable/encrypted
 * storage requirement.
 */

import { Capacitor } from "@capacitor/core";
import type { SQLiteDBConnection } from "@capacitor-community/sqlite";

import {
  CLIENT_SAVE_OPERATION_INTENT_DB_NAME,
  CLIENT_SAVE_OPERATION_INTENT_SCHEMA_VERSION,
  type ClientSaveDurableStore,
} from "@/lib/journal/clientSaveIntent/types";
import {
  createClientSaveDurableStoreFromSql,
  ensureClientSaveIntentSchema,
  type ClientSaveIntentSqlConnection,
} from "@/lib/journal/clientSaveIntent/clientSaveIntentSqlStore";
import { openNamedEncryptedDatabase } from "@/lib/local-first/security";
import { LocalFirstSecurityError } from "@/lib/local-first/security/types";

function assertNative(): void {
  if (!Capacitor.isNativePlatform()) {
    throw new LocalFirstSecurityError(
      "native_only",
      "client save intent storage has no browser fallback",
    );
  }
}

/**
 * Capacitor SQLite 8.1.1 `execute`/`run` default `transaction=true` and issue
 * `BEGIN TRANSACTION` before the caller's SQL. Atomic intent+payload persist
 * therefore uses `beginTransaction` / `commitTransaction` / `rollbackTransaction`
 * plus `run(..., false)` — never `execute("BEGIN")`.
 */
function adaptNativeConnection(db: SQLiteDBConnection): ClientSaveIntentSqlConnection {
  return {
    query: (sql, params) => db.query(sql, params),
    run: async (sql, params = []) => {
      const result = await db.run(sql, params);
      return { changes: { changes: Number(result.changes?.changes ?? 0) } };
    },
    execute: (statements) => db.execute(statements),
    nativeTransaction: {
      begin: async () => {
        await db.beginTransaction();
      },
      commit: async () => {
        await db.commitTransaction();
      },
      rollback: async () => {
        await db.rollbackTransaction();
      },
      run: async (sql, params = []) => {
        const result = await db.run(sql, params, false);
        return { changes: { changes: Number(result.changes?.changes ?? 0) } };
      },
    },
  };
}

async function withNativeEncryptedDb<T>(
  fn: (db: ClientSaveIntentSqlConnection) => Promise<T>,
): Promise<T> {
  const native = await openNamedEncryptedDatabase(
    CLIENT_SAVE_OPERATION_INTENT_DB_NAME,
    CLIENT_SAVE_OPERATION_INTENT_SCHEMA_VERSION,
  );
  try {
    const db = adaptNativeConnection(native);
    await ensureClientSaveIntentSchema(db);
    await db.execute("PRAGMA foreign_keys = ON");
    return await fn(db);
  } finally {
    await native.close();
  }
}

/** Test seam for additive schema migration; production always reaches this via withDb. */
export async function ensureNativeClientSaveOperationIntentSchemaForTest(
  db: {
    query: SQLiteDBConnection["query"];
    execute: (statements: string) => Promise<unknown>;
  },
): Promise<void> {
  await ensureClientSaveIntentSchema(db as ClientSaveIntentSqlConnection);
}

/** Opens and validates the versioned SQLCipher schema without changing intent data. */
export async function initializeNativeClientSaveOperationIntentStore(): Promise<void> {
  assertNative();
  await withNativeEncryptedDb(async () => undefined);
}

export function createNativeClientSaveOperationIntentStore(): ClientSaveDurableStore {
  assertNative();
  return createClientSaveDurableStoreFromSql({
    withDb: withNativeEncryptedDb,
  });
}
