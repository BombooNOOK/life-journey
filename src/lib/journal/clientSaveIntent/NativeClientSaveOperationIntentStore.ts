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
  type ClientSaveOperationIntent,
  type ClientSaveOperationIntentStore,
} from "@/lib/journal/clientSaveIntent/types";
import {
  openNamedEncryptedDatabase,
} from "@/lib/local-first/security";
import { LocalFirstSecurityError } from "@/lib/local-first/security/types";

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
    await db.execute(CREATE_SQL);
    return await fn(db);
  } finally {
    await db.close();
  }
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

export function createNativeClientSaveOperationIntentStore(): ClientSaveOperationIntentStore {
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
        return { created: true, intent };
      });
    },
    async update(intent) {
      return withDb(async (db) => {
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
        const result = await db.run(
          "DELETE FROM client_save_operation_intent WHERE actor_key = ?",
          [actorKey],
        );
        return result.changes?.changes ?? 0;
      });
    },
  };
}
