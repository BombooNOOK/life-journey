/**
 * Shared SQLCipher-compatible intent+payload store operations.
 *
 * Native production uses Capacitor SQLCipher. Simulator-safe Node tests use a
 * file-backed encrypted SQLite analogue. Both go through this module so
 * durability is not proven by copying memory Maps.
 */

import {
  CLIENT_SAVE_OPERATION_INTENT_SCHEMA_VERSION,
  type ClientSaveDurableStore,
  type ClientSaveOperationIntent,
} from "@/lib/journal/clientSaveIntent/types";
import { assertClientSaveOperationIntentTransition } from "@/lib/journal/clientSaveIntent/lifecycle";
import {
  applyDeleteExactPayloadIfCompleted,
  applyPersistPreparedIntentWithExactPayload,
  verifyLoadedExactPayload,
  type ClientSaveExactPayloadRecord,
  type DeleteExactPayloadResult,
} from "@/lib/journal/clientSaveIntent/durableExactPayload";

export const CREATE_INTENT_SQL = `
CREATE TABLE IF NOT EXISTS client_save_operation_intent (
  intent_id TEXT PRIMARY KEY NOT NULL,
  save_operation_id TEXT NOT NULL UNIQUE,
  actor_key TEXT NOT NULL,
  draft_ref TEXT,
  request_fingerprint TEXT NOT NULL,
  status TEXT NOT NULL,
  server_entry_id TEXT,
  failure_code TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_attempt_at TEXT,
  completed_at TEXT
);`;

export const CREATE_TOMBSTONE_SQL = `
CREATE TABLE IF NOT EXISTS client_save_operation_deletion_tombstone (
  actor_key TEXT PRIMARY KEY NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);`;

export const CREATE_PAYLOAD_SQL = `
CREATE TABLE IF NOT EXISTS client_save_operation_payload (
  save_operation_id TEXT PRIMARY KEY NOT NULL,
  payload_version INTEGER NOT NULL,
  request_json TEXT NOT NULL,
  request_fingerprint TEXT NOT NULL,
  request_byte_length INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (save_operation_id) REFERENCES client_save_operation_intent(save_operation_id)
);`;

const REQUIRED_COLUMNS = [
  "intent_id",
  "save_operation_id",
  "actor_key",
  "draft_ref",
  "request_fingerprint",
  "status",
  "server_entry_id",
  "failure_code",
  "created_at",
  "updated_at",
  "last_attempt_at",
  "completed_at",
] as const;

const REQUIRED_PAYLOAD_COLUMNS = [
  "save_operation_id",
  "payload_version",
  "request_json",
  "request_fingerprint",
  "request_byte_length",
  "created_at",
] as const;

export type ClientSaveIntentSqlRunResult = { changes?: { changes: number } };

/**
 * Capacitor Community SQLite 8.1.1 wraps `execute()` / `run()` in
 * `BEGIN TRANSACTION` when the `transaction` argument is omitted (default true).
 * Native adapters must therefore drive atomic work through plugin
 * begin/commit/rollback and `run(..., transaction=false)` — never SQL BEGIN
 * via `execute("BEGIN")`, which nests and fails with
 * "cannot start a transaction within a transaction".
 */
export type ClientSaveIntentNativeTransactionApi = {
  begin(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  run(sql: string, params?: unknown[]): Promise<ClientSaveIntentSqlRunResult>;
};

export type ClientSaveIntentSqlConnection = {
  query(sql: string, params?: unknown[]): Promise<{ values?: Record<string, unknown>[] }>;
  run(sql: string, params?: unknown[]): Promise<ClientSaveIntentSqlRunResult>;
  execute(statements: string): Promise<unknown>;
  nativeTransaction?: ClientSaveIntentNativeTransactionApi;
};

export type ClientSaveIntentSqlSession = {
  withDb<T>(fn: (db: ClientSaveIntentSqlConnection) => Promise<T>): Promise<T>;
};

export async function ensureClientSaveIntentSchema(
  db: Pick<ClientSaveIntentSqlConnection, "query" | "execute">,
): Promise<void> {
  const versionResult = await db.query("PRAGMA user_version");
  const version = Number(versionResult.values?.[0]?.user_version ?? -1);
  if (version === 0) {
    const existing = await db.query(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1",
      ["client_save_operation_intent"],
    );
    if (existing.values?.length) {
      throw new Error("intent_schema_partial_or_unversioned");
    }
    await db.execute(CREATE_INTENT_SQL);
    await db.execute(CREATE_TOMBSTONE_SQL);
    await db.execute(CREATE_PAYLOAD_SQL);
    await db.execute(`PRAGMA user_version = ${CLIENT_SAVE_OPERATION_INTENT_SCHEMA_VERSION}`);
    return;
  }
  if (version === 1) {
    await db.execute(CREATE_TOMBSTONE_SQL);
    await db.execute(CREATE_PAYLOAD_SQL);
    await db.execute(`PRAGMA user_version = ${CLIENT_SAVE_OPERATION_INTENT_SCHEMA_VERSION}`);
  } else if (version === 2) {
    await db.execute(CREATE_PAYLOAD_SQL);
    await db.execute(`PRAGMA user_version = ${CLIENT_SAVE_OPERATION_INTENT_SCHEMA_VERSION}`);
  } else if (version !== CLIENT_SAVE_OPERATION_INTENT_SCHEMA_VERSION) {
    throw new Error("intent_schema_version_unsupported");
  }
  const columns = await db.query("PRAGMA table_info(client_save_operation_intent)");
  const names = new Set(
    (columns.values ?? []).map((column) => String((column as Record<string, unknown>).name)),
  );
  if (REQUIRED_COLUMNS.some((column) => !names.has(column))) {
    throw new Error("intent_schema_columns_invalid");
  }
  const payloadColumns = await db.query("PRAGMA table_info(client_save_operation_payload)");
  const payloadNames = new Set(
    (payloadColumns.values ?? []).map((column) =>
      String((column as Record<string, unknown>).name),
    ),
  );
  if (REQUIRED_PAYLOAD_COLUMNS.some((column) => !payloadNames.has(column))) {
    throw new Error("intent_schema_columns_invalid");
  }
}

async function withTransaction<T>(
  db: ClientSaveIntentSqlConnection,
  fn: (tx: ClientSaveIntentSqlConnection) => Promise<T>,
): Promise<T> {
  if (db.nativeTransaction) {
    await db.nativeTransaction.begin();
    const tx: ClientSaveIntentSqlConnection = {
      query: (sql, params) => db.query(sql, params),
      run: (sql, params) => db.nativeTransaction!.run(sql, params),
      execute: () => {
        throw new Error("execute_not_allowed_inside_native_transaction");
      },
      nativeTransaction: db.nativeTransaction,
    };
    try {
      const result = await fn(tx);
      await db.nativeTransaction.commit();
      return result;
    } catch (error) {
      try {
        await db.nativeTransaction.rollback();
      } catch {
        // Keep the original persist/load failure.
      }
      throw error;
    }
  }
  await db.execute("BEGIN");
  try {
    const result = await fn(db);
    await db.execute("COMMIT");
    return result;
  } catch (error) {
    try {
      await db.execute("ROLLBACK");
    } catch {
      // Keep the original persist/load failure.
    }
    throw error;
  }
}

function mapRow(row: Record<string, unknown>): ClientSaveOperationIntent {
  return {
    intentId: String(row.intent_id),
    saveOperationId: String(row.save_operation_id),
    actorKey: String(row.actor_key),
    draftRef: row.draft_ref == null ? null : String(row.draft_ref),
    requestFingerprint: String(row.request_fingerprint),
    status: String(row.status) as ClientSaveOperationIntent["status"],
    serverEntryId: row.server_entry_id == null ? null : String(row.server_entry_id),
    failureCode: (row.failure_code == null
      ? null
      : String(row.failure_code)) as ClientSaveOperationIntent["failureCode"],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    lastAttemptAt: row.last_attempt_at == null ? null : String(row.last_attempt_at),
    completedAt: row.completed_at == null ? null : String(row.completed_at),
  };
}

function mapPayloadRow(row: Record<string, unknown>): ClientSaveExactPayloadRecord {
  return {
    saveOperationId: String(row.save_operation_id),
    payloadVersion: 1,
    requestJson: String(row.request_json),
    requestFingerprint: String(row.request_fingerprint),
    requestByteLength: Number(row.request_byte_length),
    createdAt: String(row.created_at),
  };
}

async function findIntent(
  db: ClientSaveIntentSqlConnection,
  saveOperationId: string,
): Promise<ClientSaveOperationIntent | null> {
  const result = await db.query(
    "SELECT * FROM client_save_operation_intent WHERE save_operation_id = ? LIMIT 1",
    [saveOperationId],
  );
  const row = result.values?.[0];
  return row ? mapRow(row) : null;
}

async function findPayload(
  db: ClientSaveIntentSqlConnection,
  saveOperationId: string,
): Promise<ClientSaveExactPayloadRecord | null> {
  const result = await db.query(
    "SELECT * FROM client_save_operation_payload WHERE save_operation_id = ? LIMIT 1",
    [saveOperationId],
  );
  const row = result.values?.[0];
  return row ? mapPayloadRow(row) : null;
}

async function insertIntentRow(
  db: ClientSaveIntentSqlConnection,
  intent: ClientSaveOperationIntent,
): Promise<void> {
  await db.run(
    `INSERT INTO client_save_operation_intent (
      intent_id, save_operation_id, actor_key, draft_ref, request_fingerprint,
      status, server_entry_id, failure_code, created_at, updated_at,
      last_attempt_at, completed_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      intent.intentId,
      intent.saveOperationId,
      intent.actorKey,
      intent.draftRef,
      intent.requestFingerprint,
      intent.status,
      intent.serverEntryId,
      intent.failureCode,
      intent.createdAt,
      intent.updatedAt,
      intent.lastAttemptAt,
      intent.completedAt,
    ],
  );
}

async function insertPayloadRow(
  db: ClientSaveIntentSqlConnection,
  row: ClientSaveExactPayloadRecord,
): Promise<void> {
  await db.run(
    `INSERT INTO client_save_operation_payload (
      save_operation_id, payload_version, request_json, request_fingerprint,
      request_byte_length, created_at
    ) VALUES (?,?,?,?,?,?)`,
    [
      row.saveOperationId,
      row.payloadVersion,
      row.requestJson,
      row.requestFingerprint,
      row.requestByteLength,
      row.createdAt,
    ],
  );
}

async function deletePayloadRow(
  db: ClientSaveIntentSqlConnection,
  saveOperationId: string,
): Promise<void> {
  await db.run("DELETE FROM client_save_operation_payload WHERE save_operation_id = ?", [
    saveOperationId,
  ]);
}

export function createClientSaveDurableStoreFromSql(
  session: ClientSaveIntentSqlSession,
): ClientSaveDurableStore {
  const store: ClientSaveDurableStore = {
    async findByActorAndSaveOperationId(actorKey, saveOperationId) {
      return session.withDb(async (db) => {
        const row = await findIntent(db, saveOperationId);
        return row?.actorKey === actorKey ? row : null;
      });
    },
    async tryInsert(intent) {
      return session.withDb(async (db) => {
        const existing = await findIntent(db, intent.saveOperationId);
        if (existing) return { created: false, intent: existing };
        await insertIntentRow(db, intent);
        return { created: true, intent };
      });
    },
    async update(intent) {
      return session.withDb(async (db) => {
        const existing = await findIntent(db, intent.saveOperationId);
        if (!existing || existing.actorKey !== intent.actorKey) throw new Error("intent_missing");
        assertClientSaveOperationIntentTransition(existing.status, intent.status);
        await db.run(
          `UPDATE client_save_operation_intent SET
            draft_ref=?, request_fingerprint=?, status=?, server_entry_id=?,
            failure_code=?, updated_at=?, last_attempt_at=?, completed_at=?
           WHERE save_operation_id=? AND actor_key=?`,
          [
            intent.draftRef,
            intent.requestFingerprint,
            intent.status,
            intent.serverEntryId,
            intent.failureCode,
            intent.updatedAt,
            intent.lastAttemptAt,
            intent.completedAt,
            intent.saveOperationId,
            intent.actorKey,
          ],
        );
        const updated = await findIntent(db, intent.saveOperationId);
        if (!updated || updated.actorKey !== intent.actorKey) throw new Error("intent_missing");
        return updated;
      });
    },
    async listRecoverableByActor(actorKey) {
      return session.withDb(async (db) => {
        const result = await db.query(
          `SELECT * FROM client_save_operation_intent
           WHERE actor_key = ? AND status IN ('prepared','awaiting_result','server_completed','recovery_required')
           ORDER BY created_at ASC`,
          [actorKey],
        );
        return (result.values ?? []).map((row) => mapRow(row));
      });
    },
    async deleteByActor(actorKey) {
      return session.withDb(async (db) => {
        return withTransaction(db, async (tx) => {
          await tx.run(
            `DELETE FROM client_save_operation_payload
             WHERE save_operation_id IN (
               SELECT save_operation_id FROM client_save_operation_intent WHERE actor_key = ?
             )`,
            [actorKey],
          );
          const result = await tx.run(
            "DELETE FROM client_save_operation_intent WHERE actor_key = ?",
            [actorKey],
          );
          return result.changes?.changes ?? 0;
        });
      });
    },
    async getDeletionTombstone(actorKey) {
      return session.withDb(async (db) => {
        const result = await db.query(
          "SELECT actor_key, created_at, updated_at FROM client_save_operation_deletion_tombstone WHERE actor_key = ? LIMIT 1",
          [actorKey],
        );
        const row = result.values?.[0];
        return row
          ? {
              actorKey: String(row.actor_key),
              createdAt: String(row.created_at),
              updatedAt: String(row.updated_at),
            }
          : null;
      });
    },
    async writeDeletionTombstone(actorKey, now) {
      await session.withDb(async (db) => {
        await db.run(
          `INSERT INTO client_save_operation_deletion_tombstone (actor_key, created_at, updated_at)
           VALUES (?, ?, ?)
           ON CONFLICT(actor_key) DO UPDATE SET updated_at=excluded.updated_at`,
          [actorKey, now, now],
        );
      });
    },
    async clearDeletionTombstone(actorKey) {
      await session.withDb(async (db) => {
        await db.run("DELETE FROM client_save_operation_deletion_tombstone WHERE actor_key = ?", [
          actorKey,
        ]);
      });
    },
    async persistPreparedIntentWithExactPayload(input) {
      return session.withDb(async (db) => {
        return withTransaction(db, async (tx) =>
          applyPersistPreparedIntentWithExactPayload(
            {
              findIntent: (id) => findIntent(tx, id),
              insertIntent: (intent) => insertIntentRow(tx, intent),
              findPayload: (id) => findPayload(tx, id),
              insertPayload: (row) => insertPayloadRow(tx, row),
            },
            input,
          ),
        );
      });
    },
    async loadExactPayloadBySaveOperationId(saveOperationId) {
      return session.withDb(async (db) => {
        const payload = await findPayload(db, saveOperationId);
        if (!payload) return { kind: "missing" as const };
        const intent = await findIntent(db, saveOperationId);
        return verifyLoadedExactPayload(payload, intent?.requestFingerprint);
      });
    },
    async deleteExactPayloadBySaveOperationId(input) {
      return session.withDb(async (db) => {
        return withTransaction(db, async (tx) =>
          applyDeleteExactPayloadIfCompleted(
            {
              findIntent: (id) => findIntent(tx, id),
              findPayload: (id) => findPayload(tx, id),
              deletePayload: (id) => deletePayloadRow(tx, id),
            },
            input,
          ),
        );
      });
    },
    async cleanupCompletedExactPayloadsForActor(actorKey) {
      const ids = await session.withDb(async (db) => {
        const result = await db.query(
          `SELECT p.save_operation_id AS save_operation_id
           FROM client_save_operation_payload p
           INNER JOIN client_save_operation_intent i
             ON i.save_operation_id = p.save_operation_id
           WHERE i.actor_key = ? AND i.status = 'completed' AND i.server_entry_id IS NOT NULL`,
          [actorKey],
        );
        return (result.values ?? []).map((row) => String(row.save_operation_id));
      });
      let deleted = 0;
      const results: DeleteExactPayloadResult[] = [];
      for (const saveOperationId of ids) {
        const result = await store.deleteExactPayloadBySaveOperationId({
          actorKey,
          saveOperationId,
        });
        results.push(result);
        if (result.kind === "deleted") deleted += 1;
      }
      return { attempted: ids.length, deleted, results };
    },
  };
  return store;
}
