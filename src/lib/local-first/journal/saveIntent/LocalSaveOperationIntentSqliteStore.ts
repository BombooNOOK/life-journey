/**
 * Native SQLCipher Local Save Operation Intent store (4B-4O PoC).
 * Independent DB from mirror outbox. Reuses plugin Keychain secret (mode:"secret").
 * NSFileProtectionComplete + iOS backup exclude.
 * Never stores body/photo/secrets. Never opens ljd_local_journal.
 */

import { Capacitor } from "@capacitor/core";
import type { SQLiteDBConnection } from "@capacitor-community/sqlite";
import { LjdLocalSecurity } from "ljd-local-security";

import {
  LOCAL_SAVE_OPERATION_INTENT_POC_DB_NAME,
  LOCAL_SAVE_OPERATION_INTENT_SCHEMA_VERSION,
  type LocalSaveOperationIntentFailureCode,
  type LocalSaveOperationIntentRecord,
  type LocalSaveOperationIntentStatus,
  type LocalSaveOperationIntentStore,
} from "@/lib/local-first/journal/saveIntent/types";
import {
  applyCompleteFileProtection,
  closeNamedEncryptedDatabase,
  inspectFileProtection,
  openNamedEncryptedDatabase,
  resolveLjdApplicationSupportDir,
  safeErrorMessage,
} from "@/lib/local-first/security";
import { LocalFirstSecurityError } from "@/lib/local-first/security/types";

const CREATE_SQL = `
CREATE TABLE IF NOT EXISTS save_operation_intent (
  intent_id TEXT PRIMARY KEY NOT NULL,
  save_operation_id TEXT NOT NULL UNIQUE,
  actor_key TEXT NOT NULL,
  status TEXT NOT NULL,
  server_entry_id TEXT,
  request_fingerprint TEXT NOT NULL,
  draft_ref TEXT,
  created_at TEXT NOT NULL,
  last_attempt_at TEXT,
  completed_at TEXT,
  failure_code TEXT
);
`;

function assertNative(): void {
  if (!Capacitor.isNativePlatform()) {
    throw new LocalFirstSecurityError(
      "native_only",
      "save operation intent sqlite is native-only",
    );
  }
}

function mapRow(row: Record<string, unknown>): LocalSaveOperationIntentRecord {
  return {
    intentId: String(row.intent_id),
    saveOperationId: String(row.save_operation_id),
    actorKey: String(row.actor_key),
    status: String(row.status) as LocalSaveOperationIntentStatus,
    serverEntryId:
      row.server_entry_id == null ? null : String(row.server_entry_id),
    requestFingerprint: String(row.request_fingerprint),
    draftRef: row.draft_ref == null ? null : String(row.draft_ref),
    createdAt: String(row.created_at),
    lastAttemptAt:
      row.last_attempt_at == null ? null : String(row.last_attempt_at),
    completedAt: row.completed_at == null ? null : String(row.completed_at),
    failureCode: (row.failure_code == null
      ? null
      : String(row.failure_code)) as LocalSaveOperationIntentFailureCode,
  };
}

export async function resolveSaveIntentPocDbAbsolutePath(): Promise<string> {
  const asDir = await resolveLjdApplicationSupportDir();
  return `${asDir.ljdApplicationSupportDir}/${LOCAL_SAVE_OPERATION_INTENT_POC_DB_NAME}SQLite.db`;
}

export async function applySaveIntentBackupExclusionPolicy(
  absolutePath: string,
): Promise<{ isExcludedFromBackup: boolean | "unset" | "api_unavailable" }> {
  try {
    await LjdLocalSecurity.setExcludedFromBackup({
      path: absolutePath,
      excluded: true,
    });
    const attrs = await inspectFileProtection(absolutePath);
    return { isExcludedFromBackup: attrs.isExcludedFromBackup };
  } catch {
    return { isExcludedFromBackup: "api_unavailable" };
  }
}

export async function openLocalSaveOperationIntentSqliteStore(): Promise<{
  store: LocalSaveOperationIntentStore;
  close: () => Promise<void>;
  absolutePath: string;
  encrypted: true;
  completeProtection: boolean | null;
  backupExcluded: boolean | "unset" | "api_unavailable" | null;
}> {
  assertNative();
  {
    const db = await openNamedEncryptedDatabase(
      LOCAL_SAVE_OPERATION_INTENT_POC_DB_NAME,
      LOCAL_SAVE_OPERATION_INTENT_SCHEMA_VERSION,
    );
    await db.execute(CREATE_SQL);
    await db.execute(
      `PRAGMA user_version = ${LOCAL_SAVE_OPERATION_INTENT_SCHEMA_VERSION};`,
    );
    await closeNamedEncryptedDatabase(LOCAL_SAVE_OPERATION_INTENT_POC_DB_NAME);
  }

  const absolutePath = await resolveSaveIntentPocDbAbsolutePath();
  let completeProtection: boolean | null = null;
  try {
    await applyCompleteFileProtection(absolutePath);
    const attrs = await inspectFileProtection(absolutePath);
    completeProtection = attrs.fileProtection === "NSFileProtectionComplete";
  } catch {
    completeProtection = null;
  }
  const backup = await applySaveIntentBackupExclusionPolicy(absolutePath);

  return {
    store: createSqliteIntentStorePerOp(),
    absolutePath,
    encrypted: true,
    completeProtection,
    backupExcluded: backup.isExcludedFromBackup,
    async close() {
      await closeNamedEncryptedDatabase(LOCAL_SAVE_OPERATION_INTENT_POC_DB_NAME);
    },
  };
}

async function withIntentDb<T>(fn: (db: SQLiteDBConnection) => Promise<T>): Promise<T> {
  const db = await openNamedEncryptedDatabase(
    LOCAL_SAVE_OPERATION_INTENT_POC_DB_NAME,
    LOCAL_SAVE_OPERATION_INTENT_SCHEMA_VERSION,
  );
  try {
    return await fn(db);
  } finally {
    await closeNamedEncryptedDatabase(LOCAL_SAVE_OPERATION_INTENT_POC_DB_NAME);
  }
}

async function getByOpDb(
  db: SQLiteDBConnection,
  saveOperationId: string,
): Promise<LocalSaveOperationIntentRecord | null> {
  const res = await db.query(
    `SELECT * FROM save_operation_intent WHERE save_operation_id = ? LIMIT 1`,
    [saveOperationId],
  );
  const row = res.values?.[0] as Record<string, unknown> | undefined;
  return row ? mapRow(row) : null;
}

function createSqliteIntentStorePerOp(): LocalSaveOperationIntentStore {
  return {
    async findBySaveOperationId(saveOperationId) {
      return withIntentDb((db) => getByOpDb(db, saveOperationId));
    },
    async findByActorAndSaveOperationId(actorKey, saveOperationId) {
      return withIntentDb(async (db) => {
        const row = await getByOpDb(db, saveOperationId);
        if (!row || row.actorKey !== actorKey) return null;
        return row;
      });
    },
    async tryInsert(row) {
      return withIntentDb(async (db) => {
        const existing = await getByOpDb(db, row.saveOperationId);
        if (existing) return { created: false, row: existing };
        try {
          await db.run(
            `INSERT INTO save_operation_intent (
              intent_id, save_operation_id, actor_key, status,
              server_entry_id, request_fingerprint, draft_ref,
              created_at, last_attempt_at, completed_at, failure_code
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
            [
              row.intentId,
              row.saveOperationId,
              row.actorKey,
              row.status,
              row.serverEntryId,
              row.requestFingerprint,
              row.draftRef,
              row.createdAt,
              row.lastAttemptAt,
              row.completedAt,
              row.failureCode,
            ],
          );
        } catch (error) {
          const again = await getByOpDb(db, row.saveOperationId);
          if (again) return { created: false, row: again };
          throw new Error(safeErrorMessage(error));
        }
        return { created: true, row };
      });
    },
    async update(row) {
      return withIntentDb(async (db) => {
        const current = await getByOpDb(db, row.saveOperationId);
        if (!current) throw new Error("intent_missing");
        await db.run(
          `UPDATE save_operation_intent SET
            status = ?, server_entry_id = ?, request_fingerprint = ?,
            draft_ref = ?, last_attempt_at = ?, completed_at = ?, failure_code = ?
           WHERE save_operation_id = ? AND actor_key = ?`,
          [
            row.status,
            row.serverEntryId,
            row.requestFingerprint,
            row.draftRef,
            row.lastAttemptAt,
            row.completedAt,
            row.failureCode,
            row.saveOperationId,
            row.actorKey,
          ],
        );
        return (await getByOpDb(db, row.saveOperationId))!;
      });
    },
    async listByActor(actorKey) {
      return withIntentDb(async (db) => {
        const res = await db.query(
          `SELECT * FROM save_operation_intent
           WHERE actor_key = ? ORDER BY created_at ASC`,
          [actorKey],
        );
        return (res.values ?? []).map((r) =>
          mapRow(r as Record<string, unknown>),
        );
      });
    },
    async dumpRows() {
      return withIntentDb(async (db) => {
        const res = await db.query(
          `SELECT * FROM save_operation_intent ORDER BY created_at ASC`,
        );
        return (res.values ?? []).map((r) =>
          mapRow(r as Record<string, unknown>),
        );
      });
    },
  };
}
