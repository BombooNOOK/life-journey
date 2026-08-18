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
  type ClientSaveOperationIntent,
} from "@/lib/journal/clientSaveIntent/types";
import {
  applyPersistPreparedIntentWithExactPayload,
  verifyLoadedExactPayload,
  type ClientSaveExactPayloadRecord,
} from "@/lib/journal/clientSaveIntent/durableExactPayload";
import {
  openNamedEncryptedDatabase,
} from "@/lib/local-first/security";
import { LocalFirstSecurityError } from "@/lib/local-first/security/types";
import { assertClientSaveOperationIntentTransition } from "@/lib/journal/clientSaveIntent/lifecycle";

const CREATE_SQL = `
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
const CREATE_TOMBSTONE_SQL = `
CREATE TABLE IF NOT EXISTS client_save_operation_deletion_tombstone (
  actor_key TEXT PRIMARY KEY NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);`;
const CREATE_PAYLOAD_SQL = `
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

function assertNative(): void {
  if (!Capacitor.isNativePlatform()) {
    throw new LocalFirstSecurityError(
      "native_only",
      "client save intent storage has no browser fallback",
    );
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

async function withDb<T>(fn: (db: SQLiteDBConnection) => Promise<T>): Promise<T> {
  const db = await openNamedEncryptedDatabase(
    CLIENT_SAVE_OPERATION_INTENT_DB_NAME,
    CLIENT_SAVE_OPERATION_INTENT_SCHEMA_VERSION,
  );
  try {
    await ensureSchema(db);
    await db.execute("PRAGMA foreign_keys = ON");
    return await fn(db);
  } finally {
    await db.close();
  }
}

async function withTransaction<T>(
  db: SQLiteDBConnection,
  fn: () => Promise<T>,
): Promise<T> {
  await db.execute("BEGIN");
  try {
    const result = await fn();
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

async function ensureSchema(db: SQLiteDBConnection): Promise<void> {
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
    await db.execute(CREATE_SQL);
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

/** Test seam for additive schema migration; production always reaches this via withDb. */
export async function ensureNativeClientSaveOperationIntentSchemaForTest(
  db: {
    query: SQLiteDBConnection["query"];
    execute: (statements: string) => Promise<unknown>;
  },
): Promise<void> {
  await ensureSchema(db as SQLiteDBConnection);
}

/** Opens and validates the versioned SQLCipher schema without changing intent data. */
export async function initializeNativeClientSaveOperationIntentStore(): Promise<void> {
  assertNative();
  await withDb(async () => undefined);
}

async function find(
  db: SQLiteDBConnection,
  saveOperationId: string,
): Promise<ClientSaveOperationIntent | null> {
  const result = await db.query(
    "SELECT * FROM client_save_operation_intent WHERE save_operation_id = ? LIMIT 1",
    [saveOperationId],
  );
  const row = result.values?.[0] as Record<string, unknown> | undefined;
  return row ? mapRow(row) : null;
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

async function findPayload(
  db: SQLiteDBConnection,
  saveOperationId: string,
): Promise<ClientSaveExactPayloadRecord | null> {
  const result = await db.query(
    "SELECT * FROM client_save_operation_payload WHERE save_operation_id = ? LIMIT 1",
    [saveOperationId],
  );
  const row = result.values?.[0] as Record<string, unknown> | undefined;
  return row ? mapPayloadRow(row) : null;
}

async function insertIntentRow(
  db: SQLiteDBConnection,
  intent: ClientSaveOperationIntent,
): Promise<void> {
  await db.run(
    `INSERT INTO client_save_operation_intent (
      intent_id, save_operation_id, actor_key, draft_ref, request_fingerprint,
      status, server_entry_id, failure_code, created_at, updated_at,
      last_attempt_at, completed_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      intent.intentId, intent.saveOperationId, intent.actorKey, intent.draftRef,
      intent.requestFingerprint, intent.status, intent.serverEntryId,
      intent.failureCode, intent.createdAt, intent.updatedAt,
      intent.lastAttemptAt, intent.completedAt,
    ],
  );
}

async function insertPayloadRow(
  db: SQLiteDBConnection,
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

export function createNativeClientSaveOperationIntentStore(): ClientSaveDurableStore {
  assertNative();
  return {
    async findByActorAndSaveOperationId(actorKey, saveOperationId) {
      return withDb(async (db) => {
        const row = await find(db, saveOperationId);
        return row?.actorKey === actorKey ? row : null;
      });
    },
    async tryInsert(intent) {
      return withDb(async (db) => {
        const existing = await find(db, intent.saveOperationId);
        if (existing) return { created: false, intent: existing };
        await insertIntentRow(db, intent);
        return { created: true, intent };
      });
    },
    async update(intent) {
      return withDb(async (db) => {
        const existing = await find(db, intent.saveOperationId);
        if (!existing || existing.actorKey !== intent.actorKey) throw new Error("intent_missing");
        assertClientSaveOperationIntentTransition(existing.status, intent.status);
        await db.run(
          `UPDATE client_save_operation_intent SET
            draft_ref=?, request_fingerprint=?, status=?, server_entry_id=?,
            failure_code=?, updated_at=?, last_attempt_at=?, completed_at=?
           WHERE save_operation_id=? AND actor_key=?`,
          [
            intent.draftRef, intent.requestFingerprint, intent.status,
            intent.serverEntryId, intent.failureCode, intent.updatedAt,
            intent.lastAttemptAt, intent.completedAt, intent.saveOperationId,
            intent.actorKey,
          ],
        );
        const updated = await find(db, intent.saveOperationId);
        if (!updated || updated.actorKey !== intent.actorKey) throw new Error("intent_missing");
        return updated;
      });
    },
    async listRecoverableByActor(actorKey) {
      return withDb(async (db) => {
        const result = await db.query(
          `SELECT * FROM client_save_operation_intent
           WHERE actor_key = ? AND status IN ('prepared','awaiting_result','server_completed','recovery_required')
           ORDER BY created_at ASC`,
          [actorKey],
        );
        return (result.values ?? []).map((row) => mapRow(row as Record<string, unknown>));
      });
    },
    async deleteByActor(actorKey) {
      return withDb(async (db) => {
        return withTransaction(db, async () => {
          await db.run(
            `DELETE FROM client_save_operation_payload
             WHERE save_operation_id IN (
               SELECT save_operation_id FROM client_save_operation_intent WHERE actor_key = ?
             )`,
            [actorKey],
          );
          const result = await db.run(
            "DELETE FROM client_save_operation_intent WHERE actor_key = ?",
            [actorKey],
          );
          return result.changes?.changes ?? 0;
        });
      });
    },
    async getDeletionTombstone(actorKey) {
      return withDb(async (db) => {
        const result = await db.query(
          "SELECT actor_key, created_at, updated_at FROM client_save_operation_deletion_tombstone WHERE actor_key = ? LIMIT 1",
          [actorKey],
        );
        const row = result.values?.[0] as Record<string, unknown> | undefined;
        return row
          ? { actorKey: String(row.actor_key), createdAt: String(row.created_at), updatedAt: String(row.updated_at) }
          : null;
      });
    },
    async writeDeletionTombstone(actorKey, now) {
      await withDb(async (db) => {
        await db.run(
          `INSERT INTO client_save_operation_deletion_tombstone (actor_key, created_at, updated_at)
           VALUES (?, ?, ?)
           ON CONFLICT(actor_key) DO UPDATE SET updated_at=excluded.updated_at`,
          [actorKey, now, now],
        );
      });
    },
    async clearDeletionTombstone(actorKey) {
      await withDb(async (db) => {
        await db.run("DELETE FROM client_save_operation_deletion_tombstone WHERE actor_key = ?", [actorKey]);
      });
    },
    async persistPreparedIntentWithExactPayload(input) {
      return withDb(async (db) => {
        return withTransaction(db, async () =>
          applyPersistPreparedIntentWithExactPayload(
            {
              findIntent: (id) => find(db, id),
              insertIntent: (intent) => insertIntentRow(db, intent),
              findPayload: (id) => findPayload(db, id),
              insertPayload: (row) => insertPayloadRow(db, row),
            },
            input,
          ),
        );
      });
    },
    async loadExactPayloadBySaveOperationId(saveOperationId) {
      return withDb(async (db) => {
        const payload = await findPayload(db, saveOperationId);
        if (!payload) return { kind: "missing" as const };
        const intent = await find(db, saveOperationId);
        return verifyLoadedExactPayload(payload, intent?.requestFingerprint);
      });
    },
  };
}
