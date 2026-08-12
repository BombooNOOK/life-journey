/**
 * Local Journal SQLite foundation — open / migrate / transaction helpers.
 * Native-only. Not invoked by Web journal save paths.
 *
 * 4B-3E: still plaintext (`no-encryption`). Encrypted open lives in
 * `src/lib/local-first/security/encryptedDatabase.ts` and must not be used
 * for `ljd_local_journal` until an explicit migration phase.
 */

import { Capacitor } from "@capacitor/core";
import {
  CapacitorSQLite,
  SQLiteConnection,
  type SQLiteDBConnection,
} from "@capacitor-community/sqlite";

import {
  LOCAL_JOURNAL_DB_NAME,
  LOCAL_JOURNAL_SCHEMA_USER_VERSION,
} from "@/lib/local-first/journal/types";

let connection: SQLiteConnection | null = null;
let db: SQLiteDBConnection | null = null;

export function assertLocalJournalNative(): void {
  if (!Capacitor.isNativePlatform()) {
    throw new Error("Local Journal foundation is native-only.");
  }
}

function getConnection(): SQLiteConnection {
  if (!connection) connection = new SQLiteConnection(CapacitorSQLite);
  return connection;
}

export const LOCAL_JOURNAL_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS local_journal_entries (
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
  ON local_journal_entries (date_key);

CREATE INDEX IF NOT EXISTS idx_local_journal_updated
  ON local_journal_entries (updated_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_local_journal_legacy_server
  ON local_journal_entries (legacy_server_id)
  WHERE legacy_server_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS local_journal_tags (
  journal_stable_id TEXT NOT NULL,
  tag TEXT NOT NULL,
  PRIMARY KEY (journal_stable_id, tag)
);

CREATE INDEX IF NOT EXISTS idx_local_journal_tags_tag
  ON local_journal_tags (tag);

CREATE TABLE IF NOT EXISTS local_media (
  stable_id TEXT PRIMARY KEY NOT NULL,
  journal_stable_id TEXT NOT NULL,
  type TEXT NOT NULL,
  relative_path TEXT NOT NULL,
  created_at TEXT NOT NULL,
  checksum TEXT,
  mime_type TEXT
);

CREATE INDEX IF NOT EXISTS idx_local_media_journal
  ON local_media (journal_stable_id);
`;

export const LOCAL_JOURNAL_EXPECTED_TABLES = [
  "local_journal_entries",
  "local_journal_tags",
  "local_media",
] as const;

export const LOCAL_JOURNAL_EXPECTED_COLUMNS: Record<
  (typeof LOCAL_JOURNAL_EXPECTED_TABLES)[number],
  readonly string[]
> = {
  local_journal_entries: [
    "stable_id",
    "date_key",
    "title",
    "content",
    "created_at",
    "updated_at",
    "tags_json",
    "schema_version",
    "source",
    "local_status",
    "imported_at",
    "legacy_server_id",
    "server_updated_at",
  ],
  local_journal_tags: ["journal_stable_id", "tag"],
  local_media: [
    "stable_id",
    "journal_stable_id",
    "type",
    "relative_path",
    "created_at",
    "checksum",
    "mime_type",
  ],
};

export async function readUserVersion(database: SQLiteDBConnection): Promise<number> {
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

export async function applyFoundationSchema(database: SQLiteDBConnection): Promise<void> {
  await database.execute(LOCAL_JOURNAL_SCHEMA_SQL);
  await database.execute(`PRAGMA user_version = ${LOCAL_JOURNAL_SCHEMA_USER_VERSION};`);
}

/**
 * Best-effort transaction. Cap SQLite execute may bundle statements;
 * callers should still treat Filesystem + SQLite as a logical unit.
 */
export async function withLocalJournalTransaction<T>(
  fn: (database: SQLiteDBConnection) => Promise<T>,
): Promise<T> {
  const database = await openLocalJournalDatabase();
  await database.execute("BEGIN;");
  try {
    const result = await fn(database);
    await database.execute("COMMIT;");
    return result;
  } catch (err) {
    try {
      await database.execute("ROLLBACK;");
    } catch {
      /* ignore rollback errors */
    }
    throw err;
  }
}

export async function openLocalJournalDatabase(): Promise<SQLiteDBConnection> {
  assertLocalJournalNative();
  if (db) return db;

  const sqlite = getConnection();
  const consistency = await sqlite.checkConnectionsConsistency();
  const isConn = (await sqlite.isConnection(LOCAL_JOURNAL_DB_NAME, false)).result;

  if (consistency.result && isConn) {
    db = await sqlite.retrieveConnection(LOCAL_JOURNAL_DB_NAME, false);
  } else {
    db = await sqlite.createConnection(
      LOCAL_JOURNAL_DB_NAME,
      false,
      "no-encryption",
      LOCAL_JOURNAL_SCHEMA_USER_VERSION,
      false,
    );
  }

  await db.open();

  const current = await readUserVersion(db);
  if (current < LOCAL_JOURNAL_SCHEMA_USER_VERSION) {
    await applyFoundationSchema(db);
  }

  return db;
}

export async function closeLocalJournalDatabase(): Promise<void> {
  if (!db) return;
  const sqlite = getConnection();
  await sqlite.closeConnection(LOCAL_JOURNAL_DB_NAME, false);
  db = null;
}
