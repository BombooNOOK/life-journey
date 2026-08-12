/**
 * Native SQLCipher outbox under Application Support (4B-4I PoC).
 * Uses plugin built-in Keychain secret (same path as candidate journal).
 * Never opens ljd_local_journal. Never stores body/photo/secrets.
 */

import { Capacitor } from "@capacitor/core";
import type { SQLiteDBConnection } from "@capacitor-community/sqlite";
import { LjdLocalSecurity } from "ljd-local-security";

import { isPlaintextProductionDatabaseId } from "@/lib/local-first/journal/generation/ResolvedLocalJournalGeneration";
import {
  createMemoryLocalMirrorOutboxStore,
  type LocalMirrorOutboxStore,
} from "@/lib/local-first/journal/outbox/LocalMirrorOutboxStore";
import {
  LOCAL_MIRROR_OUTBOX_POC_DB_NAME,
  LOCAL_MIRROR_OUTBOX_SCHEMA_VERSION,
  opaqueGenerationIdFromResolved,
  type EnqueueInput,
  type LocalMirrorOutboxItem,
  type OutboxLastResult,
} from "@/lib/local-first/journal/outbox/types";
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
CREATE TABLE IF NOT EXISTS mirror_outbox (
  id TEXT PRIMARY KEY NOT NULL,
  server_entry_id TEXT NOT NULL,
  target_generation_id TEXT NOT NULL,
  target_database_id TEXT NOT NULL,
  target_media_root_id TEXT NOT NULL,
  target_schema_version INTEGER NOT NULL,
  manifest_checksum_at_enqueue TEXT NOT NULL,
  requested_at TEXT NOT NULL,
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_result TEXT,
  last_attempt_at TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(server_entry_id, target_generation_id)
);
`;

function assertNative(): void {
  if (!Capacitor.isNativePlatform()) {
    throw new LocalFirstSecurityError("native_only", "outbox sqlite is native-only");
  }
}

function assertEnqueueTarget(input: EnqueueInput): void {
  if (!input.serverEntryId.trim()) throw new Error("serverEntryId_required");
  if (isPlaintextProductionDatabaseId(input.target.databaseId)) {
    throw new Error("plaintext_forbidden");
  }
}

function newId(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return [...arr].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function mapRow(row: Record<string, unknown>): LocalMirrorOutboxItem {
  return {
    id: String(row.id),
    serverEntryId: String(row.server_entry_id),
    targetGenerationId: String(row.target_generation_id),
    targetDatabaseId: String(row.target_database_id),
    targetMediaRootId: String(row.target_media_root_id),
    targetSchemaVersion: Number(row.target_schema_version),
    manifestChecksumAtEnqueue: String(row.manifest_checksum_at_enqueue),
    requestedAt: String(row.requested_at),
    retryCount: Number(row.retry_count ?? 0),
    lastResult: (row.last_result == null
      ? null
      : String(row.last_result)) as OutboxLastResult,
    lastAttemptAt:
      row.last_attempt_at == null ? null : String(row.last_attempt_at),
    createdAt: String(row.created_at),
  };
}

export async function resolveOutboxPocDbAbsolutePath(): Promise<string> {
  const asDir = await resolveLjdApplicationSupportDir();
  return `${asDir.ljdApplicationSupportDir}/${LOCAL_MIRROR_OUTBOX_POC_DB_NAME}SQLite.db`;
}

/**
 * Backup policy candidate (4B-4I): exclude outbox from iOS backup.
 * Transient operational queue; Moving Package should not include it.
 * Server remains SoT — stale pending after restore is undesirable.
 */
export async function applyOutboxBackupExclusionPolicy(
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

export async function openLocalMirrorOutboxSqliteStore(): Promise<{
  store: LocalMirrorOutboxStore;
  close: () => Promise<void>;
  absolutePath: string;
  encrypted: true;
  completeProtection: boolean | null;
  backupExcluded: boolean | "unset" | "api_unavailable" | null;
}> {
  assertNative();
  // Ensure DB file + schema exist, then close so candidate opens do not
  // invalidate a held outbox connection (plugin consistency).
  {
    const db = await openNamedEncryptedDatabase(
      LOCAL_MIRROR_OUTBOX_POC_DB_NAME,
      LOCAL_MIRROR_OUTBOX_SCHEMA_VERSION,
    );
    await db.execute(CREATE_SQL);
    await db.execute(
      `PRAGMA user_version = ${LOCAL_MIRROR_OUTBOX_SCHEMA_VERSION};`,
    );
    await closeNamedEncryptedDatabase(LOCAL_MIRROR_OUTBOX_POC_DB_NAME);
  }

  const absolutePath = await resolveOutboxPocDbAbsolutePath();
  let completeProtection: boolean | null = null;
  try {
    await applyCompleteFileProtection(absolutePath);
    const attrs = await inspectFileProtection(absolutePath);
    completeProtection = attrs.fileProtection === "NSFileProtectionComplete";
  } catch {
    completeProtection = null;
  }
  const backup = await applyOutboxBackupExclusionPolicy(absolutePath);

  const store = createSqliteOutboxStorePerOp();
  return {
    store,
    absolutePath,
    encrypted: true,
    completeProtection,
    backupExcluded: backup.isExcludedFromBackup,
    async close() {
      await closeNamedEncryptedDatabase(LOCAL_MIRROR_OUTBOX_POC_DB_NAME);
    },
  };
}

async function withOutboxDb<T>(fn: (db: SQLiteDBConnection) => Promise<T>): Promise<T> {
  const db = await openNamedEncryptedDatabase(
    LOCAL_MIRROR_OUTBOX_POC_DB_NAME,
    LOCAL_MIRROR_OUTBOX_SCHEMA_VERSION,
  );
  try {
    return await fn(db);
  } finally {
    await closeNamedEncryptedDatabase(LOCAL_MIRROR_OUTBOX_POC_DB_NAME);
  }
}

function createSqliteOutboxStorePerOp(): LocalMirrorOutboxStore {
  return {
    async enqueue(input) {
      assertEnqueueTarget(input);
      const targetGenerationId = opaqueGenerationIdFromResolved(input.target);
      return withOutboxDb(async (db) => {
        const existing = await findByServerAndGenerationDb(
          db,
          input.serverEntryId,
          targetGenerationId,
        );
        if (existing) return { item: existing, created: false };

        const now = input.now ?? new Date().toISOString();
        const item: LocalMirrorOutboxItem = {
          id: input.id ?? newId(),
          serverEntryId: input.serverEntryId,
          targetGenerationId,
          targetDatabaseId: input.target.databaseId,
          targetMediaRootId: input.target.mediaRootId,
          targetSchemaVersion: input.target.schemaVersion,
          manifestChecksumAtEnqueue: input.target.manifestChecksum,
          requestedAt: now,
          retryCount: 0,
          lastResult: null,
          lastAttemptAt: null,
          createdAt: now,
        };

        try {
          await db.run(
            `INSERT INTO mirror_outbox (
              id, server_entry_id, target_generation_id,
              target_database_id, target_media_root_id, target_schema_version,
              manifest_checksum_at_enqueue, requested_at, retry_count,
              last_result, last_attempt_at, created_at
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
              item.id,
              item.serverEntryId,
              item.targetGenerationId,
              item.targetDatabaseId,
              item.targetMediaRootId,
              item.targetSchemaVersion,
              item.manifestChecksumAtEnqueue,
              item.requestedAt,
              item.retryCount,
              item.lastResult,
              item.lastAttemptAt,
              item.createdAt,
            ],
          );
        } catch (error) {
          const again = await findByServerAndGenerationDb(
            db,
            input.serverEntryId,
            targetGenerationId,
          );
          if (again) return { item: again, created: false };
          throw new Error(safeErrorMessage(error));
        }
        return { item, created: true };
      });
    },

    async getById(id) {
      return withOutboxDb(async (db) => getByIdDb(db, id));
    },

    async findByServerAndGeneration(serverEntryId, targetGenerationId) {
      return withOutboxDb(async (db) =>
        findByServerAndGenerationDb(db, serverEntryId, targetGenerationId),
      );
    },

    async listPending() {
      return withOutboxDb(async (db) => {
        const res = await db.query(
          `SELECT * FROM mirror_outbox ORDER BY created_at ASC`,
        );
        return (res.values ?? []).map((r) =>
          mapRow(r as Record<string, unknown>),
        );
      });
    },

    async updateAttempt(input) {
      return withOutboxDb(async (db) => {
        const current = await getByIdDb(db, input.id);
        if (!current) throw new Error("outbox_item_missing");
        const nextCount = input.incrementRetry
          ? current.retryCount + 1
          : current.retryCount;
        await db.run(
          `UPDATE mirror_outbox
           SET last_result = ?, last_attempt_at = ?, retry_count = ?
           WHERE id = ?`,
          [input.lastResult, input.lastAttemptAt, nextCount, input.id],
        );
        return (await getByIdDb(db, input.id))!;
      });
    },

    async ackRemove(id) {
      return withOutboxDb(async (db) => {
        const current = await getByIdDb(db, id);
        if (!current) return false;
        await db.run(`DELETE FROM mirror_outbox WHERE id = ?`, [id]);
        return true;
      });
    },

    async dumpRows() {
      return this.listPending();
    },
  };
}

async function getByIdDb(
  db: SQLiteDBConnection,
  id: string,
): Promise<LocalMirrorOutboxItem | null> {
  const res = await db.query(
    `SELECT * FROM mirror_outbox WHERE id = ? LIMIT 1`,
    [id],
  );
  const row = res.values?.[0] as Record<string, unknown> | undefined;
  return row ? mapRow(row) : null;
}

async function findByServerAndGenerationDb(
  db: SQLiteDBConnection,
  serverEntryId: string,
  targetGenerationId: string,
): Promise<LocalMirrorOutboxItem | null> {
  const res = await db.query(
    `SELECT * FROM mirror_outbox
     WHERE server_entry_id = ? AND target_generation_id = ?
     LIMIT 1`,
    [serverEntryId, targetGenerationId],
  );
  const row = res.values?.[0] as Record<string, unknown> | undefined;
  return row ? mapRow(row) : null;
}

/** Test-only: memory store factory re-export for fixtures. */
export { createMemoryLocalMirrorOutboxStore };
