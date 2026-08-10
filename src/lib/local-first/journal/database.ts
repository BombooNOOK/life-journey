/**
 * Shared SQLite open helpers for Local Journal Repository PoC.
 * Uses PRAGMA user_version for schema versioning (see docs).
 */

import { Capacitor } from "@capacitor/core";
import {
  CapacitorSQLite,
  SQLiteConnection,
  type SQLiteDBConnection,
} from "@capacitor-community/sqlite";

import {
  LOCAL_JOURNAL_REPO_DB_NAME,
  LOCAL_JOURNAL_SCHEMA_USER_VERSION,
} from "@/lib/local-first/journal/types";

let connection: SQLiteConnection | null = null;
let db: SQLiteDBConnection | null = null;

export function assertLocalJournalNative(): void {
  if (!Capacitor.isNativePlatform()) {
    throw new Error("Local Journal Repository PoC is native-only.");
  }
}

function getConnection(): SQLiteConnection {
  if (!connection) connection = new SQLiteConnection(CapacitorSQLite);
  return connection;
}

const SCHEMA_BASE = `
CREATE TABLE IF NOT EXISTS local_journal_entries_v1 (
  stable_id TEXT PRIMARY KEY NOT NULL,
  date_key TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  tags_json TEXT NOT NULL DEFAULT '[]',
  schema_version INTEGER NOT NULL,
  source TEXT NOT NULL,
  local_status TEXT NOT NULL,
  imported_at TEXT,
  legacy_server_id TEXT,
  server_updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_local_journal_date
  ON local_journal_entries_v1 (date_key);

CREATE INDEX IF NOT EXISTS idx_local_journal_updated
  ON local_journal_entries_v1 (updated_at);

CREATE TABLE IF NOT EXISTS local_journal_tags_v1 (
  journal_stable_id TEXT NOT NULL,
  tag TEXT NOT NULL,
  PRIMARY KEY (journal_stable_id, tag)
);

CREATE INDEX IF NOT EXISTS idx_local_journal_tags_tag
  ON local_journal_tags_v1 (tag);

CREATE TABLE IF NOT EXISTS local_media_v1 (
  stable_id TEXT PRIMARY KEY NOT NULL,
  journal_stable_id TEXT NOT NULL,
  type TEXT NOT NULL,
  relative_path TEXT NOT NULL,
  created_at TEXT NOT NULL,
  checksum TEXT,
  mime_type TEXT
);

CREATE INDEX IF NOT EXISTS idx_local_media_journal
  ON local_media_v1 (journal_stable_id);
`;

async function readUserVersion(database: SQLiteDBConnection): Promise<number> {
  const versionResult = await database.query("PRAGMA user_version;");
  const raw = versionResult.values?.[0] as Record<string, unknown> | undefined;
  const current =
    typeof raw?.user_version === "number"
      ? raw.user_version
      : typeof raw?.user_version === "string"
        ? Number(raw.user_version)
        : Number(Object.values(raw ?? {})[0] ?? 0);
  return Number.isFinite(current) ? current : 0;
}

async function migrateFresh(database: SQLiteDBConnection): Promise<void> {
  await database.execute(SCHEMA_BASE);
  await database.execute(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_local_journal_legacy_server
      ON local_journal_entries_v1 (legacy_server_id)
      WHERE legacy_server_id IS NOT NULL;
  `);
  await database.execute(`PRAGMA user_version = ${LOCAL_JOURNAL_SCHEMA_USER_VERSION};`);
}

async function migrateToV2(database: SQLiteDBConnection): Promise<void> {
  try {
    await database.execute(
      `ALTER TABLE local_journal_entries_v1 ADD COLUMN server_updated_at TEXT;`,
    );
  } catch {
    /* column may already exist */
  }
  await database.execute(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_local_journal_legacy_server
      ON local_journal_entries_v1 (legacy_server_id)
      WHERE legacy_server_id IS NOT NULL;
  `);
  await database.execute(`PRAGMA user_version = 2;`);
}

export async function openLocalJournalDatabase(): Promise<SQLiteDBConnection> {
  assertLocalJournalNative();
  if (db) return db;

  const sqlite = getConnection();
  const consistency = await sqlite.checkConnectionsConsistency();
  const isConn = (await sqlite.isConnection(LOCAL_JOURNAL_REPO_DB_NAME, false)).result;

  if (consistency.result && isConn) {
    db = await sqlite.retrieveConnection(LOCAL_JOURNAL_REPO_DB_NAME, false);
  } else {
    db = await sqlite.createConnection(
      LOCAL_JOURNAL_REPO_DB_NAME,
      false,
      "no-encryption",
      LOCAL_JOURNAL_SCHEMA_USER_VERSION,
      false,
    );
  }

  await db.open();

  const current = await readUserVersion(db);
  if (current < 1) {
    await migrateFresh(db);
  } else if (current < 2) {
    await migrateToV2(db);
  }

  return db;
}

export async function closeLocalJournalDatabase(): Promise<void> {
  if (!db) return;
  const sqlite = getConnection();
  await sqlite.closeConnection(LOCAL_JOURNAL_REPO_DB_NAME, false);
  db = null;
}
