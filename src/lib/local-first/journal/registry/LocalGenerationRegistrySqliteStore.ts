/**
 * Native plain SQLite generation registry under Application Support (4B-4K PoC).
 * NSFileProtectionComplete + iOS backup included.
 * Never stores body/photo/secrets. Never opens ljd_local_journal.
 */

import { Capacitor } from "@capacitor/core";
import type { SQLiteDBConnection } from "@capacitor-community/sqlite";

import {
  createMemoryLocalGenerationRegistryStore,
  type LocalGenerationRegistryStore,
} from "@/lib/local-first/journal/registry/LocalGenerationRegistryStore";
import {
  closeNamedPlainDatabase,
  openNamedPlainDatabase,
} from "@/lib/local-first/journal/registry/plainSqliteDatabase";
import {
  isPlaintextActualDatabaseId,
  isValidLifecycleState,
  isValidSchemaVersion,
  LOCAL_GENERATION_REGISTRY_POC_DB_NAME,
  REGISTRY_FORMAT_VERSION,
  type GenerationIntegrityStatus,
  type GenerationLifecycleState,
  type GenerationRegistryRow,
} from "@/lib/local-first/journal/registry/types";
import {
  applyCompleteFileProtection,
  ensurePathIncludedInBackup,
  inspectFileProtection,
  resolveLjdApplicationSupportDir,
  safeErrorMessage,
} from "@/lib/local-first/security";
import { LocalFirstSecurityError } from "@/lib/local-first/security/types";

const CREATE_SQL = `
CREATE TABLE IF NOT EXISTS generation_registry (
  generation_id TEXT PRIMARY KEY NOT NULL,
  database_id TEXT NOT NULL UNIQUE,
  media_root_id TEXT NOT NULL UNIQUE,
  schema_version INTEGER NOT NULL,
  lifecycle_state TEXT NOT NULL,
  integrity_status TEXT NOT NULL,
  legacy_generation_alias TEXT,
  created_at TEXT NOT NULL,
  activated_at TEXT,
  previous_at TEXT,
  retired_at TEXT,
  quarantined_at TEXT,
  registry_format_version INTEGER NOT NULL,
  UNIQUE(database_id, media_root_id)
);
`;

function assertNative(): void {
  if (!Capacitor.isNativePlatform()) {
    throw new LocalFirstSecurityError("native_only", "registry sqlite is native-only");
  }
}

function newGenerationId(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return `gen_${[...arr].map((b) => b.toString(16).padStart(2, "0")).join("")}`;
}

function mapRow(row: Record<string, unknown>): GenerationRegistryRow | null {
  const lifecycleState = String(row.lifecycle_state);
  if (!isValidLifecycleState(lifecycleState)) return null;
  const schemaVersion = Number(row.schema_version);
  if (!isValidSchemaVersion(schemaVersion)) return null;
  return {
    generationId: String(row.generation_id),
    databaseId: String(row.database_id),
    mediaRootId: String(row.media_root_id),
    schemaVersion,
    lifecycleState,
    integrityStatus: String(row.integrity_status) as GenerationIntegrityStatus,
    legacyGenerationAlias:
      row.legacy_generation_alias == null
        ? null
        : String(row.legacy_generation_alias),
    createdAt: String(row.created_at),
    activatedAt: row.activated_at == null ? null : String(row.activated_at),
    previousAt: row.previous_at == null ? null : String(row.previous_at),
    retiredAt: row.retired_at == null ? null : String(row.retired_at),
    quarantinedAt:
      row.quarantined_at == null ? null : String(row.quarantined_at),
    registryFormatVersion: Number(
      row.registry_format_version,
    ) as typeof REGISTRY_FORMAT_VERSION,
  };
}

export async function resolveRegistryPocDbAbsolutePath(): Promise<string> {
  const asDir = await resolveLjdApplicationSupportDir();
  return `${asDir.ljdApplicationSupportDir}/${LOCAL_GENERATION_REGISTRY_POC_DB_NAME}SQLite.db`;
}

export async function openLocalGenerationRegistrySqliteStore(): Promise<{
  store: LocalGenerationRegistryStore;
  close: () => Promise<void>;
  absolutePath: string;
  encrypted: false;
  completeProtection: boolean | null;
  backupIncluded: boolean | "unset" | "api_unavailable" | null;
}> {
  assertNative();
  {
    const db = await openNamedPlainDatabase(
      LOCAL_GENERATION_REGISTRY_POC_DB_NAME,
      REGISTRY_FORMAT_VERSION,
    );
    await db.execute(CREATE_SQL);
    await db.execute(`PRAGMA user_version = ${REGISTRY_FORMAT_VERSION};`);
    await closeNamedPlainDatabase(LOCAL_GENERATION_REGISTRY_POC_DB_NAME);
  }

  const absolutePath = await resolveRegistryPocDbAbsolutePath();
  let completeProtection: boolean | null = null;
  let backupIncluded: boolean | "unset" | "api_unavailable" | null = null;
  try {
    await applyCompleteFileProtection(absolutePath);
    const attrs = await inspectFileProtection(absolutePath);
    completeProtection = attrs.fileProtection === "NSFileProtectionComplete";
    const backup = await ensurePathIncludedInBackup(absolutePath);
    backupIncluded = backup.isExcludedFromBackup === false;
  } catch {
    completeProtection = null;
    backupIncluded = "api_unavailable";
  }

  return {
    store: createSqliteRegistryStorePerOp(),
    absolutePath,
    encrypted: false,
    completeProtection,
    backupIncluded,
    async close() {
      await closeNamedPlainDatabase(LOCAL_GENERATION_REGISTRY_POC_DB_NAME);
    },
  };
}

async function withRegistryDb<T>(fn: (db: SQLiteDBConnection) => Promise<T>): Promise<T> {
  const db = await openNamedPlainDatabase(
    LOCAL_GENERATION_REGISTRY_POC_DB_NAME,
    REGISTRY_FORMAT_VERSION,
  );
  try {
    return await fn(db);
  } finally {
    await closeNamedPlainDatabase(LOCAL_GENERATION_REGISTRY_POC_DB_NAME);
  }
}

function createSqliteRegistryStorePerOp(): LocalGenerationRegistryStore {
  return {
    async exists() {
      return withRegistryDb(async (db) => {
        const res = await db.query(`SELECT COUNT(*) AS c FROM generation_registry`);
        const c = Number((res.values?.[0] as Record<string, unknown>)?.c ?? 0);
        return c > 0;
      });
    },
    async listAll() {
      return withRegistryDb(async (db) => {
        const res = await db.query(
          `SELECT * FROM generation_registry ORDER BY created_at ASC`,
        );
        return (res.values ?? [])
          .map((r) => mapRow(r as Record<string, unknown>))
          .filter((r): r is GenerationRegistryRow => r != null);
      });
    },
    async findByGenerationId(generationId) {
      return withRegistryDb(async (db) => {
        const res = await db.query(
          `SELECT * FROM generation_registry WHERE generation_id = ? LIMIT 1`,
          [generationId],
        );
        const row = res.values?.[0] as Record<string, unknown> | undefined;
        return row ? mapRow(row) : null;
      });
    },
    async findByDatabaseId(databaseId) {
      return withRegistryDb(async (db) => {
        const res = await db.query(
          `SELECT * FROM generation_registry WHERE database_id = ? LIMIT 1`,
          [databaseId],
        );
        const row = res.values?.[0] as Record<string, unknown> | undefined;
        return row ? mapRow(row) : null;
      });
    },
    async findByPair(databaseId, mediaRootId) {
      return withRegistryDb(async (db) => {
        const res = await db.query(
          `SELECT * FROM generation_registry WHERE database_id = ? AND media_root_id = ? LIMIT 1`,
          [databaseId, mediaRootId],
        );
        const row = res.values?.[0] as Record<string, unknown> | undefined;
        return row ? mapRow(row) : null;
      });
    },
    async countByLifecycleState(state) {
      return withRegistryDb(async (db) => {
        const res = await db.query(
          `SELECT COUNT(*) AS c FROM generation_registry WHERE lifecycle_state = ?`,
          [state],
        );
        return Number((res.values?.[0] as Record<string, unknown>)?.c ?? 0);
      });
    },
    async initializeCurrentCandidate(input) {
      if (isPlaintextActualDatabaseId(input.databaseId)) {
        throw new Error("plaintext_forbidden");
      }
      if (!isValidSchemaVersion(input.schemaVersion)) {
        throw new Error("invalid_schema_version");
      }
      if (!isValidLifecycleState(input.lifecycleState)) {
        throw new Error("invalid_lifecycle_state");
      }
      return withRegistryDb(async (db) => {
        const existing = await db.query(
          `SELECT * FROM generation_registry WHERE database_id = ? AND media_root_id = ? LIMIT 1`,
          [input.databaseId, input.mediaRootId],
        );
        const existingRow = existing.values?.[0] as Record<string, unknown> | undefined;
        if (existingRow) {
          const mapped = mapRow(existingRow);
          if (!mapped) throw new Error("registry_corrupt_row");
          return { row: mapped, created: false };
        }
        const now = input.now ?? new Date().toISOString();
        const row: GenerationRegistryRow = {
          generationId: input.generationId ?? newGenerationId(),
          databaseId: input.databaseId,
          mediaRootId: input.mediaRootId,
          schemaVersion: input.schemaVersion,
          lifecycleState: input.lifecycleState,
          integrityStatus: input.integrityStatus,
          legacyGenerationAlias: input.legacyGenerationAlias,
          createdAt: now,
          activatedAt: input.activatedAt ?? null,
          previousAt: null,
          retiredAt: null,
          quarantinedAt: null,
          registryFormatVersion: REGISTRY_FORMAT_VERSION,
        };
        try {
          await db.run(
            `INSERT INTO generation_registry (
              generation_id, database_id, media_root_id, schema_version,
              lifecycle_state, integrity_status, legacy_generation_alias,
              created_at, activated_at, previous_at, retired_at, quarantined_at,
              registry_format_version
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
              row.generationId,
              row.databaseId,
              row.mediaRootId,
              row.schemaVersion,
              row.lifecycleState,
              row.integrityStatus,
              row.legacyGenerationAlias,
              row.createdAt,
              row.activatedAt,
              row.previousAt,
              row.retiredAt,
              row.quarantinedAt,
              row.registryFormatVersion,
            ],
          );
        } catch (error) {
          const again = await db.query(
            `SELECT * FROM generation_registry WHERE database_id = ? AND media_root_id = ? LIMIT 1`,
            [input.databaseId, input.mediaRootId],
          );
          const againRow = again.values?.[0] as Record<string, unknown> | undefined;
          if (againRow) {
            const mapped = mapRow(againRow);
            if (mapped) return { row: mapped, created: false };
          }
          throw new Error(safeErrorMessage(error));
        }
        return { row, created: true };
      });
    },
  };
}

export { createMemoryLocalGenerationRegistryStore };
